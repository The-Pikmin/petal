import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { supabase } from "$lib/services/supabase";
import { updateUserSettings } from "$lib/services/profile.service";

export type Theme = "light" | "dark" | "auto";
export type AppliedTheme = "light" | "dark";

function resolveAppliedTheme(theme: Theme): AppliedTheme {
	if (!browser) return "light";
	if (theme === "auto") {
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}
	return theme;
}

function readStoredTheme(): Theme {
	if (!browser) return "light";
	const stored = localStorage.getItem("theme");
	return stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
}

function applyTheme(theme: Theme) {
	if (!browser) return;
	const appliedTheme = resolveAppliedTheme(theme);
	localStorage.setItem("theme", theme);
	document.documentElement.setAttribute("data-theme", appliedTheme);
	if (appliedTheme === "dark") {
		document.documentElement.classList.add("dark");
	} else {
		document.documentElement.classList.remove("dark");
	}
}

async function persistRemoteTheme(theme: Theme) {
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session) return;
	try {
		await updateUserSettings({ theme });
	} catch {
		// Keep local theme changes even if remote sync fails.
	}
}

function createThemeStore() {
	const initialPreference = readStoredTheme();
	const { subscribe, set } = writable<AppliedTheme>(resolveAppliedTheme(initialPreference));
	let currentPreference = initialPreference;

	async function setTheme(theme: Theme, options: { syncRemote?: boolean } = {}) {
		const { syncRemote = true } = options;
		currentPreference = theme;
		set(resolveAppliedTheme(theme));
		applyTheme(theme);
		if (syncRemote) {
			await persistRemoteTheme(theme);
		}
	}

	async function toggle() {
		const nextTheme: Theme =
			resolveAppliedTheme(currentPreference) === "light" ? "dark" : "light";
		await setTheme(nextTheme);
	}

	return {
		subscribe,
		toggle,
		setTheme,
		applyRemoteTheme: async (theme: Theme) => setTheme(theme, { syncRemote: false }),
	};
}

export const theme = createThemeStore();

if (browser) {
	applyTheme(readStoredTheme());
}
