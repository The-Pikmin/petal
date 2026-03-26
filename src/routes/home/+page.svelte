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
		Camera,
		AlertCircle,
	} from "lucide-svelte";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { isSplashVisible } from "$lib/stores/splash.store";
	import { hasLoadedHome } from "$lib/stores/app.store";

	import HamburgerMenu from "$lib/components/HamburgerMenu.svelte";

	import { mockDailyTip } from "$lib/data/mockData";
	import type { ScanRecord } from "$lib/types";
	import { currentUser } from "$lib/stores/auth.store";
	import { requireAuth } from "$lib/guards/auth.guard";
	import { fetchScanHistory } from "$lib/services/scan.service";

	let weather = $state<WeatherData | null>(null);
	let recentScans = $state<ScanRecord[]>([]);
	let showContent = $state(false);

	const totalScans = tweened(0, { duration: 1000, easing: cubicOut });
	const plantsSaved = tweened(0, { duration: 1000, easing: cubicOut });
	const diseasesIdentified = tweened(0, { duration: 1000, easing: cubicOut });

	onMount(() => {
		const authUnsub = requireAuth();
		// Animate stats only when splash is gone
		const unsubscribe = isSplashVisible.subscribe((visible) => {
			if (!visible) {
				if ($hasLoadedHome) {
					showContent = true;
				} else {
					setTimeout(() => {
						showContent = true;
						hasLoadedHome.set(true);
					}, 600);
				}
			}
		});

		const loadData = async () => {
			// Fetch weather data
			try {
				weather = await WeatherService.getCurrentWeather();
			} catch (error) {
				console.error("Failed to load weather:", error);
			}

			// Load recent scans from backend
			try {
				recentScans = await fetchScanHistory();
				totalScans.set(recentScans.length);
				plantsSaved.set(new Set(recentScans.map((s) => s.plantName).filter(Boolean)).size);
				diseasesIdentified.set(
					new Set(
						recentScans
							.map((s) => s.diagnosis.diseaseName)
							.filter((d) => d && d !== "Healthy Plant" && d !== "Unknown")
					).size
				);
			} catch (err) {
				console.error("Failed to load recent scans:", err);
			}
		};

		loadData();

		return () => {
			unsubscribe();
			authUnsub();
		};
	});

	function getWeatherIcon(condition: string) {
		// Clear / Sunny
		if (condition === "Clear" || condition === "Mainly Clear") return Sun;

		// Cloudy
		if (condition === "Partly Cloudy") return CloudSun;
		if (condition === "Overcast" || condition === "Cloudy") return Cloud;
		if (condition === "Foggy") return Cloud; // Using Cloud for fog as best approximation

		// Rain / Drizzle
		if (condition.includes("Drizzle")) return CloudRain;
		if (condition.includes("Rain")) return CloudRain;
		if (condition.includes("Showers")) return CloudRain;

		// Snow
		if (condition.includes("Snow")) return Snowflake;

		// Thunderstorm
		if (condition.includes("Thunderstorm")) return CloudRain; // Could import CloudLightning if available, defaulting to Rain for now

		return Sun; // Default
	}

	function getWeatherAnimation(condition: string) {
		// Clear / Sunny - Custom radiate animation (spin + pulse)
		if (condition === "Clear" || condition === "Mainly Clear") return "animate-sun-radiate";

		// Cloudy - Pulse for clouds
		if (
			condition === "Partly Cloudy" ||
			condition === "Overcast" ||
			condition === "Cloudy" ||
			condition === "Foggy"
		)
			return "animate-[pulse_4s_ease-in-out_infinite]";

		// Rain / Drizzle - Bounce for rain drops
		if (
			condition.includes("Rain") ||
			condition.includes("Drizzle") ||
			condition.includes("Showers")
		)
			return "animate-[bounce_2s_infinite]";

		// Snow - Gentle spin/float
		if (condition.includes("Snow")) return "animate-[spin_3s_linear_infinite]";

		// Thunderstorm - Fast pulse or flash
		if (condition.includes("Thunderstorm")) return "animate-[pulse_0.5s_ease-in-out_infinite]";

		return "animate-sun-radiate"; // Default
	}
</script>

<svelte:head>
	<title>Home - GreenEye</title>
</svelte:head>

