<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { theme } from "$lib/stores/theme.store";
    import {
        WeatherService,
        type WeatherData,
    } from "$lib/services/weather.service";
    import BottomNav from "$lib/components/BottomNav.svelte";

    let mounted = $state(false);
    let weather = $state<WeatherData | null>(null);
    let loadingWeather = $state(true);

    onMount(async () => {
        mounted = true;

        // Fetch weather data
        try {
            weather = await WeatherService.getCurrentWeather();
        } catch (error) {
            console.error("Failed to load weather:", error);
        } finally {
            loadingWeather = false;
        }
    });

    const plantCards = [
        {
            title: "Recent Scans",
            subtitle: "View your history",
            image: "/images/plants/succulent.png",
            comingSoon: true,
        },
        {
            title: "Plant Library",
            subtitle: "Browse diseases",
            image: "/images/plants/fern.png",
            comingSoon: true,
        },
        {
            title: "Care Tips",
            subtitle: "Expert advice",
            image: "/images/plants/monstera.png",
            comingSoon: true,
        },
        {
            title: "Fertilizer Guide",
            subtitle: "Nutrition info",
            image: "/images/plants/snake-plant.png",
            comingSoon: true,
        },
    ];

    function handleScanPlant() {
        goto("/camera");
    }
</script>

<svelte:head>
    <title>Home - GreenEye</title>
</svelte:head>

<div
    class="min-h-screen pb-20"
    style="background-color: var(--color-bg-secondary);"
>
    <!-- Header -->
    <header
        class="px-6 py-4"
        style="background-color: var(--color-bg-primary);"
    >
        <div class="flex items-center justify-between mb-4">
            <!-- Profile Icon -->
            <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
                style="background-color: var(--color-primary);"
            >
                <span class="text-white text-xl">🌿</span>
            </div>

            <!-- Greeting -->
            <div class="flex-1 px-4">
                <p class="text-sm" style="color: var(--color-text-secondary);">
                    Good morning
                </p>
                <p
                    class="font-semibold"
                    style="color: var(--color-text-primary);"
                >
                    Gardener
                </p>
            </div>

            <!-- Theme Toggle & Notifications -->
            <div class="flex items-center gap-2">
                <button
                    onclick={() => theme.toggle()}
                    class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style="background-color: var(--color-bg-tertiary);"
                    aria-label="Toggle theme"
                >
                    <span class="text-xl"
                        >{$theme === "light" ? "🌙" : "☀️"}</span
                    >
                </button>
                <button
                    class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style="background-color: var(--color-bg-tertiary);"
                    aria-label="Notifications"
                >
                    <span class="text-xl">🔔</span>
                </button>
            </div>
        </div>

        <!-- Search Bar -->
        <div class="relative">
            <input
                type="text"
                placeholder="Search plant diseases..."
                class="w-full px-4 py-3 pr-12 rounded-2xl border transition-colors"
                style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text-primary);"
            />
            <button
                class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                style="background-color: var(--color-primary);"
            >
                <span class="text-white">🔍</span>
            </button>
        </div>
    </header>

    <!-- Main Content -->
    <main class="px-6 py-6 space-y-6">
        <!-- Weather Card -->
        {#if weather}
            <div
                class="rounded-3xl p-6 transition-all"
                style="background-color: var(--color-bg-primary); box-shadow: var(--shadow-md);"
            >
                <div class="flex items-center justify-between">
                    <div>
                        <p
                            class="text-4xl font-bold mb-1"
                            style="color: var(--color-text-primary);"
                        >
                            {weather.temperature}°C
                        </p>
                        <p
                            class="text-sm"
                            style="color: var(--color-text-secondary);"
                        >
                            {weather.location}
                        </p>
                    </div>
                    <div class="text-6xl">{weather.icon}</div>
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <span
                        class="text-sm font-medium"
                        style="color: var(--color-text-secondary);"
                    >
                        {weather.condition}
                    </span>
                    <button
                        class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                        style="background-color: var(--color-bg-tertiary); color: var(--color-text-primary);"
                    >
                        Hourly
                    </button>
                </div>
            </div>
        {/if}

        <!-- Main CTA Card - Check your plant -->
        <div
            class="rounded-3xl p-6 transition-all"
            style="background-color: var(--color-bg-primary); box-shadow: var(--shadow-md);"
        >
            <div class="flex flex-col items-center text-center">
                <!-- Plant Illustration -->
                <div class="w-48 h-48 mb-4 relative">
                    <img
                        src="/images/plants/main-plant.png"
                        alt="Check your plant"
                        class="w-full h-full object-contain"
                    />
                </div>

                <!-- Text -->
                <h2
                    class="text-2xl font-bold mb-2"
                    style="color: var(--color-text-primary);"
                >
                    Check your plant
                </h2>
                <p
                    class="text-sm mb-6"
                    style="color: var(--color-text-secondary);"
                >
                    Take a photo or upload an image to get
                    <br />
                    instant disease diagnosis and care tips
                </p>

                <!-- CTA Button -->
                <button
                    onclick={handleScanPlant}
                    class="px-8 py-3 rounded-full font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                    style="background-color: var(--color-primary); box-shadow: var(--shadow-md);"
                >
                    Get Started
                </button>
            </div>
        </div>

        <!-- Plant Grid Section -->
        <div>
            <h3
                class="text-lg font-bold mb-4"
                style="color: var(--color-text-primary);"
            >
                Explore
            </h3>
            <div class="grid grid-cols-2 gap-4">
                {#each plantCards as card}
                    <button
                        class="rounded-3xl p-4 text-left transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden"
                        style="background-color: var(--color-bg-primary); box-shadow: var(--shadow-md);"
                        disabled={card.comingSoon}
                    >
                        {#if card.comingSoon}
                            <div
                                class="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
                                style="background-color: var(--color-primary); color: white;"
                            >
                                Soon
                            </div>
                        {/if}

                        <!-- Plant Image -->
                        <div
                            class="w-full aspect-square mb-3 rounded-2xl overflow-hidden"
                            style="background-color: var(--color-bg-secondary);"
                        >
                            <img
                                src={card.image}
                                alt={card.title}
                                class="w-full h-full object-cover"
                            />
                        </div>

                        <!-- Text -->
                        <h4
                            class="font-semibold mb-1"
                            style="color: var(--color-text-primary);"
                        >
                            {card.title}
                        </h4>
                        <p
                            class="text-xs"
                            style="color: var(--color-text-secondary);"
                        >
                            {card.subtitle}
                        </p>
                    </button>
                {/each}
            </div>
        </div>
    </main>

    <!-- Bottom Navigation -->
    <BottomNav />
</div>

<style>
    /* Smooth transitions */
    button {
        transition:
            transform 0.2s ease,
            background-color 0.3s ease,
            box-shadow 0.3s ease;
    }

    button:hover:not(:disabled) {
        transform: translateY(-2px);
    }

    button:active:not(:disabled) {
        transform: translateY(0);
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>
