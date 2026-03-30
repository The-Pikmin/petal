import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import type { Session } from "@supabase/supabase-js";
import type { ApiUser } from "$lib/types/api.types";
import { supabase } from "$lib/services/supabase";
import { getCurrentUserProfile } from "$lib/services/profile.service";
import { theme } from "$lib/stores/theme.store";

interface AuthState {
	user: ApiUser | null;
	session: Session | null;
	profile: ApiUser | null;
	initialized: boolean;
}

class AuthProviderError extends Error {
	status?: number;

	constructor(message: string, status?: number) {
		super(message);
		this.name = "AuthProviderError";
		this.status = status;
	}
}

function createAuthStore() {
	const { subscribe, set } = writable<AuthState>({
		user: null,
		session: null,
		profile: null,
		initialized: false,
	});
	let authStateSubscription: { unsubscribe: () => void } | null = null;
	let activeSessionToken: string | null = null;

	function buildFallbackUser(session: Session): ApiUser {
		const metadata = session.user.user_metadata ?? {};
		const email = session.user.email ?? "";
		const username =
			metadata.username ??
			metadata.user_name ??
			metadata.full_name ??
			metadata.name ??
			(email.includes("@") ? email.split("@")[0] : "Gardener");

		return {
			id: session.user.id,
			username,
			email,
			display_name: username,
			avatar_url: "",
			joined_at: new Date().toISOString(),
			settings: {
				theme: "auto",
				notifications: {
					enabled: true,
					scan_reminders: true,
					care_reminders: true,
				},
				privacy: {
					share_data: false,
					analytics_enabled: true,
				},
			},
		};
	}

	async function retryFetchProfile(session: Session): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, 1200));
		if (activeSessionToken !== session.access_token) {
			return;
		}

		const user = await fetchProfile();
		if (!user || activeSessionToken !== session.access_token) {
			return;
		}

		set({
			user,
			session,
			profile: user,
			initialized: true,
		});
		await theme.applyRemoteTheme(user.settings.theme);
	}

	async function fetchProfile(): Promise<ApiUser | null> {
		try {
			return await getCurrentUserProfile();
		} catch {
			return null;
		}
	}

	async function syncSession(session: Session | null): Promise<void> {
		if (session) {
			const fallbackUser = buildFallbackUser(session);
			set({
				user: fallbackUser,
				session,
				profile: fallbackUser,
				initialized: true,
			});
			activeSessionToken = session.access_token;
			const user = await fetchProfile();
			if (activeSessionToken !== session.access_token) {
				return;
			}
			if (!user) {
				void retryFetchProfile(session);
				return;
			}
			set({
				user,
				session,
				profile: user,
				initialized: true,
			});
			await theme.applyRemoteTheme(user.settings.theme);
		} else {
			activeSessionToken = null;
			set({ user: null, session: null, profile: null, initialized: true });
		}
	}

	return {
		subscribe,

		async setProfile(user: ApiUser | null): Promise<void> {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			set({
				user,
				session,
				profile: user,
				initialized: true,
			});
			if (user) {
				await theme.applyRemoteTheme(user.settings.theme);
			}
		},

		async refresh(): Promise<void> {
			if (!browser) return;

			const {
				data: { session },
			} = await supabase.auth.getSession();

			await syncSession(session);
		},

		async initialize(): Promise<void> {
			if (!browser) return;

			const {
				data: { session },
			} = await supabase.auth.getSession();

			await syncSession(session);

			if (!authStateSubscription) {
				const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
					await syncSession(session);
				});
				authStateSubscription = data.subscription;
			}
		},

		async loginWithEmail(email: string, password: string): Promise<void> {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				throw new AuthProviderError(error.message, error.status);
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
				throw new AuthProviderError(error.message, error.status);
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
