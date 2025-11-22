<script lang="ts">
	import { X } from "lucide-svelte";
	import { fade, scale } from "svelte/transition";

	interface Props {
		isOpen: boolean;
		predictedDisease: string;
		onSubmit: (correctDisease: string, userNotes?: string) => void;
		onCancel: () => void;
	}

	let { isOpen = $bindable(), predictedDisease, onSubmit, onCancel }: Props = $props();

	// Disease options for dropdown
	const diseases = [
		"Early Blight",
		"Late Blight",
		"Powdery Mildew",
		"Downy Mildew",
		"Septoria Leaf Spot",
		"Bacterial Spot",
		"Aphid Infestation",
		"Whitefly Infestation",
		"Spider Mites",
		"Nutrient Deficiency (Nitrogen)",
		"Nutrient Deficiency (Phosphorus)",
		"Nutrient Deficiency (Potassium)",
		"Sunburn / Heat Stress",
		"Overwatering",
		"Underwatering",
		"Other (specify in notes)",
	];

	let selectedDisease = $state("");
	let userNotes = $state("");

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!selectedDisease) return;
		onSubmit(selectedDisease, userNotes || undefined);
		// Reset form
		selectedDisease = "";
		userNotes = "";
	}

	function handleCancel() {
		// Reset form
		selectedDisease = "";
		userNotes = "";
		onCancel();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			handleCancel();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>

		<!-- Modal Card -->
		<div
			class="relative w-full max-w-lg rounded-3xl bg-card text-card-foreground shadow-2xl border border-border max-h-[80vh] overflow-hidden flex flex-col"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-border">
				<h2 id="modal-title" class="text-xl font-bold text-foreground">
					Report Wrong Diagnosis
				</h2>
				<button
					onclick={handleCancel}
					class="w-10 h-10 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6 space-y-4">
				<!-- Current Prediction -->
				<div class="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4">
					<p class="text-sm text-muted-foreground mb-1">Predicted Disease:</p>
					<p class="font-semibold text-orange-700 dark:text-orange-400">
						{predictedDisease}
					</p>
				</div>

				<!-- Form -->
				<form id="flag-form" onsubmit={handleSubmit} class="space-y-4">
					<!-- Correct Disease Dropdown -->
					<div>
						<label
							for="correct-disease"
							class="block text-sm font-medium text-foreground mb-2"
						>
							What is the correct diagnosis? <span class="text-red-500">*</span>
						</label>
						<select
							id="correct-disease"
							bind:value={selectedDisease}
							required
							class="w-full px-4 py-3 rounded-2xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
						>
							<option value="" disabled>Select the correct disease...</option>
							{#each diseases as disease}
								<option value={disease}>{disease}</option>
							{/each}
						</select>
					</div>

					<!-- Notes Textarea -->
					<div>
						<label for="notes" class="block text-sm font-medium text-foreground mb-2">
							Additional Notes <span class="text-muted-foreground">(optional)</span>
						</label>
						<textarea
							id="notes"
							bind:value={userNotes}
							placeholder="Describe what you observed that differs from the prediction..."
							rows="4"
							maxlength="500"
							class="w-full px-4 py-3 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
						></textarea>
						<p class="text-xs text-muted-foreground mt-1 text-right">
							{userNotes.length}/500
						</p>
					</div>

					<!-- Info Box -->
					<div class="rounded-2xl bg-primary/10 border border-primary/20 p-4">
						<p class="text-sm text-muted-foreground">
							Your feedback helps us improve our plant disease detection model. Thank
							you for helping make GreenEye better!
						</p>
					</div>
				</form>
			</div>

			<!-- Footer -->
			<div class="p-6 border-t border-border flex gap-3">
				<button
					onclick={handleCancel}
					class="flex-1 px-6 py-3 rounded-2xl font-semibold border border-border bg-card text-card-foreground hover:bg-muted transition-all"
				>
					Cancel
				</button>
				<button
					type="submit"
					form="flag-form"
					disabled={!selectedDisease}
					class="flex-1 px-6 py-3 rounded-2xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					Submit Report
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom select styling */
	select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		background-size: 1.25rem;
		padding-right: 2.5rem;
	}

	/* Ensure smooth scrolling */
	.overflow-y-auto {
		-webkit-overflow-scrolling: touch;
	}
</style>
