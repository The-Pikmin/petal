<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { requireAuth } from "$lib/guards/auth.guard";
	import { deleteUpload, fetchUploads } from "$lib/services/scan.service";
	import type { UploadRecordResponse } from "$lib/types/api.types";
	import {
		ArrowLeft,
		Images,
		Trash2,
		CheckCircle2,
		X,
		ChevronLeft,
		ChevronRight,
	} from "lucide-svelte";
	import { fade, fly } from "svelte/transition";

	import HamburgerMenu from "$lib/components/HamburgerMenu.svelte";

	const PAGE_SIZE = 24;

	let uploads = $state<UploadRecordResponse[]>([]);
	let totalUploads = $state(0);
	let totalPages = $state(1);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let deletingIds = $state<Set<number>>(new Set());
	let statusMessage = $state("");
	let statusTone = $state<"success" | "error" | "info">("info");
	let currentPage = $state(1);

	// Multi-select
	let selectMode = $state(false);
	let selectedIds = $state<Set<number>>(new Set());
	const selectedCount = $derived(selectedIds.size);
	const canDeleteSelected = $derived(
		selectedIds.size > 0 &&
			[...selectedIds].every((id) => {
				const u = uploads.find((u) => u.id === id);
				return u && !u.in_use;
			})
	);
	const hasInUseSelected = $derived(
		[...selectedIds].some((id) => uploads.find((u) => u.id === id)?.in_use)
	);

	onMount(() => {
		return requireAuth();
	});

	$effect(() => {
		void page.url;
		loadUploads();
	});

	async function loadUploads() {
		loading = true;
		error = null;
		try {
			const data = await fetchUploads(currentPage, PAGE_SIZE);
			uploads = data.results;
			totalUploads = data.total;
			totalPages = data.total_pages;
		} catch (err) {
			error = err instanceof Error ? err.message : "Failed to load uploads.";
		} finally {
			loading = false;
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}

	function toggleSelect(id: number) {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
		if (next.size === 0) selectMode = false;
	}

	function selectAll() {
		selectedIds = new Set(uploads.map((u) => u.id));
	}

	function exitSelectMode() {
		selectMode = false;
		selectedIds = new Set();
	}

	async function handleDeleteUpload(upload: UploadRecordResponse) {
		if (upload.in_use) {
			statusTone = "info";
			statusMessage =
				"Delete the saved scan that uses this image before removing the upload.";
			return;
		}

		const confirmed = window.confirm("Delete this uploaded image? This cannot be undone.");
		if (!confirmed) return;

		deletingIds = new Set([...deletingIds, upload.id]);
		statusMessage = "";
		try {
			await deleteUpload(upload.id);
			uploads = uploads.filter((item) => item.id !== upload.id);
			statusTone = "success";
			statusMessage = "Upload deleted.";
		} catch (err) {
			statusTone = "error";
			statusMessage = err instanceof Error ? err.message : "Unable to delete this upload.";
		} finally {
			const next = new Set(deletingIds);
			next.delete(upload.id);
			deletingIds = next;
		}
	}

	async function handleDeleteSelected() {
		const toDelete = [...selectedIds].filter((id) => {
			const u = uploads.find((u) => u.id === id);
			return u && !u.in_use;
		});

		if (toDelete.length === 0) return;

		const confirmed = window.confirm(
			`Delete ${toDelete.length} upload${toDelete.length > 1 ? "s" : ""}? This cannot be undone.`
		);
		if (!confirmed) return;

		deletingIds = new Set(toDelete);
		statusMessage = "";

		let deleted = 0;
		let failed = 0;
		for (const id of toDelete) {
			try {
				await deleteUpload(id);
				uploads = uploads.filter((u) => u.id !== id);
				deleted++;
			} catch {
				failed++;
			}
		}

		deletingIds = new Set();
		selectedIds = new Set();
		selectMode = false;

		if (failed === 0) {
			statusTone = "success";
			statusMessage = `${deleted} upload${deleted > 1 ? "s" : ""} deleted.`;
		} else {
			statusTone = "error";
			statusMessage = `Deleted ${deleted}, failed to delete ${failed}.`;
		}

		// Reload from server to get accurate pagination
		await loadUploads();
	}

	function goToPage(p: number) {
		currentPage = Math.max(1, Math.min(p, totalPages));
		selectedIds = new Set();
		loadUploads();
	}

	function handleThumbnailClick(upload: UploadRecordResponse) {
		if (selectMode) {
			toggleSelect(upload.id);
		}
	}

	function handleLongPress(upload: UploadRecordResponse) {
		if (!selectMode) {
			selectMode = true;
			selectedIds = new Set([upload.id]);
		}
	}

	// Long press detection
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let pressedId: number | null = null;

	function onPointerDown(upload: UploadRecordResponse) {
		pressedId = upload.id;
		pressTimer = setTimeout(() => {
			handleLongPress(upload);
			pressedId = null;
		}, 500);
	}

	function onPointerUp() {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
		pressedId = null;
	}

	$effect(() => {
		if (!statusMessage) return;
		const timeoutId = window.setTimeout(
			() => {
				statusMessage = "";
			},
			statusTone === "error" ? 4200 : 3200
		);

		return () => window.clearTimeout(timeoutId);
	});
</script>

<svelte:head>
	<title>Uploads - GreenEye</title>
</svelte:head>

<div class="min-h-screen pb-20 bg-secondary/30">
	<header
		class="px-6 py-4 bg-background sticky top-0 z-50 pt-[calc(1rem+env(safe-area-inset-top))]"
	>
		<div class="container-responsive">
			{#if selectMode}
				<div class="flex items-center justify-between" in:fade={{ duration: 150 }}>
					<button
						onclick={exitSelectMode}
						class="flex items-center gap-2 transition-opacity hover:opacity-70"
					>
						<X size={20} />
						<span class="font-medium">{selectedCount} selected</span>
					</button>
					<div class="flex items-center gap-3">
						<button
							onclick={selectAll}
							class="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
						>
							Select All
						</button>
						<button
							onclick={handleDeleteSelected}
							disabled={!canDeleteSelected || deletingIds.size > 0}
							class="inline-flex items-center gap-2 rounded-full border border-destructive/20 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<Trash2 size={16} />
							Delete
						</button>
					</div>
				</div>
			{:else}
				<div class="flex items-center justify-between">
					<button
						onclick={() => goto("/history")}
						class="flex items-center gap-2 transition-opacity hover:opacity-70"
					>
						<ArrowLeft size={20} />
						<span class="font-medium">History</span>
					</button>
					<div class="text-center">
						<h1 class="text-xl font-bold text-foreground">Uploads</h1>
						<p class="text-xs text-muted-foreground">
							{totalUploads} image{totalUploads !== 1 ? "s" : ""}
						</p>
					</div>
					<div class="flex items-center gap-2">
						{#if uploads.length > 0}
							<button
								onclick={() => {
									selectMode = true;
								}}
								class="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
							>
								Select
							</button>
						{/if}
						<HamburgerMenu />
					</div>
				</div>
			{/if}
		</div>
	</header>

	<main class="px-4 py-4">
		<div class="container-responsive space-y-4">
			{#if statusMessage}
				<div
					class={`rounded-2xl px-4 py-3 ${
						statusTone === "success"
							? "border border-green-500/20 bg-green-500/10"
							: statusTone === "error"
								? "border border-red-500/20 bg-red-500/10"
								: "border border-primary/15 bg-primary/5"
					}`}
					in:fade={{ duration: 200 }}
				>
					<p class="text-sm text-foreground">{statusMessage}</p>
				</div>
			{/if}

			{#if hasInUseSelected && selectMode}
				<div
					class="rounded-2xl px-4 py-3 border border-amber-500/20 bg-amber-500/10"
					in:fade={{ duration: 200 }}
				>
					<p class="text-sm text-foreground">
						Some selected images are in use by saved scans and cannot be deleted.
					</p>
				</div>
			{/if}

			{#if loading}
				<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
					{#each Array(12) as _}
						<div class="aspect-square animate-pulse bg-muted rounded-sm"></div>
					{/each}
				</div>
			{:else if error}
				<div class="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
					<p class="font-semibold text-foreground">{error}</p>
					<button
						onclick={loadUploads}
						class="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Try Again
					</button>
				</div>
			{:else if uploads.length === 0}
				<div class="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted"
					>
						<Images size={28} class="text-muted-foreground" />
					</div>
					<h2 class="text-lg font-semibold text-foreground">No uploads yet</h2>
					<p class="mt-2 text-sm text-muted-foreground">
						Images you capture for scans will appear here automatically.
					</p>
				</div>
			{:else}
				<!-- Photo grid -->
				<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
					{#each uploads as upload (upload.id)}
						<button
							class="relative aspect-square bg-muted overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary {selectedIds.has(
								upload.id
							)
								? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
								: ''} {deletingIds.has(upload.id) ? 'opacity-40' : ''}"
							onclick={() => handleThumbnailClick(upload)}
							onpointerdown={() => onPointerDown(upload)}
							onpointerup={onPointerUp}
							onpointerleave={onPointerUp}
							disabled={deletingIds.has(upload.id)}
						>
							<img
								src={upload.url}
								alt="Upload #{upload.id}"
								class="w-full h-full object-cover"
								draggable="false"
							/>

							<!-- Select overlay -->
							{#if selectMode}
								<div
									class="absolute inset-0 {selectedIds.has(upload.id)
										? 'bg-primary/20'
										: 'bg-black/0 group-hover:bg-black/10'} transition-colors"
								></div>
								<div class="absolute top-1.5 right-1.5">
									{#if selectedIds.has(upload.id)}
										<div
											class="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm"
										>
											<CheckCircle2
												size={16}
												class="text-primary-foreground"
											/>
										</div>
									{:else}
										<div
											class="w-6 h-6 rounded-full border-2 border-white/80 bg-black/20 shadow-sm"
										></div>
									{/if}
								</div>
							{/if}

							<!-- In-use badge -->
							{#if upload.in_use}
								<div class="absolute bottom-1 left-1">
									<span
										class="rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white"
									>
										In use
									</span>
								</div>
							{/if}

							<!-- Date on hover (non-select mode) -->
							{#if !selectMode}
								<div
									class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<p class="text-[10px] text-white/90">
										{formatDate(upload.uploaded_at)}
									</p>
								</div>
							{/if}
						</button>
					{/each}
				</div>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="flex items-center justify-center gap-2 pt-4">
						<button
							onclick={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
							class="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
							aria-label="Previous page"
						>
							<ChevronLeft size={18} />
						</button>

						{#each Array(totalPages) as _, i}
							{@const p = i + 1}
							{#if p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)}
								<button
									onclick={() => goToPage(p)}
									class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors {p ===
									currentPage
										? 'bg-primary text-primary-foreground'
										: 'hover:bg-muted text-muted-foreground'}"
								>
									{p}
								</button>
							{:else if p === currentPage - 2 || p === currentPage + 2}
								<span class="text-muted-foreground text-xs">...</span>
							{/if}
						{/each}

						<button
							onclick={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages}
							class="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
							aria-label="Next page"
						>
							<ChevronRight size={18} />
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</main>
</div>
