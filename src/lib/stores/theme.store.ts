import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

// Initialize theme from localStorage or default to light
const getInitialTheme = (): Theme => {
    if (!browser) return 'light';

    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    return 'light';
};

function createThemeStore() {
    const { subscribe, set } = writable<Theme>(getInitialTheme());

    return {
        subscribe,
        toggle: () => {
            const newTheme = getInitialTheme() === 'light' ? 'dark' : 'light';
            set(newTheme);

            if (browser) {
                localStorage.setItem('theme', newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
                if (newTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        },
        setTheme: (theme: Theme) => {
            set(theme);

            if (browser) {
                localStorage.setItem('theme', theme);
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        }
    };
}

export const theme = createThemeStore();

// Initialize theme on load
if (browser) {
    const initialTheme = getInitialTheme();
    document.documentElement.setAttribute('data-theme', initialTheme);
    if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}
