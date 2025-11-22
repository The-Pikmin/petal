import { writable } from "svelte/store";
import { browser } from "$app/environment";

const STORAGE_KEY = "hasSeenOnboarding";

function createOnboardingStore() {
	// Initialize from localStorage if available
	const initialValue = browser ? localStorage.getItem(STORAGE_KEY) === "true" : false;
	const { subscribe, set } = writable(initialValue);

	return {
		subscribe,
		complete: () => {
			set(true);
			if (browser) {
				localStorage.setItem(STORAGE_KEY, "true");
			}
		},
		reset: () => {
			set(false);
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
		},
	};
}

export const hasSeenOnboarding = createOnboardingStore();
