<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import type { StaticDiseaseResponse } from "$lib/types/api.types";
	import { fetchAllDiseases } from "$lib/services/scan.service";
	import { Search, AlertCircle } from "lucide-svelte";
	import { fly, fade } from "svelte/transition";
	import { requireAuth } from "$lib/guards/auth.guard";

	import HamburgerMenu from "$lib/components/HamburgerMenu.svelte";

	let diseases = $state<StaticDiseaseResponse[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state("");
	let isSearchOpen = $state(false);
	let selectedGenus = $state<string>("all");

	onMount(() => {
		return requireAuth();
	});

	function loadDiseases() {
		loading = true;
		error = null;
		fetchAllDiseases()
			.then((data) => {
				diseases = data.map((d) => ({
					...d,
					recommended_actions:
						typeof d.recommended_actions === "string"
							? JSON.parse(d.recommended_actions)
							: d.recommended_actions,
				}));
			})
			.catch(() => {
				error = "Failed to load disease library.";
			})
			.finally(() => {
				loading = false;
			});
	}

	$effect(() => {
		const url = page.url;
		const initialQuery = url.searchParams.get("q")?.trim() ?? "";
		searchQuery = initialQuery;
		isSearchOpen = initialQuery.length > 0;
		loadDiseases();
	});

	const genera = $derived.by(() => {
		const unique = [...new Set(diseases.map((d) => d.genus))].sort();
		return unique;
	});

	const filteredDiseases = $derived.by(() => {
		let filtered = diseases;

		if (selectedGenus !== "all") {
			filtered = filtered.filter((d) => d.genus === selectedGenus);
		}

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(d) =>
					d.disease_name.toLowerCase().includes(query) ||
					d.genus.toLowerCase().includes(query) ||
					d.recommended_actions?.affected_plants?.some((p: string) =>
						p.toLowerCase().includes(query)
					)
			);
		}

		return filtered;
	});
</script>

<svelte:head>
	<title>Library - GreenEye</title>
</svelte:head>

<div class="min-h-screen pb-20 bg-secondary/30">
	<!-- Header -->
	<header
		class="px-6 py-6 bg-background sticky top-0 z-50 pt-[calc(1.5rem+env(safe-area-inset-top))]"
	>
		<div class="container-responsive">
			<div class="flex items-center justify-between mb-6 h-14">
				{#if isSearchOpen}
					<div
						class="flex-1 flex items-center gap-2 mr-2"
						in:fly={{ x: 50, duration: 300 }}
					>
						<div class="relative flex-1">
							<Search
								class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
								size={18}
							/>
							<!-- svelte-ignore a11y_autofocus -->
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Search diseases..."
								class="w-full pl-10 pr-4 py-2 rounded-full bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
								autofocus
							/>
						</div>
						<button
							onclick={() => {
								isSearchOpen = false;
								searchQuery = "";
							}}
							class="text-sm font-medium text-muted-foreground hover:text-foreground"
						>
							Cancel
						</button>
					</div>
				{:else}
					<div>
						<h1 class="text-2xl font-bold text-foreground mb-1">Plant Library</h1>
						<p class="text-sm text-muted-foreground">Explore common plant diseases</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							onclick={() => (isSearchOpen = true)}
							class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
							aria-label="Search"
						>
							<Search size={20} />
						</button>
						<HamburgerMenu />
					</div>
				{/if}
			</div>

			<!-- Genus Filter -->
			{#if !loading && genera.length > 0}
				<div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
					<button
						onclick={() => (selectedGenus = "all")}
						class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors {selectedGenus ===
						'all'
							? 'bg-primary text-primary-foreground'
							: 'bg-card text-card-foreground border border-border hover:bg-muted'}"
					>
						All
					</button>
					{#each genera as genus, i}
						<button
							onclick={() => (selectedGenus = genus)}
							class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors {selectedGenus ===
							genus
								? 'bg-primary text-primary-foreground'
								: 'bg-card text-card-foreground border border-border hover:bg-muted'}"
							in:fly={{ x: 20, duration: 400, delay: 200 + i * 50 }}
						>
							{genus}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</header>

	<!-- Main Content -->
	<main class="px-6 py-4 pb-28">
		<div class="container-responsive">
			{#if loading}
				<div class="space-y-4">
					{#each Array(4) as _}
						<div
							class="rounded-3xl p-4 bg-card border border-border shadow-sm animate-pulse"
						>
							<div class="flex gap-4">
								<div class="w-20 h-20 rounded-2xl bg-muted flex-shrink-0"></div>
								<div class="flex-1 space-y-2">
									<div class="h-5 w-32 bg-muted rounded"></div>
									<div class="h-4 w-full bg-muted rounded"></div>
									<div class="h-4 w-24 bg-muted rounded"></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else if error}
				<div class="flex flex-col items-center justify-center py-16">
					<AlertCircle size={48} class="text-muted-foreground mb-4" />
					<p class="text-lg font-semibold mb-2">{error}</p>
				</div>
			{:else}
				<!-- Results Count -->
				<p
					class="text-sm text-muted-foreground mb-4"
					in:fade={{ duration: 400, delay: 300 }}
				>
					{filteredDiseases.length} disease{filteredDiseases.length !== 1 ? "s" : ""} found
				</p>

				{#if filteredDiseases.length > 0}
					<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
						{#each filteredDiseases as disease, i (disease.disease_id)}
							<button
								onclick={() =>
									goto(
										`/library/${encodeURIComponent(disease.genus)}/${encodeURIComponent(disease.disease_name)}`
									)}
								class="rounded-3xl p-4 text-left hover:scale-[1.02] active:scale-[0.98] bg-card text-card-foreground shadow-sm border border-border h-full"
								in:fly|global={{ y: 20, duration: 400, delay: 200 + i * 50 }}
							>
								<div class="flex gap-4 h-full">
									<!-- Disease Icon -->
									<div
										class="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0"
									>
										<div
											class="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
										>
											<AlertCircle class="text-orange-500" size={32} />
										</div>
									</div>

									<!-- Disease Info -->
									<div class="flex-1 min-w-0 flex flex-col">
										<h3 class="font-semibold text-foreground mb-1">
											{disease.disease_name.replaceAll("_", " ")}
										</h3>

										{#if disease.recommended_actions?.symptoms?.length}
											<p
												class="text-sm text-muted-foreground mb-2 flex-1 line-clamp-2"
											>
												{disease.recommended_actions.symptoms[0]
													.description}
											</p>
										{/if}

										<div class="flex flex-wrap gap-2 mt-auto">
											<span
												class="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-400"
											>
												{disease.genus}
											</span>
											{#if disease.recommended_actions?.affected_plants?.length}
												<span
													class="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
												>
													{disease.recommended_actions.affected_plants
														.length} plant{disease.recommended_actions
														.affected_plants.length !== 1
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
			{/if}
		</div>
	</main>
</div>

<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	button {
		transition: background-color 0.3s ease;
	}
</style>
