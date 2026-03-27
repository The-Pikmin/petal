<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import type { ScanRecord } from "$lib/types";
	import { requireAuth } from "$lib/guards/auth.guard";
	import { deleteScan, fetchScanHistory } from "$lib/services/scan.service";
	import {
		CheckCircle,
		AlertCircle,
		Camera,
		Trash2,
		Images,
		Search,
		ArrowUpDown,
		Clock3,
		ChevronDown,
	} from "lucide-svelte";
	import { fade, fly, slide } from "svelte/transition";

	import HamburgerMenu from "$lib/components/HamburgerMenu.svelte";

	type SortOption = "newest" | "oldest" | "severity";
	type SeverityFilter = "all" | "low" | "medium" | "high" | "critical";

	const severityRank: Record<Exclude<SeverityFilter, "all">, number> = {
		critical: 4,
		high: 3,
		medium: 2,
		low: 1,
	};

	let scanHistory = $state<ScanRecord[]>([]);
	let loading = $state(true);
	let deletingId = $state<string | null>(null);
	let statusMessage = $state("");
	let statusTone = $state<"success" | "error">("success");
	let searchQuery = $state("");
	let isSearchOpen = $state(false);
	let showFilters = $state(false);
	let sortOption = $state<SortOption>("newest");
	let severityFilter = $state<SeverityFilter>("all");
	const hasActiveFilters = $derived(sortOption !== "newest" || severityFilter !== "all");

	const filteredHistory = $derived.by(() => {
		let results = [...scanHistory];

		if (severityFilter !== "all") {
			results = results.filter((scan) => scan.diagnosis.severity === severityFilter);
		}

		if (searchQuery.trim()) {
			const query = searchQuery.trim().toLowerCase();
			results = results.filter((scan) => {
				const plant = scan.plantName?.toLowerCase() ?? "";
				const common = scan.commonName?.toLowerCase() ?? "";
				const scientific = scan.scientificName?.toLowerCase() ?? "";
				const disease = scan.diagnosis.diseaseName.toLowerCase();

				return (
					plant.includes(query) ||
					common.includes(query) ||
					scientific.includes(query) ||
					disease.includes(query)
				);
			});
		}

		results.sort((a, b) => {
			if (sortOption === "oldest") return a.timestamp - b.timestamp;
			if (sortOption === "severity") {
				const severityDiff =
					(severityRank[b.diagnosis.severity] ?? 0) -
					(severityRank[a.diagnosis.severity] ?? 0);
				if (severityDiff !== 0) return severityDiff;
			}
			return b.timestamp - a.timestamp;
		});

		return results;
	});

	onMount(() => {
		return requireAuth();
	});

	$effect(() => {
		const _url = page.url.href;
		loading = true;
		fetchScanHistory()
			.then((scans) => {
				scanHistory = scans;
			})
			.catch(() => {
				scanHistory = [];
			})
			.finally(() => {
				loading = false;
			});
	});

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

		if (diffInDays === 0) {
			return "Today";
		} else if (diffInDays === 1) {
			return "Yesterday";
		} else if (diffInDays < 7) {
			return `${diffInDays} days ago`;
		}

		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
		});
	}

	function formatTime(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	}

	function getSeverityColor(severity: string) {
		switch (severity) {
			case "low":
				return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
			case "medium":
				return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
			case "high":
				return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
			case "critical":
				return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
			default:
				return "bg-muted text-muted-foreground border-border";
		}
	}

	function getDisplayPlantName(scan: ScanRecord): string {
		return scan.commonName || scan.plantName || scan.scientificName || "Unknown Plant";
	}

	function getScientificLabel(scan: ScanRecord): string | null {
		if (scan.commonName && scan.scientificName && scan.scientificName !== scan.commonName) {
			return scan.scientificName;
		}
		return null;
	}

	async function handleDeleteScan(scanId: string) {
		const confirmed = window.confirm(
			"Delete this scan from your history? This cannot be undone."
		);
		if (!confirmed) return;

		deletingId = scanId;
		statusMessage = "";
		try {
			await deleteScan(scanId);
			scanHistory = scanHistory.filter((scan) => scan.id !== scanId);
			statusTone = "success";
			statusMessage = "Scan deleted from history.";
		} catch (err) {
			statusTone = "error";
			statusMessage = err instanceof Error ? err.message : "Unable to delete this scan.";
		} finally {
			deletingId = null;
		}
	}

	$effect(() => {
		if (!statusMessage) return;
		const timeoutId = window.setTimeout(() => {
			statusMessage = "";
		}, statusTone === "success" ? 3200 : 4200);

		return () => window.clearTimeout(timeoutId);
	});

	function clearSearch() {
		searchQuery = "";
		isSearchOpen = false;
	}
