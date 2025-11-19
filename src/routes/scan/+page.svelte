<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import type { CapturedPhoto } from "$lib/types";

    let photo = $state<CapturedPhoto | null>(null);
    let isAnalyzing = $state(false);
    let showResults = $state(false);

    onMount(() => {
        // Get photo data from session storage (passed from home page)
        const photoData = sessionStorage.getItem("capturedPhoto");
        if (photoData) {
            photo = JSON.parse(photoData);
            sessionStorage.removeItem("capturedPhoto");
        } else {
            // No photo data, redirect back to home
            goto("/");
        }
    });

    async function analyzePlant() {
        if (!photo) return;

        isAnalyzing = true;

        // Simulate AI analysis (replace with actual API call later)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        isAnalyzing = false;
        showResults = true;
    }

    function retakePhoto() {
        goto("/");
    }

    function getImageSrc(photo: CapturedPhoto): string {
        return `data:image/${photo.format};base64,${photo.base64}`;
    }
</script>

<svelte:head>
    <title>Scan Plant - GreenEye</title>
</svelte:head>

<div
    class="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 text-white"
>
    <!-- Header -->
    <header class="px-6 py-4 flex items-center justify-between">
        <button
            onclick={() => goto("/")}
            class="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
            <span class="text-2xl">←</span>
            <span class="text-lg">Back</span>
        </button>
        <div class="flex items-center gap-2">
            <div
                class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg"
            >
                <span class="text-2xl">🌿</span>
            </div>
            <span class="text-xl font-bold">GreenEye</span>
        </div>
    </header>

    <!-- Main Content -->
    <main class="px-6 py-8 max-w-2xl mx-auto">
        {#if photo}
            <!-- Image Preview -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold mb-6 text-center">
                    Plant Analysis
                </h1>

                <div
                    class="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20"
                >
                    <!-- Plant Image -->
                    <div
                        class="aspect-square rounded-2xl overflow-hidden mb-6 bg-black/20"
                    >
                        <img
                            src={getImageSrc(photo)}
                            alt="Captured plant"
                            class="w-full h-full object-cover"
                        />
                    </div>

                    <!-- Action Buttons -->
                    {#if !showResults}
                        <div class="space-y-3">
                            <button
                                onclick={analyzePlant}
                                disabled={isAnalyzing}
                                class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 transform hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                            >
                                {#if isAnalyzing}
                                    <span
                                        class="flex items-center justify-center gap-2"
                                    >
                                        <span
                                            class="inline-block w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"
                                        ></span>
                                        <span>Analyzing...</span>
                                    </span>
                                {:else}
                                    <span
                                        class="flex items-center justify-center gap-2"
                                    >
                                        <span>🔍</span>
                                        <span>Analyze Plant</span>
                                    </span>
                                {/if}
                            </button>

                            <button
                                onclick={retakePhoto}
                                disabled={isAnalyzing}
                                class="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span
                                    class="flex items-center justify-center gap-2"
                                >
                                    <span>📸</span>
                                    <span>Retake Photo</span>
                                </span>
                            </button>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Results Section (Placeholder) -->
            {#if showResults}
                <div class="space-y-4">
                    <div
                        class="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20"
                    >
                        <div class="flex items-center gap-3 mb-4">
                            <span class="text-4xl">🎯</span>
                            <div>
                                <h2 class="text-2xl font-bold">
                                    Analysis Complete
                                </h2>
                                <p class="text-emerald-200/80">
                                    Diagnosis results
                                </p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <!-- Placeholder for diagnosis results -->
                            <div
                                class="bg-emerald-900/30 rounded-2xl p-4 border border-emerald-500/30"
                            >
                                <div
                                    class="flex items-start justify-between mb-2"
                                >
                                    <h3 class="font-semibold text-lg">
                                        Disease Detected
                                    </h3>
                                    <span
                                        class="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-sm font-medium"
                                        >Medium Severity</span
                                    >
                                </div>
                                <p class="text-emerald-200/90 mb-3">
                                    Based on the image analysis, your plant
                                    appears to show signs of a common leaf
                                    condition.
                                </p>
                                <div
                                    class="flex items-center gap-2 text-sm text-emerald-300"
                                >
                                    <span>Confidence:</span>
                                    <div
                                        class="flex-1 bg-white/10 rounded-full h-2"
                                    >
                                        <div
                                            class="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full"
                                            style="width: 85%"
                                        ></div>
                                    </div>
                                    <span class="font-semibold">85%</span>
                                </div>
                            </div>

                            <!-- Treatment Recommendations -->
                            <div
                                class="bg-white/5 rounded-2xl p-4 border border-white/10"
                            >
                                <h3
                                    class="font-semibold text-lg mb-3 flex items-center gap-2"
                                >
                                    <span>💊</span>
                                    <span>Recommended Treatments</span>
                                </h3>
                                <ul class="space-y-2 text-emerald-200/90">
                                    <li class="flex items-start gap-2">
                                        <span class="text-emerald-400 mt-1"
                                            >•</span
                                        >
                                        <span
                                            >Remove affected leaves to prevent
                                            spread</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <span class="text-emerald-400 mt-1"
                                            >•</span
                                        >
                                        <span
                                            >Apply organic fungicide treatment</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <span class="text-emerald-400 mt-1"
                                            >•</span
                                        >
                                        <span
                                            >Improve air circulation around the
                                            plant</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <span class="text-emerald-400 mt-1"
                                            >•</span
                                        >
                                        <span>Reduce watering frequency</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="space-y-3">
                        <button
                            onclick={retakePhoto}
                            class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            <span
                                class="flex items-center justify-center gap-2"
                            >
                                <span>📸</span>
                                <span>Scan Another Plant</span>
                            </span>
                        </button>

                        <button
                            onclick={() => goto("/")}
                            class="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300"
                        >
                            <span>Back to Home</span>
                        </button>
                    </div>
                </div>
            {/if}
        {/if}
    </main>
</div>

<style>
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .animate-spin {
        animation: spin 1s linear infinite;
    }
</style>
