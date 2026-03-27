<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { requireAuth } from "$lib/guards/auth.guard";
	import { deleteUpload, fetchUploads } from "$lib/services/scan.service";
	import type { UploadRecordResponse } from "$lib/types/api.types";
	import { ArrowLeft, Images, Trash2, Link2, ShieldAlert } from "lucide-svelte";
	import { fade } from "svelte/transition";

	import HamburgerMenu from "$lib/components/HamburgerMenu.svelte";

	let uploads = $state<UploadRecordResponse[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let deletingId = $state<number | null>(null);
	let statusMessage = $state("");
	let statusTone = $state<"success" | "error" | "info">("info");

	onMount(() => {
		const unsubscribe = requireAuth();
		loadUploads();
		return unsubscribe;
	});

	async function loadUploads() {
		loading = true;
		error = null;
		try {
			uploads = await fetchUploads();
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

	async function handleDeleteUpload(upload: UploadRecordResponse) {
		if (upload.in_use) {
			statusTone = "info";
			statusMessage = "Delete the saved scan that uses this image before removing the upload.";
			return;
		}

		const confirmed = window.confirm(
			"Delete this uploaded image? This cannot be undone."
		);
		if (!confirmed) return;

		deletingId = upload.id;
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
			deletingId = null;
		}
	}

	$effect(() => {
		if (!statusMessage) return;
		const timeoutId = window.setTimeout(() => {
			statusMessage = "";
		}, statusTone === "error" ? 4200 : 3200);

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
					<p class="text-xs text-muted-foreground">Manage stored images</p>
				</div>
				<HamburgerMenu />
			</div>
		</div>
	</header>

	<main class="px-6 py-6">
		<div class="container-responsive space-y-4">
			<div
				class="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm"
				in:fade={{ duration: 200 }}
			>
				<div class="flex items-start gap-3">
					<div class="rounded-2xl bg-primary/10 p-3 text-primary">
						<Images size={22} />
					</div>
					<div>
						<h2 class="font-semibold text-foreground">Past uploads</h2>
						<p class="mt-1 text-sm text-muted-foreground">
							Uploads tied to saved scans stay protected so history images do not break.
						</p>
					</div>
				</div>
			</div>

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

			{#if loading}
				<div class="space-y-4">
					{#each Array(3) as _}
						<div class="h-32 animate-pulse rounded-3xl border border-border bg-card"></div>
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
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<Images size={28} class="text-muted-foreground" />
					</div>
					<h2 class="text-lg font-semibold text-foreground">No uploads yet</h2>
					<p class="mt-2 text-sm text-muted-foreground">
						Images you capture for scans will appear here automatically.
					</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
					{#each uploads as upload}
						<article class="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
							<div class="aspect-[4/3] bg-muted">
								<img src={upload.url} alt="Uploaded plant" class="h-full w-full object-cover" />
							</div>
							<div class="space-y-4 p-5">
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-sm font-semibold text-foreground">
											Upload #{upload.id}
										</p>
										<p class="text-xs text-muted-foreground">
											Added {formatDate(upload.uploaded_at)}
										</p>
									</div>
									{#if upload.in_use}
										<span
											class="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
										>
											In use
										</span>
									{:else}
										<span
											class="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
										>
											Unused
										</span>
									{/if}
								</div>

								<div class="rounded-2xl bg-secondary/50 px-4 py-3">
									<div class="flex items-start gap-2">
										{#if upload.in_use}
											<ShieldAlert size={16} class="mt-0.5 text-amber-600 dark:text-amber-300" />
											<p class="text-sm text-muted-foreground">
												This image is still referenced by a saved scan. Remove that scan first if you want to delete the upload.
											</p>
										{:else}
											<Link2 size={16} class="mt-0.5 text-muted-foreground" />
											<p class="text-sm text-muted-foreground break-all">
												{upload.supabase_path}
											</p>
										{/if}
									</div>
								</div>

								<div class="flex justify-end">
									<button
										onclick={() => handleDeleteUpload(upload)}
										disabled={upload.in_use || deletingId === upload.id}
										class="inline-flex items-center gap-2 rounded-full border border-destructive/20 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
									>
										<Trash2 size={16} />
										{deletingId === upload.id ? "Deleting..." : "Delete upload"}
									</button>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>