</script>

<svelte:head>
	<title>History - GreenEye</title>
</svelte:head>

<div class="min-h-screen pb-20 bg-secondary/30">
	<header
		class="px-6 py-6 bg-background sticky top-0 z-50 pt-[calc(1.5rem+env(safe-area-inset-top))]"
	>
		<div class="container-responsive space-y-4">
			<div class="flex items-center justify-between">
				{#if isSearchOpen}
					<div class="flex flex-1 items-center gap-2 mr-3" in:fly={{ x: 24, duration: 250 }}>
						<div class="relative flex-1">
							<Search
								class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
								size={18}
							/>
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Search plants or diagnoses..."
								class="w-full rounded-full bg-secondary py-2 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
							/>
						</div>
						<button
							onclick={clearSearch}
							class="text-sm font-medium text-muted-foreground hover:text-foreground"
						>
							Cancel
						</button>
					</div>
				{:else}
					<div>
						<h1 class="text-2xl font-bold text-foreground mb-1">Scan History</h1>
						<p class="text-sm text-muted-foreground">
							{filteredHistory.length} scan{filteredHistory.length !== 1 ? "s" : ""} shown
						</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							onclick={() => (showFilters = !showFilters)}
							class="inline-flex h-10 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
							aria-expanded={showFilters}
							aria-label="Toggle filters"
						>
							<span class="whitespace-nowrap">Filters</span>
							{#if hasActiveFilters}
								<span
									class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-bold text-primary"
								>
									{Number(sortOption !== "newest") + Number(severityFilter !== "all")}
								</span>
							{/if}
							<ChevronDown
								size={16}
								class={`transition-transform ${showFilters ? "rotate-180" : ""}`}
							/>
						</button>
						<button
							onclick={() => (isSearchOpen = true)}
							class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
							aria-label="Search history"
						>
							<Search size={20} />
						</button>
						<button
							onclick={() => goto("/uploads")}
							class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
							aria-label="Manage uploads"
						>
							<Images size={20} />
						</button>
						<HamburgerMenu />
					</div>
				{/if}
			</div>

			<div class="space-y-3">
				{#if showFilters}
					<div
						class="rounded-[1.75rem] border border-border bg-card/70 p-3 shadow-sm backdrop-blur-sm"
						transition:slide={{ duration: 180 }}
					>
						<div class="space-y-3">
							<div class="space-y-2">
								<p class="px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
									Sort
								</p>
								<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
									<button
										onclick={() => (sortOption = "newest")}
										class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors {sortOption ===
										'newest'
											? 'bg-primary text-primary-foreground shadow-sm'
											: 'bg-card text-card-foreground border border-border hover:bg-muted'}"
									>
										Newest
									</button>
									<button
										onclick={() => (sortOption = "oldest")}
										class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors {sortOption ===
										'oldest'
											? 'bg-primary text-primary-foreground shadow-sm'
											: 'bg-card text-card-foreground border border-border hover:bg-muted'}"
									>
										Oldest
									</button>
									<button
										onclick={() => (sortOption = "severity")}
										class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors {sortOption ===
										'severity'
											? 'bg-primary text-primary-foreground shadow-sm'
											: 'bg-card text-card-foreground border border-border hover:bg-muted'}"
									>
										<ArrowUpDown size={14} class="mr-2" />Severity
									</button>
								</div>
							</div>

							<div class="space-y-2">
								<p class="px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
									Severity
								</p>
								<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
									{#each ["all", "low", "medium", "high", "critical"] as filter}
										<button
											onclick={() => (severityFilter = filter as SeverityFilter)}
											class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors {severityFilter ===
											filter
												? 'bg-secondary text-secondary-foreground border border-primary/20 shadow-sm'
												: 'bg-card text-card-foreground border border-border hover:bg-muted'}"
										>
											{filter === "all"
												? "All"
												: filter.charAt(0).toUpperCase() + filter.slice(1)}
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<main class="px-6 py-4">
		<div class="container-responsive">
			{#if statusMessage}
				<div
					class={`mb-4 rounded-2xl px-4 py-3 ${
						statusTone === "success"
							? "border border-green-500/20 bg-green-500/10"
							: "border border-red-500/20 bg-red-500/10"
					}`}
					in:fly={{ y: 10, duration: 220 }}
					out:fade={{ duration: 180 }}
				>
					<p class="text-sm text-foreground">{statusMessage}</p>
				</div>
			{/if}

			{#if loading}
				<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
					{#each Array(6) as _, i}
						<div
							class="rounded-[1.9rem] border border-border bg-card p-4 shadow-sm animate-pulse"
							in:fly|global={{ y: 12, duration: 250, delay: i * 40 }}
						>
							<div class="flex gap-4">
								<div class="h-20 w-20 rounded-2xl bg-muted flex-shrink-0"></div>
								<div class="flex-1 space-y-3">
									<div class="h-5 w-32 rounded bg-muted"></div>
									<div class="h-3 w-24 rounded bg-muted"></div>
									<div class="h-4 w-28 rounded bg-muted"></div>
									<div class="h-6 w-20 rounded-full bg-muted"></div>
								</div>
							</div>
							<div class="mt-4 border-t border-border pt-4 flex items-center justify-between">
								<div class="h-3 w-20 rounded bg-muted"></div>
								<div class="h-9 w-24 rounded-full bg-muted"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if scanHistory.length === 0}
				<div class="flex flex-col items-center justify-center py-16">
					<div class="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
						<Camera size={40} class="text-muted-foreground" />
					</div>
					<h3 class="text-lg font-semibold mb-2">No scans yet</h3>
					<p class="text-sm text-muted-foreground text-center mb-6">
						Start scanning plants to build your history
					</p>
					<a
						href="/camera"
						class="px-6 py-3 rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
					>
						Start Scanning
					</a>
				</div>
			{:else if filteredHistory.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div class="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
						<Clock3 size={40} class="text-muted-foreground" />
					</div>
					<h3 class="text-lg font-semibold mb-2">No matching scans</h3>
					<p class="text-sm text-muted-foreground mb-6">
						Try adjusting your search, sort, or severity filter.
					</p>
					<button
						onclick={() => {
							clearSearch();
							sortOption = "newest";
							severityFilter = "all";
						}}
						class="px-6 py-3 rounded-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						Reset Filters
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
					{#each filteredHistory as scan, i (scan.id || i)}
						<article
							class="w-full rounded-[1.9rem] p-4 bg-card text-card-foreground shadow-sm border border-border h-full"
							in:fly|global={{ y: 20, duration: 400, delay: 120 + i * 40 }}
						>
							<button
								onclick={() => goto("/history/" + scan.id)}
								class="w-full text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
							>
								<div class="flex gap-4 h-full">
									<div class="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
										{#if scan.imageUrl}
											<img
												src={scan.imageUrl}
												alt={getDisplayPlantName(scan)}
												class="w-full h-full object-cover"
											/>
										{:else}
											<div
												class="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
											>
												{#if scan.diagnosis.diseaseName === "Healthy Plant"}
													<CheckCircle
														class="text-green-600 dark:text-green-400"
														size={32}
													/>
												{:else}
													<AlertCircle
														class="text-orange-600 dark:text-orange-400"
														size={32}
													/>
												{/if}
											</div>
										{/if}
									</div>

									<div class="flex-1 min-w-0 flex flex-col">
										<div class="flex items-start justify-between gap-2 mb-2">
											<div class="min-w-0">
												<h3 class="font-semibold text-foreground truncate">
													{getDisplayPlantName(scan)}
												</h3>
												{#if getScientificLabel(scan)}
													<p class="text-xs italic text-muted-foreground truncate">
														{getScientificLabel(scan)}
													</p>
												{/if}
												<p class="text-xs text-muted-foreground mt-1">
													{formatDate(scan.timestamp)} • {formatTime(
														scan.timestamp
													)}
												</p>
											</div>
										</div>

										<p class="text-sm font-medium text-foreground mb-2">
											{scan.diagnosis.diseaseName}
										</p>

										<div class="mt-auto flex items-center gap-2 flex-wrap">
											<span
												class="px-2 py-1 rounded-full text-xs font-medium border {getSeverityColor(
													scan.diagnosis.severity
												)}"
											>
												{scan.diagnosis.severity.charAt(0).toUpperCase() +
													scan.diagnosis.severity.slice(1)} Severity
											</span>
										</div>
									</div>
								</div>
							</button>

							<div class="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
								<div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
									<Clock3 size={14} />
									<span>{formatDate(scan.timestamp)}</span>
								</div>
								<button
									onclick={() => handleDeleteScan(scan.id)}
									disabled={deletingId === scan.id}
									class="inline-flex items-center gap-2 rounded-full border border-destructive/20 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
								>
									<Trash2 size={16} />
									{deletingId === scan.id ? "Deleting..." : "Delete"}
								</button>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	button {
		transition: background-color 0.3s ease;
	}
</style>
