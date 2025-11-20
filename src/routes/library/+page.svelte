<script lang="ts">
    import { onMount } from "svelte";
    import BottomNav from "$lib/components/BottomNav.svelte";
    import { mockDiseaseLibrary } from "$lib/services/mock-data";
    import type { DiseaseLibraryEntry } from "$lib/types";
    import { Search, AlertCircle, Droplet, Bug, Leaf } from "lucide-svelte";

    let mounted = $state(false);
    let searchQuery = $state("");
    let selectedCategory = $state<string>("all");
    let diseases = $state<DiseaseLibraryEntry[]>(mockDiseaseLibrary);

    const categories = [
        { id: "all", label: "All", icon: Leaf },
        { id: "fungal", label: "Fungal", icon: Droplet },
        { id: "bacterial", label: "Bacterial", icon: AlertCircle },
        { id: "viral", label: "Viral", icon: AlertCircle },
        { id: "pest", label: "Pest", icon: Bug },
        { id: "nutrient", label: "Nutrient", icon: Leaf },
        { id: "environmental", label: "Environmental", icon: Leaf },
    ];

    onMount(() => {
        mounted = true;
    });

    const filteredDiseases = $derived(() => {
        let filtered = diseases;

        // Filter by category
        if (selectedCategory !== "all") {
            filtered = filtered.filter((d) => d.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (d) =>
                    d.name.toLowerCase().includes(query) ||
                    d.description.toLowerCase().includes(query) ||
                    d.affectedPlants.some((p) =>
                        p.toLowerCase().includes(query),
                    ),
            );
        }

        return filtered;
    });

    function getSeverityColor(severity: string) {
        switch (severity) {
            case "low":
                return "bg-green-500/10 text-green-700 dark:text-green-400";
            case "medium":
                return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
            case "high":
                return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
            case "critical":
                return "bg-red-500/10 text-red-700 dark:text-red-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    }

    function getCategoryColor(category: string) {
        switch (category) {
            case "fungal":
                return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
            case "bacterial":
                return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
            case "viral":
                return "bg-pink-500/10 text-pink-700 dark:text-pink-400";
            case "pest":
                return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
            case "nutrient":
                return "bg-lime-500/10 text-lime-700 dark:text-lime-400";
            case "environmental":
                return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    }
</script>

<svelte:head>
    <title>Library - GreenEye</title>
</svelte:head>

<div class="min-h-screen pb-20 bg-secondary/30">
    <!-- Header -->
    <header class="px-6 py-6 bg-background sticky top-0 z-30">
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-foreground mb-1">
                Plant Disease Library
            </h1>
            <p class="text-sm text-muted-foreground">
                Browse and learn about common plant diseases
            </p>
        </div>

        <!-- Search Bar -->
        <div class="relative mb-4">
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search diseases..."
                class="w-full px-4 py-3 pr-12 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div
                class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground"
            >
                <Search size={18} />
            </div>
        </div>

        <!-- Category Filter Tabs -->
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {#each categories as category}
                <button
                    onclick={() => (selectedCategory = category.id)}
                    class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2"
                    class:bg-primary={selectedCategory === category.id}
                    class:text-primary-foreground={selectedCategory ===
                        category.id}
                    class:bg-muted={selectedCategory !== category.id}
                    class:text-muted-foreground={selectedCategory !==
                        category.id}
                >
                    <category.icon size={16} />
                    {category.label}
                </button>
            {/each}
        </div>
    </header>

    <!-- Main Content -->
    <main class="px-6 py-4">
        <!-- Results Count -->
        <p class="text-sm text-muted-foreground mb-4">
            {filteredDiseases().length} disease{filteredDiseases().length !== 1
                ? "s"
                : ""} found
        </p>

        <!-- Disease Grid -->
        {#if filteredDiseases().length > 0}
            <div class="grid grid-cols-1 gap-4">
                {#each filteredDiseases() as disease}
                    <button
                        class="rounded-3xl p-4 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-card text-card-foreground shadow-sm border border-border"
                    >
                        <div class="flex gap-4">
                            <!-- Disease Image -->
                            <div
                                class="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0"
                            >
                                <div
                                    class="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                                >
                                    <Leaf class="text-primary" size={32} />
                                </div>
                            </div>

                            <!-- Disease Info -->
                            <div class="flex-1 min-w-0">
                                <div
                                    class="flex items-start justify-between gap-2 mb-2"
                                >
                                    <h3 class="font-semibold text-foreground">
                                        {disease.name}
                                    </h3>
                                    <span
                                        class="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap {getSeverityColor(
                                            disease.severity,
                                        )}"
                                    >
                                        {disease.severity
                                            .charAt(0)
                                            .toUpperCase() +
                                            disease.severity.slice(1)}
                                    </span>
                                </div>

                                <p class="text-sm text-muted-foreground mb-2">
                                    {disease.description}
                                </p>

                                <div class="flex flex-wrap gap-2">
                                    <span
                                        class="px-2 py-1 rounded-full text-xs font-medium {getCategoryColor(
                                            disease.category,
                                        )}"
                                    >
                                        {disease.category
                                            .charAt(0)
                                            .toUpperCase() +
                                            disease.category.slice(1)}
                                    </span>
                                    {#if disease.affectedPlants.length > 0}
                                        <span
                                            class="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                                        >
                                            {disease.affectedPlants.length} plant{disease
                                                .affectedPlants.length !== 1
                                                ? "s"
                                                : ""}
                                        </span>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </button>
                {/each}
            </div>
        {:else}
            <!-- Empty State -->
            <div class="flex flex-col items-center justify-center py-16">
                <div
                    class="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4"
                >
                    <Search size={40} class="text-muted-foreground" />
                </div>
                <h3 class="text-lg font-semibold mb-2">No diseases found</h3>
                <p class="text-sm text-muted-foreground text-center">
                    Try adjusting your search or filter
                </p>
            </div>
        {/if}
    </main>

    <!-- Bottom Navigation -->
    <BottomNav />
</div>

<style>
    /* Hide scrollbar for category tabs */
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    /* Smooth transitions */
    button {
        transition:
            transform 0.2s ease,
            background-color 0.3s ease;
    }
</style>
