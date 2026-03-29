<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { fade } from "svelte/transition";
	import { requireAuth } from "$lib/guards/auth.guard";
	import { fetchScanById, fetchDiseaseInfo } from "$lib/services/scan.service";
	import type { ScanResultResponse, StaticDiseaseResponse } from "$lib/types/api.types";
	import {
		ArrowLeft,
		CheckCircle,
		AlertCircle,
		Leaf,
		ShieldCheck,
		Lightbulb,
	} from "lucide-svelte";

	let scan = $state<ScanResultResponse | null>(null);
	let diseaseInfo = $state<StaticDiseaseResponse | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	const top3 = $derived(scan ? scan.top_predictions.slice(0, 3) : []);
	const primaryPrediction = $derived(scan?.top_predictions[0] ?? null);
	const topDiseasePredictions = $derived.by(() => {
		if (!scan?.disease_name || scan.disease_name === "Healthy") return [];

		const allDiseases = scan.all_diseases?.slice(0, 3) ?? [];
		if (allDiseases.length > 0) return allDiseases;

		return scan.disease_name
			? [
					{
						name: scan.disease_name,
						confidence: scan.disease_confidence ?? 0,
					},
				]
			: [];
	});
	const commonNameOverrides: Record<string, string> = {
		"Fragaria × ananassa": "Garden Strawberry",
		"Fragaria ananassa": "Garden Strawberry",
		"Fragaria vesca": "Wild Strawberry",
	};
	const preferredCommonName = $derived.by(() => {
		const commonName = primaryPrediction?.common_name?.trim();
		return (
			commonName ||
			(primaryPrediction?.name ? commonNameOverrides[primaryPrediction.name] : undefined)
		);
	});
	const displayPlantName = $derived(
		preferredCommonName || scan?.plant_name || primaryPrediction?.name || "Scan Detail"
	);
	const displayScientificName = $derived(preferredCommonName ? primaryPrediction?.name : null);

	onMount(() => {
		return requireAuth();
	});

	$effect(() => {
		const id = page.params.id;
		if (!id) {
			error = "Scan not found.";
			loading = false;
			return;
		}
		loading = true;
		error = null;
		scan = null;
		diseaseInfo = null;
		fetchScanById(id)
			.then(async (data) => {
				scan = data;
				// Fetch treatment info if a disease was detected
				if (data.disease_name && data.disease_name !== "Healthy" && data.disease_genus) {
					try {
						diseaseInfo = await fetchDiseaseInfo(data.disease_genus, data.disease_name);
					} catch {
						// Treatment info not available — that's fine
					}
				}
			})
			.catch(() => {
				error = "Scan not found.";
			})
			.finally(() => {
				loading = false;
			});
	});

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	}

	function formatTime(dateStr: string): string {
		return new Date(dateStr).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	}

	function getPrimaryPlantLabel(name: string, commonName?: string): string {
		return commonName?.trim() || commonNameOverrides[name] || name;
	}

	function getSecondaryPlantLabel(name: string, commonName?: string): string | null {
		return commonName?.trim() || commonNameOverrides[name] ? name : null;
	}

	function formatDiseaseName(name: string): string {
		return name.replaceAll("_", " ");
	}
</script>

<svelte:head>
	<title>{scan ? displayPlantName : "Scan Detail"} - GreenEye</title>
</svelte:head>

