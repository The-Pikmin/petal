<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { fade, fly } from "svelte/transition";
	import { theme } from "$lib/stores/theme.store";
	import { WeatherService, type WeatherData } from "$lib/services/weather.service";
	import {
		Bell,
		Search,
		Sun,
		Moon,
		Leaf,
		Cloud,
		CloudRain,
		CloudSun,
		Snowflake,
	} from "lucide-svelte";

	import HamburgerMenu from "$lib/components/HamburgerMenu.svelte";

	let weather = $state<WeatherData | null>(null);

	onMount(async () => {
		// Fetch weather data
		try {
			weather = await WeatherService.getCurrentWeather();
		} catch (error) {
			console.error("Failed to load weather:", error);
		}
	});

	const plantCards = [
		{
			title: "Recent Scans",
			subtitle: "View your history",
			image: "/images/plants/succulent.png",
			comingSoon: true,
		},
		{
			title: "Plant Library",
			subtitle: "Browse diseases",
			image: "/images/plants/fern.png",
			comingSoon: true,
		},
		{
			title: "Care Tips",
			subtitle: "Expert advice",
			image: "/images/plants/monstera.png",
			comingSoon: true,
		},
		{
			title: "Fertilizer Guide",
			subtitle: "Nutrition info",
			image: "/images/plants/snake-plant.png",
			comingSoon: true,
		},
	];

	function handleScanPlant() {
		goto("/camera");
	}

	function getWeatherIcon(condition: string) {
		if (condition.includes("Rain") || condition.includes("Drizzle")) return CloudRain;
		if (condition.includes("Snow")) return Snowflake;
		if (condition.includes("Cloud")) return Cloud;
		if (condition.includes("Partly")) return CloudSun;
		return Sun;
	}
</script>

<svelte:head>
	<title>Home - GreenEye</title>
</svelte:head>

<!-- Container for max-width on larger screens -->
<div class="min-h-screen pb-20 bg-secondary/30">
	<!-- Header -->
	<header
		class="px-6 py-4 bg-background fixed top-0 left-0 right-0 z-50 pt-[calc(1rem+env(safe-area-inset-top))]"
	>
		<div class="container-responsive">
			<div class="flex items-center justify-between mb-4">
				<!-- Profile Icon & Greeting -->
				<div class="flex items-center gap-4">
					<div
						class="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground"
					>
						<Leaf size={20} />
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Good morning</p>
						<p class="font-semibold text-foreground">Gardener</p>
					</div>
				</div>

				<!-- Right Actions -->
				<div class="flex items-center gap-2">
					<button
						onclick={() => theme.toggle()}
						class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
						aria-label="Toggle theme"
					>
						{#if $theme === "light"}
							<Moon size={20} />
						{:else}
							<Sun size={20} />
						{/if}
					</button>
					<button
						class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
						aria-label="Notifications"
					>
						<Bell size={20} />
					</button>

					<!-- Desktop Hamburger Menu -->
					<HamburgerMenu />
				</div>
			</div>

			<!-- Search Bar -->
			<div class="relative">
				<input
					type="text"
					placeholder="Search plant diseases..."
					class="w-full px-4 py-3 pr-12 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
				<button
					class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground"
				>
					<Search size={16} />
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="px-6 py-6 space-y-6 pt-40">
		<div class="container-responsive desktop-main-layout space-y-6 lg:space-y-0">
			<!-- Main CTA Card - Check your plant (Desktop: Left Column) -->
			<div
				class="rounded-3xl p-6 transition-all bg-card text-card-foreground shadow-sm border border-border lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-48 lg:h-fit"
				in:fly={{ y: 20, duration: 400, delay: 200 }}
			>
				<div class="flex flex-col items-center text-center h-full justify-center">
					<!-- Plant Illustration -->
					<div class="w-48 h-48 mb-4 relative">
						<img
							src="/images/plants/main-plant.png"
							alt="Check your plant"
							class="w-full h-full object-contain"
						/>
					</div>

					<!-- Text -->
					<h2 class="text-2xl font-bold mb-2">Check your plant</h2>
					<p class="text-sm mb-6 text-muted-foreground">
						Take a photo or upload an image to get
						<br />
						instant disease diagnosis and care tips
					</p>

					<!-- CTA Button -->
					<button
						onclick={handleScanPlant}
						class="px-8 py-3 rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
					>
						Get Started
					</button>
				</div>
			</div>

			<!-- Weather Card (Desktop: Right Column Top) -->
			<div
				class="rounded-3xl p-6 transition-all bg-card text-card-foreground shadow-sm border border-border lg:col-start-2 lg:row-start-1"
				in:fade={{ duration: 300, delay: 100 }}
			>
				{#if weather}
					{@const Icon = getWeatherIcon(weather.condition)}
					<div class="flex items-center justify-between">
						<div>
							<p class="text-4xl font-bold mb-1">
								{weather.temperature}°F
							</p>
							<p class="text-sm text-muted-foreground">
								{weather.location}
							</p>
						</div>
						<div class="text-primary">
							<Icon size={48} />
						</div>
					</div>
					<div class="mt-4 flex items-center justify-between">
						<span class="text-sm font-medium text-muted-foreground">
							{weather.condition}
						</span>
						<button
							class="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
						>
							Hourly
						</button>
					</div>
				{:else}
					<!-- Loading placeholder -->
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<div class="h-12 w-24 bg-muted rounded-lg mb-2 animate-pulse"></div>
							<div class="h-4 w-32 bg-muted rounded animate-pulse"></div>
						</div>
						<div class="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
					</div>
					<div class="mt-4 flex items-center justify-between">
						<div class="h-4 w-24 bg-muted rounded animate-pulse"></div>
						<div class="h-8 w-16 bg-muted rounded-full animate-pulse"></div>
					</div>
				{/if}
			</div>

			<!-- Plant Grid Section (Desktop: Right Column Bottom) -->
			<div class="lg:col-start-2 lg:row-start-2">
				<h3 class="text-lg font-bold mb-4 text-foreground">Explore</h3>
				<div class="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
					{#each plantCards as card, index}
						<button
							class="rounded-3xl p-4 text-left transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden bg-card text-card-foreground shadow-sm border border-border"
							disabled={card.comingSoon}
							in:fly={{
								y: 20,
								duration: 300,
								delay: 300 + index * 50,
							}}
						>
							{#if card.comingSoon}
								<div
									class="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground"
								>
									Soon
								</div>
							{/if}

							<!-- Plant Image -->
							<div
								class="w-full aspect-square mb-3 rounded-2xl overflow-hidden bg-muted"
							>
								<img
									src={card.image}
									alt={card.title}
									class="w-full h-full object-cover"
								/>
							</div>

							<!-- Text -->
							<h4 class="font-semibold mb-1">
								{card.title}
							</h4>
							<p class="text-xs text-muted-foreground">
								{card.subtitle}
							</p>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	/* Smooth transitions */
	button {
		transition:
			transform 0.2s ease,
			background-color 0.3s ease,
			box-shadow 0.3s ease;
	}

	button:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	button:active:not(:disabled) {
		transform: translateY(0);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
