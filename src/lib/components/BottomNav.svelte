<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    let currentPath = $derived($page.url.pathname);

    const navItems = [
        { icon: "🏠", label: "Home", path: "/" },
        { icon: "📚", label: "Library", path: "/library" },
        { icon: "📸", label: "Scan", path: "/camera", isCenter: true },
        { icon: "📋", label: "History", path: "/history" },
        { icon: "👤", label: "Profile", path: "/profile" },
    ];

    function navigate(path: string) {
        goto(path);
    }
</script>

<nav
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40"
    style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
>
    <div class="max-w-screen-xl mx-auto px-4">
        <div class="flex items-center justify-around h-16 relative">
            {#each navItems as item}
                {#if item.isCenter}
                    <!-- Center Camera Button (Elevated) -->
                    <button
                        onclick={() => navigate(item.path)}
                        class="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                        style="background-color: var(--color-primary); box-shadow: var(--shadow-xl);"
                        aria-label={item.label}
                    >
                        <span class="text-2xl">{item.icon}</span>
                    </button>
                {:else}
                    <!-- Regular Nav Item -->
                    <button
                        onclick={() => navigate(item.path)}
                        class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200"
                        class:active={currentPath === item.path}
                        aria-label={item.label}
                    >
                        <span
                            class="text-xl"
                            class:opacity-100={currentPath === item.path}
                            class:opacity-50={currentPath !== item.path}
                        >
                            {item.icon}
                        </span>
                        <span
                            class="text-xs font-medium transition-colors"
                            style="color: {currentPath === item.path
                                ? 'var(--color-primary)'
                                : 'var(--color-text-secondary)'}"
                        >
                            {item.label}
                        </span>
                    </button>
                {/if}
            {/each}
        </div>
    </div>
</nav>

<!-- Spacer to prevent content from being hidden behind bottom nav -->
<div class="h-16"></div>

<style>
    nav {
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
    }

    .active {
        background-color: var(--color-bg-tertiary);
    }
</style>
