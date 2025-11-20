<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Home, BookOpen, Camera, History, User } from "lucide-svelte";

    let currentPath = $derived($page.url.pathname);

    const navItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: BookOpen, label: "Library", path: "/library" },
        { icon: Camera, label: "Scan", path: "/camera", isCenter: true },
        { icon: History, label: "History", path: "/history" },
        { icon: User, label: "Profile", path: "/profile" },
    ];

    function navigate(path: string) {
        goto(path);
    }
</script>

```
<nav
    class="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40"
>
    <div class="max-w-screen-xl mx-auto px-4">
        <div class="flex items-center justify-around h-16 relative">
            {#each navItems as item}
                {#if item.isCenter}
                    <!-- Center Camera Button (Elevated) -->
                    <button
                        onclick={() => navigate(item.path)}
                        class="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-primary text-primary-foreground"
                        aria-label={item.label}
                    >
                        <item.icon size={28} />
                    </button>
                {:else}
                    <!-- Regular Nav Item -->
                    <button
                        onclick={() => navigate(item.path)}
                        class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-muted"
                        class:text-primary={currentPath === item.path}
                        class:text-muted-foreground={currentPath !== item.path}
                        aria-label={item.label}
                    >
                        <item.icon size={24} />
                        <span class="text-xs font-medium">
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