<div class="min-h-screen pb-20 bg-secondary/30">
	<!-- Header -->
	<header
		class="px-6 py-4 bg-background sticky top-0 z-50 pt-[calc(1rem+env(safe-area-inset-top))]"
	>
		<div class="flex items-center justify-between max-w-lg mx-auto">
			<button
				onclick={() => goto("/history")}
				class="flex items-center gap-2 transition-opacity hover:opacity-70"
			>
				<ArrowLeft size={20} />
				<span class="font-medium">History</span>
			</button>
			<h1 class="text-xl font-bold text-foreground">Scan Detail</h1>
			<div class="w-16"></div>
		</div>
	</header>

	<main class="px-6 py-6 space-y-6 max-w-lg mx-auto">
		{#if loading}
			<div class="space-y-4" in:fade={{ duration: 200 }}>
				<div class="rounded-3xl aspect-square bg-muted animate-pulse"></div>
				<div class="h-8 w-48 bg-muted rounded-lg animate-pulse"></div>
				<div class="h-5 w-32 bg-muted rounded animate-pulse"></div>
			</div>
		{:else if error}
			<div
				class="rounded-3xl p-6 bg-card border border-border shadow-sm text-center"
				in:fade={{ duration: 300 }}
			>
				<AlertCircle size={48} class="text-muted-foreground mx-auto mb-4" />
				<p class="text-lg font-semibold mb-2">{error}</p>
				<button
					onclick={() => goto("/history")}
					class="px-6 py-3 rounded-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
				>
					Back to History
				</button>
			</div>
		{:else if scan}
			<!-- Photo Card -->
			<div
				class="rounded-3xl overflow-hidden bg-card text-card-foreground shadow-sm border border-border"
				in:fade={{ duration: 300 }}
			>
				<div class="aspect-square bg-muted relative">
					<img
						src={scan.image_url}
						alt={displayPlantName}
						class="w-full h-full object-cover"
					/>
				</div>
			</div>

			<!-- Plant Info -->
			<div in:fade={{ duration: 300, delay: 100 }}>
				<h2 class="text-2xl font-bold text-foreground">{displayPlantName}</h2>
				{#if displayScientificName}
					<p class="mt-1 text-sm italic text-muted-foreground">
						{displayScientificName}
					</p>
				{/if}
				<p class="text-sm text-muted-foreground mt-1">
					{formatDate(scan.created_at)} at {formatTime(scan.created_at)}
				</p>
			</div>

			<!-- Species Predictions -->
			{#if top3.length > 0}
				<div
					class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
					in:fade={{ duration: 300, delay: 150 }}
				>
					<div class="flex items-center gap-2 mb-4">
						<Leaf size={20} class="text-primary" />
						<span
							class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
							>Species Predictions</span
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
										class="truncate text-foreground {i === 0
											? 'text-lg font-bold'
											: 'text-sm font-semibold'}"
									>
										{getPrimaryPlantLabel(
											prediction.name,
											prediction.common_name
										)}
									</p>
									{#if getSecondaryPlantLabel(prediction.name, prediction.common_name)}
										<p class="truncate text-xs italic text-muted-foreground">
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
			{/if}

			<!-- Disease Analysis -->
			<div
				class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
				in:fade={{ duration: 300, delay: 200 }}
			>
				<div class="flex items-center gap-2 mb-4">
					<AlertCircle size={20} class="text-primary" />
					<span class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
						>Disease Analysis</span
					>
				</div>

				{#if !scan.disease_name}
					<p class="text-sm text-muted-foreground">
						Disease detection not available for this species.
					</p>
				{:else if scan.disease_name === "Healthy"}
					<div class="flex items-center gap-3">
						<CheckCircle size={24} class="text-green-500 flex-shrink-0" />
						<div>
							<p class="text-lg font-bold text-foreground">Healthy Plant</p>
							<p class="text-sm text-muted-foreground">
								No disease detected{#if scan.disease_genus}
									in <span class="italic">{scan.disease_genus}</span>{/if}
							</p>
						</div>
					</div>
				{:else}
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<AlertCircle size={24} class="text-orange-500 flex-shrink-0" />
							<div>
								<p class="text-lg font-bold text-foreground">
									{formatDiseaseName(scan.disease_name)}
								</p>
								<p class="text-sm text-muted-foreground">
									Top disease matches{#if scan.disease_genus}
										for <span class="italic">{scan.disease_genus}</span>{/if}
								</p>
							</div>
						</div>

						{#if topDiseasePredictions.length > 0}
							<div class="space-y-2">
								{#each topDiseasePredictions as diseasePrediction, i}
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
												{formatDiseaseName(diseasePrediction.name)}
											</p>
										</div>
										<span class="text-sm text-muted-foreground font-medium"
											>{Math.round(diseasePrediction.confidence * 100)}%</span
										>
									</div>
									<div class="w-full bg-muted rounded-full h-1.5">
										<div
											class="bg-primary rounded-full h-1.5"
											style="width: {Math.round(
												diseasePrediction.confidence * 100
											)}%"
										></div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Treatment Info (from static_diseases) -->
			{#if diseaseInfo?.recommended_actions}
				{@const info =
					typeof diseaseInfo.recommended_actions === "string"
						? JSON.parse(diseaseInfo.recommended_actions)
						: diseaseInfo.recommended_actions}

				<!-- Treatment Steps -->
				{#if info.treatments?.length}
					<div
						class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
						in:fade={{ duration: 300, delay: 250 }}
					>
						<div class="flex items-center gap-2 mb-4">
							<ShieldCheck size={20} class="text-primary" />
							<span
								class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
								>Treatment Steps</span
							>
						</div>
						<div class="space-y-4">
							{#each info.treatments as treatment}
								<div class="flex gap-3">
									<span
										class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-primary text-primary-foreground"
									>
										{treatment.step}
									</span>
									<div class="flex-1">
										<p class="text-sm font-medium text-foreground">
											{treatment.action}
										</p>
										<p class="text-xs text-muted-foreground mt-1">
											{treatment.detail}
										</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Prevention Tips -->
				{#if info.prevention?.length}
					<div
						class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
						in:fade={{ duration: 300, delay: 300 }}
					>
						<div class="flex items-center gap-2 mb-4">
							<Lightbulb size={20} class="text-primary" />
							<span
								class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
								>Prevention</span
							>
						</div>
						<div class="space-y-4">
							{#each info.prevention as tip, i}
								<div>
									<p class="text-sm font-medium text-foreground">{tip.tip}</p>
									<p class="text-xs text-muted-foreground mt-1">{tip.detail}</p>
								</div>
								{#if i < info.prevention.length - 1}
									<hr class="border-border" />
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		{/if}
	</main>
</div>
