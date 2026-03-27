<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { fade } from "svelte/transition";
	import { requireAuth } from "$lib/guards/auth.guard";
	import { fetchDiseaseInfo } from "$lib/services/scan.service";
	import type { StaticDiseaseResponse } from "$lib/types/api.types";
	import { ArrowLeft, AlertCircle, ShieldCheck, Stethoscope, Lightbulb } from "lucide-svelte";

	let disease = $state<StaticDiseaseResponse | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	onMount(() => {
		return requireAuth();
	});

	$effect(() => {
		const genus = page.params.genus;
		const diseaseName = page.params.disease;

		if (!genus || !diseaseName) {
			error = "Disease not found.";
			loading = false;
			return;
		}

		loading = true;
		error = null;
		disease = null;
		fetchDiseaseInfo(decodeURIComponent(genus), decodeURIComponent(diseaseName))
			.then((data) => {
				disease = data;
			})
			.catch(() => {
				error = "Disease not found.";
			})
			.finally(() => {
				loading = false;
			});
	});

	function getUrgencyColor(urgency: string) {
		switch (urgency) {
			case "immediate":
				return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
			case "ongoing":
				return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
			case "conditional":
				return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
			default:
				return "bg-muted text-muted-foreground border-border";
		}
	}
</script>

<svelte:head>
	<title>{disease?.disease_name?.replaceAll("_", " ") ?? "Disease"} - GreenEye</title>
</svelte:head>

<div class="min-h-screen pb-20 bg-secondary/30">
	<!-- Header -->
	<header
		class="px-6 py-4 bg-background sticky top-0 z-50 pt-[calc(1rem+env(safe-area-inset-top))]"
	>
		<div class="flex items-center justify-between max-w-lg mx-auto">
			<button
				onclick={() => goto("/library")}
				class="flex items-center gap-2 transition-opacity hover:opacity-70"
			>
				<ArrowLeft size={20} />
				<span class="font-medium">Library</span>
			</button>
			<h1 class="text-xl font-bold text-foreground">Disease Info</h1>
			<div class="w-16"></div>
		</div>
	</header>

	<main class="px-6 py-6 space-y-6 max-w-lg mx-auto">
		{#if loading}
			<div class="space-y-4" in:fade={{ duration: 200 }}>
				<div class="h-8 w-48 bg-muted rounded-lg animate-pulse"></div>
				<div class="h-5 w-32 bg-muted rounded animate-pulse"></div>
				<div class="rounded-3xl h-40 bg-muted animate-pulse"></div>
			</div>
		{:else if error}
			<div
				class="rounded-3xl p-6 bg-card border border-border shadow-sm text-center"
				in:fade={{ duration: 300 }}
			>
				<AlertCircle size={48} class="text-muted-foreground mx-auto mb-4" />
				<p class="text-lg font-semibold mb-2">{error}</p>
				<button
					onclick={() => goto("/library")}
					class="px-6 py-3 rounded-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
				>
					Back to Library
				</button>
			</div>
		{:else if disease}
			{@const info = typeof disease.recommended_actions === "string" ? JSON.parse(disease.recommended_actions) : disease.recommended_actions}

			<!-- Title -->
			<div in:fade={{ duration: 300 }}>
				<h2 class="text-2xl font-bold text-foreground">
					{disease.disease_name.replaceAll("_", " ")}
				</h2>
				{#if info.scientific_name}
					<p class="text-sm text-muted-foreground italic mt-1">{info.scientific_name}</p>
				{/if}
				<div class="flex flex-wrap gap-2 mt-3">
					<span
						class="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-400"
					>
						{disease.genus}
					</span>
					{#each info.affected_plants as plant}
						<span
							class="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
						>
							{plant}
						</span>
					{/each}
				</div>
			</div>

			<!-- Onset Period -->
			{#if info.onset_period}
				<div
					class="rounded-3xl p-5 bg-amber-500/5 border border-amber-500/10"
					in:fade={{ duration: 300, delay: 50 }}
				>
					<p class="text-sm text-foreground">{info.onset_period}</p>
				</div>
			{/if}

			<!-- Symptoms -->
			{#if info.symptoms?.length}
				<div
					class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
					in:fade={{ duration: 300, delay: 100 }}
				>
					<div class="flex items-center gap-2 mb-4">
						<Stethoscope size={20} class="text-primary" />
						<span
							class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
							>Symptoms</span
						>
					</div>
					<div class="space-y-4">
						{#each info.symptoms as symptom, i}
							<div>
								<p class="text-sm font-medium text-foreground">
									{symptom.description}
								</p>
								{#if symptom.progression}
									<p class="text-xs text-muted-foreground mt-1">
										{symptom.progression}
									</p>
								{/if}
							</div>
							{#if i < info.symptoms.length - 1}
								<hr class="border-border" />
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- Causes -->
			{#if info.causes?.length}
				<div
					class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
					in:fade={{ duration: 300, delay: 150 }}
				>
					<div class="flex items-center gap-2 mb-4">
						<AlertCircle size={20} class="text-primary" />
						<span
							class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
							>Causes</span
						>
					</div>
					<div class="space-y-4">
						{#each info.causes as cause, i}
							<div>
								<p class="text-sm font-medium text-foreground">{cause.factor}</p>
								<p class="text-xs text-muted-foreground mt-1">{cause.detail}</p>
							</div>
							{#if i < info.causes.length - 1}
								<hr class="border-border" />
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- Treatments -->
			{#if info.treatments?.length}
				<div
					class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
					in:fade={{ duration: 300, delay: 200 }}
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
									<div class="flex items-center gap-2 mb-1">
										<p class="text-sm font-medium text-foreground">
											{treatment.action}
										</p>
										<span
											class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border {getUrgencyColor(
												treatment.urgency
											)}"
										>
											{treatment.urgency}
										</span>
									</div>
									<p class="text-xs text-muted-foreground">{treatment.detail}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Prevention -->
			{#if info.prevention?.length}
				<div
					class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
					in:fade={{ duration: 300, delay: 250 }}
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
	</main>
</div>
