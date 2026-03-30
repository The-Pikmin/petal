<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { fade, fly } from "svelte/transition";
	import { theme } from "$lib/stores/theme.store";
	import { WeatherService, type WeatherData } from "$lib/services/weather.service";
	import {
		Sun,
		Moon,
		Leaf,
		Droplets,
		Cloud,
		CloudRain,
		CloudSun,
		Snowflake,
		Camera,
		AlertCircle,
		Thermometer,
		History,
		ChevronRight,
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
	import { fetchScanHistory, preloadDiseaseLibrary } from "$lib/services/scan.service";

	let weather = $state<WeatherData | null>(null);
	let recentScans = $state<ScanRecord[]>([]);
	let showContent = $state(false);
	type WeatherRisk = {
		title: string;
		condition: string;
		diseases: string[];
		tone: "info" | "warning" | "danger";
		icon: typeof Droplets;
	};

	const totalScans = tweened(0, { duration: 1000, easing: cubicOut });
	const plantsSaved = tweened(0, { duration: 1000, easing: cubicOut });
	const diseasesIdentified = tweened(0, { duration: 1000, easing: cubicOut });
	const weatherRisks = $derived.by(() => {
		if (!weather || weather.location === "Weather unavailable" || weather.isStale) {
			return [] as WeatherRisk[];
		}

		const humidity = weather.humidity ?? 0;
		const temp = weather.temperature;
		const condition = weather.condition.toLowerCase();
		const alerts: WeatherRisk[] = [];

		if (humidity > 70) {
			alerts.push({
				title: "High humidity",
				condition: `Humidity is ${humidity}% today`,
				diseases: ["Powdery Mildew", "Downy Mildew", "Late Blight"],
				tone: humidity > 80 ? "warning" : "info",
				icon: Droplets,
			});
		}

		if (
			condition.includes("rain") ||
			condition.includes("drizzle") ||
			condition.includes("showers")
		) {
			alerts.push({
				title: "Moisture-related risk",
				condition: weather.condition,
				diseases: ["Bacterial Spot", "Septoria Leaf Spot", "Root Rot"],
				tone: "warning",
				icon: CloudRain,
			});
		}

		if (temp > 90) {
			alerts.push({
				title: "Heat stress conditions",
				condition: `${temp}°F can stress tender plants`,
				diseases: ["Heat Stress", "Spider Mites", "Sunburn"],
				tone: temp > 95 ? "danger" : "warning",
				icon: Thermometer,
			});
		}

		if (temp < 35) {
			alerts.push({
				title: "Cold weather warning",
				condition: `${temp}°F may damage exposed growth`,
				diseases: ["Frost Damage", "Cold Stress"],
				tone: "danger",
				icon: Snowflake,
			});
		}

		if (temp > 70 && humidity > 75) {
			alerts.push({
				title: "Prime fungal conditions",
				condition: `Warm and humid weather favors rapid spread`,
				diseases: ["Anthracnose", "Black Spot", "Rust"],
				tone: "warning",
				icon: AlertCircle,
			});
		}

		return alerts;
	});

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
			preloadDiseaseLibrary();

			// Fetch weather data
			try {
				weather = await WeatherService.getCurrentWeather();
			} catch {
				weather = null;
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
			} catch {
				recentScans = [];
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

	function openRisk(alert: WeatherRisk) {
		goto(`/library?q=${encodeURIComponent(alert.diseases[0])}`);
	}

	function getRiskClasses(tone: WeatherRisk["tone"]) {
		if (tone === "danger") {
			return "border-red-500/20 bg-[linear-gradient(135deg,rgba(239,68,68,0.16),rgba(239,68,68,0.05))] text-red-700 dark:text-red-300";
		}
		if (tone === "warning") {
			return "border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(245,158,11,0.05))] text-amber-700 dark:text-amber-300";
		}
		return "border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(14,165,233,0.05))] text-sky-700 dark:text-sky-300";
	}

	function getGreeting(): string {
		const hour = new Date().getHours();
		if (hour >= 5 && hour < 12) return "Good morning";
		if (hour >= 12 && hour < 17) return "Good afternoon";
		if (hour >= 17 && hour < 21) return "Good evening";
		return "Good night";
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
						<p class="text-xs text-muted-foreground">{getGreeting()}</p>
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
					<!-- Desktop Hamburger Menu -->
					<HamburgerMenu />
				</div>
			</div>
		</div>
	</header>

	<main class="px-6 py-6 space-y-8 pb-24">
		{#if !$isSplashVisible && showContent}
			<div class="container-responsive desktop-main-layout space-y-8 lg:space-y-0">
				<!-- Left Column (Desktop) -->
				<div class="space-y-8 lg:col-start-1 lg:row-start-1">
					<!-- Stats Strip -->
					<div
						class="rounded-3xl border border-border bg-card p-4 shadow-sm"
						in:fly={{ y: 20, duration: 400, delay: 40 }}
					>
						<div class="mb-3 flex items-center justify-between">
							<div>
								<p class="text-sm font-semibold text-foreground">Your snapshot</p>
								<p class="text-xs text-muted-foreground">Quick activity overview</p>
							</div>
						</div>
						<div class="grid grid-cols-3 gap-3">
							<div class="rounded-2xl bg-secondary/60 px-3 py-4 text-center">
								<div
									class="mb-2 flex justify-center text-sky-600 dark:text-sky-400"
								>
									<History size={16} />
								</div>
								<p class="text-lg font-bold text-foreground">
									{Math.round($totalScans)}
								</p>
								<p
									class="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground"
								>
									Scans
								</p>
							</div>
							<div class="rounded-2xl bg-secondary/60 px-3 py-4 text-center">
								<div
									class="mb-2 flex justify-center text-emerald-600 dark:text-emerald-400"
								>
									<Leaf size={16} />
								</div>
								<p class="text-lg font-bold text-foreground">
									{Math.round($plantsSaved)}
								</p>
								<p
									class="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground"
								>
									Plants
								</p>
							</div>
							<div class="rounded-2xl bg-secondary/60 px-3 py-4 text-center">
								<div
									class="mb-2 flex justify-center text-amber-600 dark:text-amber-400"
								>
									<AlertCircle size={16} />
								</div>
								<p class="text-lg font-bold text-foreground">
									{Math.round($diseasesIdentified)}
								</p>
								<p
									class="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground"
								>
									Alerts
								</p>
							</div>
						</div>
					</div>

					<!-- Primary Action -->
					<section
						class="rounded-[2rem] overflow-hidden border border-primary/15 bg-[linear-gradient(135deg,rgba(34,197,94,0.18),rgba(34,197,94,0.05))] p-6 shadow-sm"
						in:fade={{ duration: 300, delay: 80 }}
					>
						<div
							class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
						>
							<div>
								<p
									class="text-xs font-bold uppercase tracking-[0.24em] text-primary/80"
								>
									Next Step
								</p>
								<h3 class="mt-2 text-2xl font-bold text-foreground">
									Scan a plant and catch issues early
								</h3>
								<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
									Upload a photo to identify the plant, review disease risks, and
									save the result to your history.
								</p>
							</div>
							<div
								class="w-fit rounded-2xl bg-background/80 p-3 text-primary shadow-sm"
							>
								<Camera size={24} />
							</div>
						</div>
						<div class="mt-5 flex gap-3">
							<button
								onclick={() => goto("/camera")}
								class="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
							>
								Scan Plant
							</button>
							<button
								onclick={() => goto("/history")}
								class="rounded-full border border-border bg-background/80 px-4 py-3 text-sm font-semibold text-foreground hover:bg-background"
								aria-label="Open history"
							>
								<History size={18} />
							</button>
						</div>
					</section>

					<section
						class="rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-sm"
						in:fade={{ duration: 300, delay: 180 }}
					>
						<div>
							<div>
								<p
									class="text-xs font-bold uppercase tracking-[0.28em] text-primary/80"
								>
									Garden Forecast
								</p>
								<h3 class="mt-2 text-xl font-bold text-foreground">
									Today's conditions
								</h3>
								<p class="mt-1 text-sm text-muted-foreground">
									Local weather with plant-specific watchouts
								</p>
							</div>
						</div>

						{#if weather}
							{@const Icon = getWeatherIcon(weather.condition)}
							<div
								class="mt-5 rounded-[1.75rem] bg-secondary/45 p-5"
								in:fade={{ duration: 300 }}
							>
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-4xl font-bold text-foreground">
											{weather.temperature}°F
										</p>
										<p class="mt-1 text-sm text-muted-foreground">
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
								<div class="mt-4 flex flex-wrap items-center gap-2">
									<span
										class="rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm"
									>
										{weather.condition}
									</span>
									<span
										class="rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm"
									>
										{weather.humidity
											? `${weather.humidity}% humidity`
											: "Local weather"}
									</span>
									{#if weather.isStale}
										<span
											class="rounded-full border border-border bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
										>
											Last known conditions
										</span>
									{/if}
								</div>
							</div>

							{#if weather.isStale}
								<div
									class="mt-4 rounded-[1.5rem] border border-dashed border-border bg-secondary/25 p-4"
								>
									<p class="text-sm font-medium text-foreground">
										Plant risks paused for now
									</p>
									<p class="mt-1 text-sm text-muted-foreground">
										We’ll refresh disease alerts when live weather is available
										again.
									</p>
								</div>
							{:else if weatherRisks.length > 0}
								<div class="mt-5 space-y-3">
									<div
										class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
									>
										<div class="flex flex-wrap items-center gap-2">
											<p
												class="whitespace-nowrap text-sm font-semibold text-foreground"
											>
												Plant risk today
											</p>
											<div
												class="inline-flex whitespace-nowrap rounded-full border border-border bg-secondary/70 px-3 py-1 text-xs font-semibold text-muted-foreground"
											>
												{weatherRisks.length} active
											</div>
										</div>
										<p
											class="text-xs uppercase tracking-[0.18em] text-muted-foreground sm:text-right"
										>
											Tap to open in library
										</p>
									</div>
									{#each weatherRisks as alert}
										<button
											onclick={() => openRisk(alert)}
											class="group w-full rounded-[1.5rem] border p-4 text-left shadow-sm transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99] {getRiskClasses(
												alert.tone
											)}"
										>
											<div class="flex items-start gap-3">
												<div
													class="rounded-2xl bg-background/70 p-3 shadow-sm transition-transform group-hover:scale-105"
												>
													<alert.icon size={20} />
												</div>
												<div class="min-w-0 flex-1">
													<div
														class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
													>
														<p class="font-semibold">{alert.title}</p>
														<span
															class="inline-flex w-fit whitespace-nowrap rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
														>
															{alert.tone}
														</span>
													</div>
													<p class="mt-1 text-sm opacity-90">
														{alert.condition}
													</p>
													<p class="mt-3 text-sm font-medium">
														Watch for: {alert.diseases.join(", ")}
													</p>
												</div>
											</div>
										</button>
									{/each}
								</div>
							{:else}
								<div
									class="mt-4 rounded-[1.5rem] border border-border bg-secondary/25 p-4"
								>
									<p class="text-sm font-medium text-foreground">
										No elevated plant risks today
									</p>
									<p class="mt-1 text-sm text-muted-foreground">
										Conditions look fairly stable for common garden diseases
										right now.
									</p>
								</div>
							{/if}
						{:else}
							<div class="mt-5 rounded-[1.75rem] bg-secondary/45 p-5">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div
											class="mb-2 h-10 w-24 animate-pulse rounded-lg bg-muted"
										></div>
										<div class="h-5 w-32 animate-pulse rounded bg-muted"></div>
									</div>
									<div
										class="h-12 w-12 animate-pulse rounded-full bg-muted"
									></div>
								</div>
								<div class="mt-4 flex gap-2">
									<div class="h-9 w-28 animate-pulse rounded-full bg-muted"></div>
									<div class="h-9 w-24 animate-pulse rounded-full bg-muted"></div>
								</div>
							</div>
							<div class="mt-4 space-y-3">
								<div class="h-20 animate-pulse rounded-[1.5rem] bg-muted/70"></div>
								<div class="h-20 animate-pulse rounded-[1.5rem] bg-muted/70"></div>
							</div>
						{/if}
					</section>
				</div>

				<!-- Right Column (Desktop) -->
				<div class="space-y-6 lg:col-start-2 lg:row-start-1">
					<!-- Recent Scans Section -->
					<section class="space-y-4">
						<div
							class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
						>
							<div>
								<h2
									class="text-xl font-bold text-foreground"
									in:fly={{ y: 20, duration: 400, delay: 260 }}
								>
									Recent Scans
								</h2>
								<p class="text-sm text-muted-foreground">
									Your latest diagnoses and saved results
								</p>
							</div>
							<button
								onclick={() => goto("/history")}
								class="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
							>
								View all <ChevronRight size={16} />
							</button>
						</div>
						{#if recentScans.length > 0}
							<section>
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
														src={scan.thumbnailUrl || scan.imageUrl}
														alt="Scan"
														loading="lazy"
														decoding="async"
														class="w-full h-full object-cover"
													/>
												{:else if scan.photo.base64}
													<img
														src={`data:image/${scan.photo.format};base64,${scan.photo.base64}`}
														alt="Scan"
														loading="lazy"
														decoding="async"
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
													{scan.plantName || "Saved scan"}
												</h4>
												<p class="text-xs text-muted-foreground">
													{scan.diagnosis.diseaseName} • {new Date(
														scan.timestamp
													).toLocaleDateString()}
												</p>
											</div>
											<button
												onclick={() => goto("/history/" + scan.id)}
												class="p-2 hover:bg-muted rounded-full transition-colors"
											>
												<ChevronRight
													size={16}
													class="text-muted-foreground"
												/>
											</button>
										</div>
									{/each}
								</div>
							</section>
						{:else}
							<div
								class="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm"
								in:fly={{ y: 20, duration: 400, delay: 300 }}
							>
								<div class="flex items-center gap-3">
									<div class="rounded-2xl bg-primary/10 p-3 text-primary">
										<Camera size={20} />
									</div>
									<div>
										<p class="font-semibold text-foreground">No scans yet</p>
										<p class="text-sm text-muted-foreground">
											Take your first plant scan to start building history.
										</p>
									</div>
								</div>
							</div>
						{/if}

						<!-- Daily Tip -->
						<div
							class="rounded-3xl p-5 bg-primary/5 border border-primary/10 relative overflow-hidden mt-1"
							in:fly={{ y: 20, duration: 400, delay: 380 }}
						>
							<div class="relative z-10">
								<div class="flex items-center gap-2 mb-3 text-primary">
									<Leaf size={18} />
									<span class="text-xs font-bold uppercase tracking-[0.22em]"
										>Tip of the Day</span
									>
								</div>
								<h3 class="text-base font-bold mb-2">{mockDailyTip.title}</h3>
								<p class="text-sm text-muted-foreground leading-relaxed">
									{mockDailyTip.content}
								</p>
							</div>
							<div
								class="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl"
							></div>
						</div>
					</section>
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
