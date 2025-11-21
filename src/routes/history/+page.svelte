<script lang="ts">
	import { onMount } from "svelte";
	import { mockScanHistory } from "$lib/services/mock-data";
	import type { ScanRecord } from "$lib/types";
	import { Clock, CheckCircle, AlertCircle, Camera } from "lucide-svelte";

	import HamburgerMenu from "$lib/components/HamburgerMenu.svelte";

	let scanHistory = $state<ScanRecord[]>(mockScanHistory);

	onMount(() => {
		// Load scans from session storage and merge with mock data
		const storedHistoryData = sessionStorage.getItem("scanHistory");
		const storedHistory: ScanRecord[] = storedHistoryData ? JSON.parse(storedHistoryData) : [];

		// Merge stored history with mock data, avoiding duplicates
		scanHistory = [
			...storedHistory,
			...mockScanHistory.filter(
				(mockScan) => !storedHistory.find((s) => s.id === mockScan.id)
			),
		];
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
		} else {
			return date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
			});
		}
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

	function getConfidenceColor(confidence: number) {
		if (confidence >= 0.9) return "text-green-600 dark:text-green-400";
		if (confidence >= 0.75) return "text-yellow-600 dark:text-yellow-400";
		return "text-orange-600 dark:text-orange-400";
	}

	function getConfidenceWidth(confidence: number) {
		return `${confidence * 100}%`;
	}
</script>

<svelte:head>
	<title>History - GreenEye</title>
</svelte:head>

<div class="min-h-screen pb-20 bg-secondary/30">
	<!-- Header -->
	<header
		class="px-6 py-6 bg-background sticky top-0 z-50 pt-[calc(1.5rem+env(safe-area-inset-top))]"
	>
		<div class="container-responsive">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h1 class="text-2xl font-bold text-foreground mb-1">Scan History</h1>
					<p class="text-sm text-muted-foreground">
						{scanHistory.length} scan{scanHistory.length !== 1 ? "s" : ""} total
					</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
						aria-label="Filter"
					>
						<Clock size={20} />
					</button>
					<HamburgerMenu />
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="px-6 py-4">
		<div class="container-responsive">
			{#if scanHistory.length > 0}
				<!-- Scan Timeline -->
				<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
					{#each scanHistory as scan}
						<button
							class="w-full rounded-3xl p-4 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-card text-card-foreground shadow-sm border border-border h-full"
						>
							<div class="flex gap-4 h-full">
								<!-- Scan Image -->
								<div
									class="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0"
								>
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
								</div>

								<!-- Scan Info -->
								<div class="flex-1 min-w-0 flex flex-col">
									<!-- Plant Name & Date -->
									<div class="flex items-start justify-between gap-2 mb-2">
										<div>
											<h3 class="font-semibold text-foreground">
												{scan.plantName || "Unknown Plant"}
											</h3>
											<p class="text-xs text-muted-foreground">
												{formatDate(scan.timestamp)} • {formatTime(
													scan.timestamp
												)}
											</p>
										</div>
									</div>

									<!-- Disease Name -->
									<p class="text-sm font-medium text-foreground mb-2">
										{scan.diagnosis.diseaseName}
									</p>

									<!-- Confidence Bar -->
									<div class="mb-2">
										<div class="flex items-center justify-between mb-1">
											<span class="text-xs text-muted-foreground">
												Confidence
											</span>
											<span
												class="text-xs font-medium {getConfidenceColor(
													scan.diagnosis.confidence
												)}"
											>
												{Math.round(scan.diagnosis.confidence * 100)}%
											</span>
										</div>
										<div
											class="w-full h-1.5 bg-muted rounded-full overflow-hidden"
										>
											<div
												class="h-full rounded-full transition-all {getConfidenceColor(
													scan.diagnosis.confidence
												)} bg-current"
												style="width: {getConfidenceWidth(
													scan.diagnosis.confidence
												)}"
											></div>
										</div>
									</div>

									<!-- Severity Badge -->
									<div class="flex items-center gap-2 mt-auto">
										<span
											class="px-2 py-1 rounded-full text-xs font-medium border {getSeverityColor(
												scan.diagnosis.severity
											)}"
										>
											{scan.diagnosis.severity.charAt(0).toUpperCase() +
												scan.diagnosis.severity.slice(1)} Severity
										</span>
										{#if scan.diagnosis.treatments.length > 0}
											<span
												class="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
											>
												{scan.diagnosis.treatments.length} treatment{scan
													.diagnosis.treatments.length !== 1
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
			{/if}
		</div>
	</main>
</div>

<style>
	/* Smooth transitions */
	button {
		transition:
			transform 0.2s ease,
			background-color 0.3s ease;
	}
</style>
