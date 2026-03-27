import { goto } from "$app/navigation";
import { auth } from "$lib/stores/auth.store";

export function requireAuth(): () => void {
	const unsubscribe = auth.subscribe(($auth) => {
		if ($auth.initialized && !$auth.user) {
			goto("/login");
		}
	});
	return unsubscribe;
}

export function requireGuest(): () => void {
	const unsubscribe = auth.subscribe(($auth) => {
		if ($auth.initialized && $auth.user) {
			goto("/home");
		}
	});
	return unsubscribe;
}
