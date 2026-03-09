import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import { isAuthenticated, authInitialized } from '$lib/stores/auth.store';

export function requireAuth(): () => void {
    const unsubscribe = authInitialized.subscribe((initialized) => {
        if (initialized && !get(isAuthenticated)) {
            goto('/login');
        }
    });
    return unsubscribe;
}

export function requireGuest(): () => void {
    const unsubscribe = authInitialized.subscribe((initialized) => {
        if (initialized && get(isAuthenticated)) {
            goto('/home');
        }
    });
    return unsubscribe;
}