<!-- Container for max-width on larger screens -->
<div class="min-h-screen pb-20 bg-secondary/30" in:fade={{ duration: $hasLoadedHome ? 0 : 600 }}>
	<!-- Header -->
	<header
		class="px-6 py-4 bg-background sticky top-0 z-50 pt-[calc(1rem+env(safe-area-inset-top))]"
	>
		<div class="container-responsive">
			<div class="flex items-center justify-between mb-4">
				<!-- Profile Icon & Greeting -->
				<div class="flex items-center gap-4">
					<button
						onclick={() => goto("/profile")}
						class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
					>
						<Leaf size={20} />
					</button>
					<div>
						<p class="text-xs text-muted-foreground">Good morning</p>
						<h2 class="font-bold text-foreground leading-none">
							{$currentUser?.username ?? "Gardener"}
						</h2>
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
							<Sun size={20} />
						{:else}
							<Moon size={20} />
						{/if}
					</button>
					<button
						class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted relative"
						aria-label="Notifications"
					>
						<Bell size={20} />
						<span
							class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"
						></span>
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

	<main class="px-6 py-6 space-y-8 pb-24">
		{#if !$isSplashVisible && showContent}
			<div class="container-responsive desktop-main-layout space-y-8 lg:space-y-0">
				<!-- Left Column (Desktop) -->
				<div class="space-y-8 lg:col-start-1 lg:row-start-1">
					<!-- Weather Widget -->
					<div
						class="rounded-3xl p-6 transition-all bg-card text-card-foreground shadow-sm border border-border"
						in:fade={{ duration: 300, delay: 100 }}
					>
						{#if weather}
							{@const Icon = getWeatherIcon(weather.condition)}
							<div in:fade={{ duration: 300 }}>
								<div class="flex items-center justify-between">
									<div>
										<p class="text-4xl font-bold mb-1">
											{weather.temperature}°F
										</p>
										<p class="text-sm text-muted-foreground">
											{weather.location}
										</p>
									</div>
									<div
										class="text-primary {getWeatherAnimation(
											weather.condition
										)}"
									>
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
							</div>
						{:else}
							<!-- Loading placeholder -->
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<div
										class="h-10 w-24 bg-muted rounded-lg mb-1 animate-pulse"
									></div>
									<div class="h-5 w-32 bg-muted rounded animate-pulse"></div>
								</div>
								<div class="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
							</div>
							<div class="mt-4 flex items-center justify-between">
								<div class="h-5 w-24 bg-muted rounded animate-pulse"></div>
								<div class="h-9 w-16 bg-muted rounded-full animate-pulse"></div>
							</div>
						{/if}
					</div>

					<!-- User Stats -->
					<div class="grid grid-cols-3 gap-3">
						<!-- Total Scans -->
						<div
							class="rounded-2xl p-4 text-center bg-card text-card-foreground shadow-sm border border-border flex flex-col items-center justify-center"
							in:fly={{ y: 20, duration: 400, delay: 150 }}
						>
							<div
								class="w-10 h-10 mb-2 rounded-full flex items-center justify-center bg-primary/10 text-primary"
							>
								<Camera size={18} />
							</div>
							<p class="text-xl font-bold text-foreground leading-none mb-1">
								{Math.round($totalScans)}
							</p>
							<p
								class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider"
							>
								Scans
							</p>
						</div>

						<!-- Plants Saved -->
						<div
							class="rounded-2xl p-4 text-center bg-card text-card-foreground shadow-sm border border-border flex flex-col items-center justify-center"
							in:fly={{ y: 20, duration: 400, delay: 200 }}
						>
							<div
								class="w-10 h-10 mb-2 rounded-full flex items-center justify-center bg-green-500/10 text-green-600 dark:text-green-400"
							>
								<Leaf size={18} />
							</div>
							<p class="text-xl font-bold text-foreground leading-none mb-1">
								{Math.round($plantsSaved)}
							</p>
							<p
								class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider"
							>
								Plants
							</p>
						</div>

						<!-- Diseases Identified -->
						<div
							class="rounded-2xl p-4 text-center bg-card text-card-foreground shadow-sm border border-border flex flex-col items-center justify-center"
							in:fly={{ y: 20, duration: 400, delay: 250 }}
						>
							<div
								class="w-10 h-10 mb-2 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-600 dark:text-orange-400"
							>
								<AlertCircle size={18} />
							</div>
							<p class="text-xl font-bold text-foreground leading-none mb-1">
								{Math.round($diseasesIdentified)}
							</p>
							<p
								class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider"
							>
								Diseases
							</p>
						</div>
					</div>

					<!-- Daily Tip -->
					<div
						class="rounded-3xl p-6 bg-primary/5 border border-primary/10 relative overflow-hidden"
						in:fly={{ y: 20, duration: 400, delay: 200 }}
					>
						<div class="relative z-10">
							<div class="flex items-center gap-2 mb-3 text-primary">
								<Leaf size={20} />
								<span class="text-sm font-bold uppercase tracking-wider"
									>Tip of the Day</span
								>
							</div>
							<h3 class="text-lg font-bold mb-2">{mockDailyTip.title}</h3>
							<p class="text-sm text-muted-foreground leading-relaxed">
								{mockDailyTip.content}
							</p>
						</div>
						<!-- Decorative background element -->
						<div
							class="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"
						></div>
					</div>
				</div>

				<!-- Right Column (Desktop) -->
				<div class="space-y-8 lg:col-start-2 lg:row-start-1">
					<!-- Recent Scans Section -->
					{#if recentScans.length > 0}
						<section>
							<h2
								class="text-xl font-bold text-foreground mb-4"
								in:fly={{ y: 20, duration: 400, delay: 400 }}
							>
								Recent Scans
							</h2>
							<div class="space-y-3">
								{#each recentScans.slice(0, 3) as scan, i}
									<div
										class="flex items-center gap-4 p-3 rounded-2xl bg-card border border-border shadow-sm"
										in:fly|global={{
											x: 20,
											duration: 400,
											delay: 450 + i * 50,
										}}
									>
										<div
											class="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0"
										>
											{#if scan.imageUrl}
												<img
													src={scan.imageUrl}
													alt="Scan"
													class="w-full h-full object-cover"
												/>
											{:else if scan.photo.base64}
												<img
													src={`data:image/${scan.photo.format};base64,${scan.photo.base64}`}
													alt="Scan"
													class="w-full h-full object-cover"
												/>
											{:else}
												<div
													class="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
												>
													<Leaf size={24} class="text-primary" />
												</div>
											{/if}
										</div>
										<div class="flex-1 min-w-0">
											<h4 class="font-semibold truncate">
												{scan.diagnosis.diseaseName}
											</h4>
											<p class="text-xs text-muted-foreground">
												{new Date(scan.timestamp).toLocaleDateString()}
											</p>
										</div>
										<button
											onclick={() => goto("/history/" + scan.id)}
											class="p-2 hover:bg-muted rounded-full transition-colors"
										>
											<Search size={16} class="text-muted-foreground" />
										</button>
									</div>
								{/each}
							</div>
						</section>
					{/if}
				</div>
			</div>
		{/if}
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

	/* Hide scrollbar for Chrome, Safari and Opera */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
