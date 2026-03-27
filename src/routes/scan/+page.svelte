<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import type { CapturedPhoto } from "$lib/types";
	import type { PlantIDResult } from "$lib/types/api.types";
	import { identifyPlant, saveScan } from "$lib/services/scan.service";
	import { requireAuth } from "$lib/guards/auth.guard";
	import {
		CheckCircle,
		Home,
		Camera,
		Save,
		AlertCircle,
		Leaf,
		LoaderCircle,
	} from "lucide-svelte";
	import { fade, fly } from "svelte/transition";
	import PlantGrowingLoader from "$lib/components/PlantGrowingLoader.svelte";

	let photo = $state<CapturedPhoto | null>(null);
	let isAnalyzing = $state(false);
	let result = $state<PlantIDResult | null>(null);
	let analysisError = $state<string | null>(null);
	let isSaved = $state(false);
	let isSaving = $state(false);

	const top3 = $derived(result ? result.predictions.slice(0, 3) : []);

	function getPrimaryPlantLabel(name: string, commonName?: string): string {
		return commonName?.trim() || name;
	}

	function getSecondaryPlantLabel(name: string, commonName?: string): string | null {
		return commonName?.trim() ? name : null;
	}

	onMount(() => {
		const unsub = requireAuth();

		const photoData = sessionStorage.getItem("capturedPhoto");
		if (photoData) {
			photo = JSON.parse(photoData);
			setTimeout(() => analyzePlant(), 500);
		} else {
			goto("/camera");
		}

		return unsub;
	});

	async function analyzePlant() {
		if (!photo) return;
		isAnalyzing = true;
		analysisError = null;

		try {
			result = await identifyPlant(photo);
		} catch (err: unknown) {
			analysisError =
				err instanceof Error ? err.message : "Failed to identify plant. Please try again.";
		} finally {
			isAnalyzing = false;
		}
	}

	function getImageSrc(photo: CapturedPhoto): string {
		return `data:image/${photo.format};base64,${photo.base64}`;
	}

	async function saveToHistory() {
		if (!photo || !result || isSaving || isSaved) return;
		isSaving = true;

		try {
			await saveScan(result);
			isSaved = true;
		} catch {
			analysisError = "We couldn't save this scan, but your results are still visible.";
			isSaved = false;
			return;
		} finally {
			isSaving = false;
		}

		setTimeout(() => goto("/history"), 1500);
	}

	function scanAgain() {
		sessionStorage.removeItem("capturedPhoto");
		photo = null;
		result = null;
		analysisError = null;
		isSaved = false;
		goto("/camera");
	}
</script>

<svelte:head>
	<title>Scan Results - GreenEye</title>
</svelte:head>

