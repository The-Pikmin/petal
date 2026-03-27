import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import type { Session } from "@supabase/supabase-js";
import type { ApiUser } from "$lib/types/api.types";
import { supabase } from "$lib/services/supabase";
import { apiFetch } from "$lib/services/api";

interface AuthState {
	user: ApiUser | null;
	session: Session | null;
	profile: { username: string; email: string } | null;
	initialized: boolean;
}

function createAuthStore() {
	const { subscribe, set } = writable<AuthState>({
		user: null,
		session: null,
		profile: null,
		initialized: false,
	});

	async function fetchProfile(_session: Session): Promise<ApiUser | null> {
		try {
			return await apiFetch<ApiUser>("/me/");
		} catch {
			return null;
		}
	}

	return {
		subscribe,

		async initialize(): Promise<void> {
			if (!browser) return;

			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (session) {
				const user = await fetchProfile(session);
				set({
					user,
					session,
					profile: user ? { username: user.username, email: user.email } : null,
					initialized: true,
				});
			} else {
				set({ user: null, session: null, profile: null, initialized: true });
			}

			supabase.auth.onAuthStateChange(async (event, session) => {
				if (session) {
					const user = await fetchProfile(session);
					set({
						user,
						session,
						profile: user ? { username: user.username, email: user.email } : null,
						initialized: true,
					});
				} else {
					set({ user: null, session: null, profile: null, initialized: true });
				}
			});
		},

		async loginWithEmail(email: string, password: string): Promise<void> {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				const err = new Error(error.message);
				(err as any).status = error.status;
				throw err;
			}
			// onAuthStateChange will update the store
		},

		async signUpWithEmail(email: string, password: string, username?: string): Promise<void> {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: username ? { username } : undefined,
				},
			});
			if (error) {
				const err = new Error(error.message);
				(err as any).status = error.status;
				throw err;
			}
			// onAuthStateChange will update the store
		},

		async loginWithGoogle(): Promise<void> {
			const isNative = Capacitor.isNativePlatform();
			const redirectTo = isNative
				? "com.greeneye.app://login-callback"
				: browser
					? `${window.location.origin}/home`
					: undefined;
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: { redirectTo, skipBrowserRedirect: isNative },
			});
			if (error) throw new Error(error.message);
			if (isNative && data.url) {
				await Browser.open({ url: data.url });
			}
		},

		async loginWithApple(): Promise<void> {
			const isNative = Capacitor.isNativePlatform();
			const redirectTo = isNative
				? "com.greeneye.app://login-callback"
				: browser
					? `${window.location.origin}/home`
					: undefined;
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "apple",
				options: { redirectTo, skipBrowserRedirect: isNative },
			});
			if (error) throw new Error(error.message);
			if (isNative && data.url) {
				await Browser.open({ url: data.url });
			}
		},

		async resetPasswordForEmail(email: string): Promise<void> {
			const redirectTo = browser ? `${window.location.origin}/login` : undefined;
			const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
			if (error) throw new Error(error.message);
		},

		async logout(): Promise<void> {
			await supabase.auth.signOut();
			set({ user: null, session: null, profile: null, initialized: true });
		},
	};
}

export const auth = createAuthStore();
export const isAuthenticated = derived(auth, ($auth) => !!$auth.user);
export const currentUser = derived(auth, ($auth) => $auth.user);
export const authInitialized = derived(auth, ($auth) => $auth.initialized);
