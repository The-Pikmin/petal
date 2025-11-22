<script lang="ts">
	import { goto } from "$app/navigation";
	import { hasSeenOnboarding } from "$lib/stores/onboarding.store";
	import { Camera, Search, Droplet } from "lucide-svelte";

	const content = [
		{
			title: "Instant Plant ID",
			description:
				"Identify over 20,000 plant species with a single photo. Just point and shoot.",
			color: "text-green-500",
			icon: Camera,
		},
		{
			title: "Disease Diagnosis",
			description:
				"Spot problems early. Our AI diagnoses diseases and suggests treatments instantly.",
			color: "text-orange-500",
			icon: Search,
		},
		{
			title: "Expert Care Guides",
			description:
				"Get personalized watering schedules and care tips to help your garden thrive.",
			color: "text-blue-500",
			icon: Droplet,
		},
	];

	let step = $state(0);
	let scrollContainer: HTMLDivElement;
	let isExiting = $state(false);

	function completeOnboarding() {
		isExiting = true;
		setTimeout(() => {
			hasSeenOnboarding.complete();
			goto("/home");
		}, 500);
	}

	function handleScroll() {
		if (!scrollContainer) return;
		const scrollLeft = scrollContainer.scrollLeft;
		const width = scrollContainer.clientWidth;
		step = Math.round(scrollLeft / width);
	}
</script>

<div
	class="min-h-screen bg-background relative overflow-hidden flex flex-col transition-opacity duration-500 ease-in-out"
	class:opacity-0={isExiting}
>
	<!-- Background Elements -->
	<div class="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
		<div
			class="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl"
		></div>
		<div
			class="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-secondary/10 rounded-full blur-3xl"
		></div>
	</div>

	<!-- Skip Button -->
	<div class="absolute top-6 right-6 z-20">
		<button
			onclick={completeOnboarding}
			class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
		>
			Skip
		</button>
	</div>

	<!-- Scroll Container -->
	<div
		bind:this={scrollContainer}
		onscroll={handleScroll}
		class="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full"
		style="scrollbar-width: none; -ms-overflow-style: none;"
	>
		{#each content as item, i}
			{@const Icon = item.icon}
			<div
				class="w-full flex-shrink-0 snap-center snap-always flex flex-col items-center justify-center p-6 h-full"
			>
				<div class="max-w-md w-full flex flex-col items-center text-center space-y-12">
					<!-- Icon -->
					<div
						class="relative w-48 h-48 flex items-center justify-center transition-all duration-500 ease-out"
						class:scale-110={i === step}
						class:scale-75={i !== step}
						class:opacity-50={i !== step}
					>
						<div class="absolute inset-0 bg-muted/30 rounded-full scale-75"></div>
						<div
							class={`relative z-10 ${item.color} transition-all duration-500`}
							class:animate-float={i === step}
						>
							<Icon size={96} strokeWidth={1.5} />
						</div>
					</div>

					<!-- Text -->
					<div
						class="space-y-4 transition-all duration-500 delay-100"
						class:opacity-100={i === step}
						class:opacity-30={i !== step}
						class:translate-y-0={i === step}
						class:translate-y-4={i !== step}
					>
						<h1 class="text-3xl font-bold tracking-tight">{item.title}</h1>
						<p class="text-lg text-muted-foreground leading-relaxed">
							{item.description}
						</p>
					</div>

					<!-- Get Started Button (Last Slide Only) -->
					{#if i === content.length - 1}
						<div class="pt-8 w-full">
							<button
								onclick={completeOnboarding}
								class="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
							>
								Get Started
							</button>
						</div>
					{:else}
						<!-- Spacer to keep layout consistent -->
						<div class="pt-8 w-full h-[88px]"></div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Indicators -->
	<div class="absolute bottom-12 left-0 right-0 flex justify-center gap-2 z-20">
		{#each content as _, i}
			<div
				class="h-2 rounded-full transition-all duration-300 {i === step
					? 'w-8 bg-primary'
					: 'w-2 bg-muted'}"
			></div>
		{/each}
	</div>
</div>

<style>
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-10px);
		}
	}
	.animate-float {
		animation: float 3s ease-in-out infinite;
	}
</style>