<div class="min-h-screen pb-20 bg-secondary/30">
	<!-- Header -->
	<header
		class="px-6 py-4 bg-background sticky top-0 z-50 pt-[calc(1rem+env(safe-area-inset-top))]"
	>
		<div class="flex items-center justify-between">
			<button
				onclick={() => goto("/")}
				class="flex items-center gap-2 transition-opacity hover:opacity-70"
			>
				<Home size={20} />
				<span class="font-medium">Home</span>
			</button>
			<h1 class="text-xl font-bold text-foreground">Scan Results</h1>
			<div class="w-16"></div>
		</div>
	</header>

	<main class="px-6 py-6 space-y-6 max-w-lg mx-auto">
		{#if isAnalyzing}
			<PlantGrowingLoader />
		{:else if photo}
			<!-- Photo Card -->
			<div
				class="rounded-3xl overflow-hidden bg-card text-card-foreground shadow-sm border border-border"
			>
				<div class="aspect-square bg-muted relative">
					<img
						src={getImageSrc(photo)}
						alt="Captured plant"
						class="w-full h-full object-cover"
					/>
				</div>
			</div>

			<!-- Error State -->
			{#if analysisError}
				<div
					class="rounded-3xl p-6 bg-card border border-red-500/15 shadow-sm"
					in:fly={{ y: 12, duration: 220 }}
					out:fade={{ duration: 180 }}
				>
					<div class="flex items-center gap-3 mb-3">
						<AlertCircle size={24} class="text-red-500 flex-shrink-0" />
						<h2 class="text-lg font-bold text-foreground">Identification Failed</h2>
					</div>
					<p class="text-sm text-muted-foreground mb-4">{analysisError}</p>
					<button
						onclick={analyzePlant}
						class="w-full px-4 py-3 rounded-2xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						Try Again
					</button>
				</div>
			{/if}

			<!-- Results -->
			{#if result}
				{#if result.low_confidence}
					<div class="rounded-3xl p-5 bg-amber-500/10 border border-amber-500/20">
						<div class="flex items-center gap-3">
							<AlertCircle
								size={24}
								class="text-amber-600 dark:text-amber-400 flex-shrink-0"
							/>
							<div>
								<p class="font-semibold text-foreground">Low Confidence Result</p>
								<p class="text-sm text-muted-foreground">
									We're not confident in this identification. The image may not
									contain a recognizable plant. Try taking a clearer photo.
								</p>
							</div>
						</div>
					</div>
				{/if}

				<div
					class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
				>
					<div class="flex items-center gap-2 mb-4">
						<Leaf size={20} class="text-primary" />
						<span
							class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
							>Results</span
						>
					</div>

					<div class="space-y-4">
						{#each top3 as prediction, i}
							<div class="flex items-center gap-3">
								<span
									class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 {i ===
									0
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground'}"
								>
									{i + 1}
								</span>
								<div class="flex-1 min-w-0">
									<p
										class="text-foreground truncate {i === 0
											? 'text-lg font-bold'
											: 'text-sm font-semibold'}"
									>
										{getPrimaryPlantLabel(
											prediction.name,
											prediction.common_name
										)}
									</p>
									{#if getSecondaryPlantLabel(prediction.name, prediction.common_name)}
										<p class="text-xs italic text-muted-foreground truncate">
											{getSecondaryPlantLabel(
												prediction.name,
												prediction.common_name
											)}
										</p>
									{/if}
								</div>
								<span class="text-sm text-muted-foreground font-medium">
									{Math.round(prediction.confidence * 100)}%
								</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Disease Analysis -->
				<div
					class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
				>
					<div class="flex items-center gap-2 mb-4">
						<AlertCircle size={20} class="text-primary" />
						<span
							class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
							>Disease Analysis</span
						>
					</div>

					{#if result.disease === null}
						<p class="text-sm text-muted-foreground">
							Disease detection not available for this species.
						</p>
					{:else if result.disease.disease_name === "Healthy"}
						<div class="flex items-center gap-3">
							<CheckCircle size={24} class="text-green-500 flex-shrink-0" />
							<div>
								<p class="text-lg font-bold text-foreground">Healthy Plant</p>
								<p class="text-sm text-muted-foreground">
									No disease detected in <span class="italic"
										>{result.disease.genus}</span
									>
								</p>
							</div>
						</div>
					{:else}
						<div class="space-y-4">
							<div class="flex items-center gap-3">
								<AlertCircle size={24} class="text-orange-500 flex-shrink-0" />
								<div>
									<p class="text-lg font-bold text-foreground">
										{result.disease.disease_name.replaceAll("_", " ")}
									</p>
									<p class="text-sm text-muted-foreground">
										Detected in <span class="italic"
											>{result.disease.genus}</span
										>
										&mdash; {Math.round(result.disease.confidence * 100)}%
										confidence
									</p>
								</div>
							</div>

							<div class="space-y-2">
								{#each result.disease.all_diseases as d}
									<div class="flex items-center justify-between text-sm">
										<span class="text-foreground"
											>{d.name.replaceAll("_", " ")}</span
										>
										<span class="text-muted-foreground font-medium"
											>{Math.round(d.confidence * 100)}%</span
										>
									</div>
									<div class="w-full bg-muted rounded-full h-1.5">
										<div
											class="bg-primary rounded-full h-1.5"
											style="width: {Math.round(d.confidence * 100)}%"
										></div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Action Buttons -->
				<div class="space-y-3">
					{#if !isSaved}
						<button
							onclick={saveToHistory}
							disabled={isSaving}
							class="w-full px-6 py-4 rounded-3xl font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
						>
							{#if isSaving}
								<LoaderCircle size={20} class="animate-spin" />
								<span>Saving...</span>
							{:else}
								<Save size={20} />
								<span>Save to History</span>
							{/if}
						</button>
					{:else}
						<div
							class="w-full px-6 py-4 rounded-3xl font-semibold bg-green-600 text-white flex items-center justify-center gap-2"
							in:fly={{ y: 10, duration: 220 }}
						>
							<CheckCircle size={20} />
							<span>Saved!</span>
						</div>
					{/if}

					<button
						onclick={scanAgain}
						class="w-full px-6 py-4 rounded-3xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-border bg-card text-card-foreground hover:bg-muted flex items-center justify-center gap-2"
					>
						<Camera size={20} />
						<span>Scan Another Plant</span>
					</button>
				</div>
			{/if}
		{/if}
	</main>
</div>
