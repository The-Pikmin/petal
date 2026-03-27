import { goto } from "$app/navigation";
import { Capacitor } from "@capacitor/core";
import { get } from "svelte/store";
import { auth } from "$lib/stores/auth.store";
import { hasSeenOnboarding } from "$lib/stores/onboarding.store";

export function requireAuth(): () => void {
	const unsubscribe = auth.subscribe(($auth) => {
		if ($auth.initialized && !$auth.session) {
			goto("/login");
		}
	});
	return unsubscribe;
}

export function requireGuest(): () => void {
	const unsubscribe = auth.subscribe(($auth) => {
		if ($auth.initialized && $auth.session) {
			if (Capacitor.isNativePlatform()) {
				goto(get(hasSeenOnboarding) ? "/home" : "/onboarding");
			} else {
				goto("/home");
			}
		}
	});
	return unsubscribe;
}
