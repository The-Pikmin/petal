<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import type { CapturedPhoto, DiagnosisResult, ScanRecord } from "$lib/types";
	import {
		CheckCircle,
		AlertCircle,
		Info,
		Leaf,
		Droplet,
		Home,
		Camera,
		Save,
	} from "lucide-svelte";

	let photo = $state<CapturedPhoto | null>(null);
	let isAnalyzing = $state(false);
	let diagnosis = $state<DiagnosisResult | null>(null);
	let isSaved = $state(false);

	onMount(() => {
		// Get photo data from session storage
		const photoData = sessionStorage.getItem("capturedPhoto");
		if (photoData) {
			photo = JSON.parse(photoData);
			// Auto-start analysis
			setTimeout(() => analyzePlant(), 500);
		} else {
			// No photo data, redirect back to camera
			goto("/camera");
		}
	});

	async function analyzePlant() {
		if (!photo) return;

		isAnalyzing = true;

		// Simulate AI analysis delay (2-3 seconds)
		await new Promise((resolve) => setTimeout(resolve, 2500));

		// Generate mock diagnosis
		diagnosis = generateMockDiagnosis();
		isAnalyzing = false;
	}

	function generateMockDiagnosis(): DiagnosisResult {
		// Randomly select from different disease scenarios
		const scenarios = [
			{
				diseaseName: "Early Blight",
				confidence: 0.91,
				description:
					"A fungal disease causing dark spots with concentric rings on lower leaves. Common in tomatoes and potatoes.",
				severity: "medium" as const,
				treatments: [
					{
						name: "Copper Fungicide",
						description: "Apply copper-based fungicide spray",
						type: "chemical" as const,
						steps: [
							"Remove severely affected leaves",
							"Mix fungicide according to label instructions",
							"Spray in early morning or evening",
							"Repeat every 7-10 days",
						],
					},
					{
						name: "Cultural Control",
						description: "Improve growing conditions",
						type: "cultural" as const,
						steps: [
							"Mulch around base of plant",
							"Water at soil level, avoid wetting leaves",
							"Ensure good air circulation",
							"Rotate crops next season",
						],
					},
				],
				affectedParts: ["leaves", "stems"],
			},
			{
				diseaseName: "Powdery Mildew",
				confidence: 0.87,
				description:
					"A fungal disease appearing as white powdery coating on leaves and stems. Thrives in warm, dry conditions.",
				severity: "medium" as const,
				treatments: [
					{
						name: "Neem Oil Spray",
						description: "Organic treatment using neem oil",
						type: "organic" as const,
						steps: [
							"Mix neem oil with water per instructions",
							"Spray all plant surfaces thoroughly",
							"Apply weekly until symptoms improve",
							"Spray in evening to avoid leaf burn",
						],
					},
					{
						name: "Baking Soda Solution",
						description: "Homemade fungicide treatment",
						type: "organic" as const,
						steps: [
							"Mix 1 tbsp baking soda per gallon of water",
							"Add a few drops of liquid soap",
							"Spray affected areas",
							"Repeat every 3-5 days",
						],
					},
				],
				affectedParts: ["leaves", "stems", "flowers"],
			},
			{
				diseaseName: "Healthy Plant",
				confidence: 0.95,
				description:
					"No diseases detected! Your plant appears healthy and well-maintained. Continue current care routine.",
				severity: "low" as const,
				treatments: [
					{
						name: "Preventive Care",
						description: "Maintain healthy growing conditions",
						type: "cultural" as const,
						steps: [
							"Continue regular watering schedule",
							"Monitor for any changes in appearance",
							"Fertilize as needed for plant type",
							"Inspect regularly for early signs of issues",
						],
					},
				],
				affectedParts: [],
			},
			{
				diseaseName: "Aphid Infestation",
				confidence: 0.89,
				description:
					"Small sap-sucking insects detected on plant. Can spread quickly and transmit diseases if left untreated.",
				severity: "low" as const,
				treatments: [
					{
						name: "Water Spray",
						description: "Simple mechanical removal",
						type: "cultural" as const,
						steps: [
							"Spray aphids off with strong water stream",
							"Repeat daily until infestation clears",
							"Check undersides of leaves",
							"Monitor for return",
						],
					},
					{
						name: "Insecticidal Soap",
						description: "Organic pest control",
						type: "organic" as const,
						steps: [
							"Apply insecticidal soap according to label",
							"Spray directly on aphids",
							"Repeat every few days",
							"Rinse plant after 2-3 hours",
						],
					},
				],
				affectedParts: ["leaves", "stems", "buds"],
			},
		];

		// Randomly select a scenario
		const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
		return scenario;
	}

	function getImageSrc(photo: CapturedPhoto): string {
		return `data:image/${photo.format};base64,${photo.base64}`;
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

	function getSeverityIcon(severity: string) {
		switch (severity) {
			case "low":
				return CheckCircle;
			case "medium":
				return Info;
			case "high":
			case "critical":
				return AlertCircle;
			default:
				return Info;
		}
	}

	function getConfidenceColor(confidence: number) {
		if (confidence >= 0.9) return "text-green-600 dark:text-green-400";
		if (confidence >= 0.75) return "text-yellow-600 dark:text-yellow-400";
		return "text-orange-600 dark:text-orange-400";
	}

	function saveToHistory() {
		if (!photo || !diagnosis) return;

		// In a real app, this would save to a backend
		// For now, we'll just show a success message
		isSaved = true;

		// Create scan record
		const scanRecord: ScanRecord = {
			id: `scan-${Date.now()}`,
			photo,
			diagnosis,
			timestamp: Date.now(),
			plantName: "Scanned Plant",
		};

		// Store in sessionStorage (in real app, would save to backend/database)
		const existingHistory = sessionStorage.getItem("scanHistory");
		const history = existingHistory ? JSON.parse(existingHistory) : [];
		history.unshift(scanRecord);
		sessionStorage.setItem("scanHistory", JSON.stringify(history));

		// Show success and navigate after delay
		setTimeout(() => {
			goto("/history");
		}, 1500);
	}

	function scanAgain() {
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
			<!-- Spacer for centering -->
		</div>
	</header>

	<!-- Main Content -->
	<main class="px-6 py-6 space-y-6">
		{#if photo}
			<!-- Image Card -->
			<div
				class="rounded-3xl overflow-hidden bg-card text-card-foreground shadow-sm border border-border"
			>
				<div class="aspect-square bg-muted relative">
					<img
						src={getImageSrc(photo)}
						alt="Captured plant"
						class="w-full h-full object-cover"
					/>
					{#if isAnalyzing}
						<div
							class="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
						>
							<div class="text-center">
								<div
									class="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"
								></div>
								<p class="text-lg font-semibold">Analyzing your plant...</p>
								<p class="text-sm text-muted-foreground mt-1">
									This may take a few moments
								</p>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Results -->
			{#if diagnosis && !isAnalyzing}
				<!-- Diagnosis Card -->
				<div
					class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
				>
					<!-- Disease Header -->
					<div class="flex items-start justify-between mb-4">
						<div class="flex-1">
							<h2 class="text-2xl font-bold text-foreground mb-2">
								{diagnosis.diseaseName}
							</h2>
							<p class="text-sm text-muted-foreground">
								{diagnosis.description}
							</p>
						</div>
						{#if diagnosis.severity}
							{@const Icon = getSeverityIcon(diagnosis.severity)}
							<Icon
								size={28}
								class={diagnosis.severity === "low"
									? "text-green-600 dark:text-green-400"
									: diagnosis.severity === "medium"
										? "text-yellow-600 dark:text-yellow-400"
										: "text-orange-600 dark:text-orange-400"}
							/>
						{/if}
					</div>

					<!-- Confidence Score -->
					<div class="mb-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm font-medium text-muted-foreground">
								Confidence Score
							</span>
							<span
								class="text-sm font-bold {getConfidenceColor(diagnosis.confidence)}"
							>
								{Math.round(diagnosis.confidence * 100)}%
							</span>
						</div>
						<div class="w-full h-2 bg-muted rounded-full overflow-hidden">
							<div
								class="h-full rounded-full transition-all {getConfidenceColor(
									diagnosis.confidence
								)} bg-current"
								style="width: {diagnosis.confidence * 100}%"
							></div>
						</div>
					</div>

					<!-- Severity Badge and Affected Parts -->
					<div class="flex flex-wrap gap-2">
						<span
							class="px-3 py-1.5 rounded-full text-sm font-medium border {getSeverityColor(
								diagnosis.severity
							)}"
						>
							{diagnosis.severity.charAt(0).toUpperCase() +
								diagnosis.severity.slice(1)} Severity
						</span>
						{#if diagnosis.affectedParts && diagnosis.affectedParts.length > 0}
							<span
								class="px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground"
							>
								Affects: {diagnosis.affectedParts.join(", ")}
							</span>
						{/if}
					</div>
				</div>

				<!-- Treatments Card -->
				{#if diagnosis.treatments && diagnosis.treatments.length > 0}
					<div
						class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
					>
						<h3 class="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
							<Droplet size={20} class="text-primary" />
							<span>Recommended Treatments</span>
						</h3>

						<div class="space-y-4">
							{#each diagnosis.treatments as treatment}
								<div class="rounded-2xl p-4 bg-secondary/50 border border-border">
									<div class="flex items-start gap-3 mb-3">
										<div
											class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
										>
											<Leaf size={20} class="text-primary" />
										</div>
										<div class="flex-1">
											<h4 class="font-semibold text-foreground">
												{treatment.name}
											</h4>
											<p class="text-sm text-muted-foreground">
												{treatment.description}
											</p>
											<span
												class="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
											>
												{treatment.type.charAt(0).toUpperCase() +
													treatment.type.slice(1)}
											</span>
										</div>
									</div>

									<!-- Steps -->
									<div class="pl-13">
										<p class="text-sm font-medium text-foreground mb-2">
											Steps:
										</p>
										<ol class="space-y-1.5">
											{#each treatment.steps as step, index}
												<li
													class="text-sm text-muted-foreground flex gap-2"
												>
													<span class="font-medium text-primary"
														>{index + 1}.</span
													>
													<span>{step}</span>
												</li>
											{/each}
										</ol>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="space-y-3">
					<!-- Save Button -->
					{#if !isSaved}
						<button
							onclick={saveToHistory}
							class="w-full px-6 py-4 rounded-3xl font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
						>
							<Save size={20} />
							<span>Save to History</span>
						</button>
					{:else}
						<div
							class="w-full px-6 py-4 rounded-3xl font-semibold bg-green-600 text-white flex items-center justify-center gap-2"
						>
							<CheckCircle size={20} />
							<span>Saved to History!</span>
						</div>
					{/if}

					<!-- Scan Again Button -->
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

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	button {
		transition:
			transform 0.2s ease,
			background-color 0.3s ease;
	}
</style>
