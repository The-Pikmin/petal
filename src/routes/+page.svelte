<script lang="ts">
	import { goto } from "$app/navigation";
	import { fade, fly } from "svelte/transition";
	import { Camera, ShieldCheck, Sprout, ArrowRight, Sun, Moon, Menu, X } from "lucide-svelte";
	import { theme } from "$lib/stores/theme.store";
	import logoDark from "$lib/assets/logo-dark.png";
	import logoLight from "$lib/assets/logo-light.png";

	let isMenuOpen = $state(false);

	function handleGetStarted() {
		isMenuOpen = false;
		goto("/signup");
	}

	function handleLogin() {
		isMenuOpen = false;
		goto("/login");
	}
</script>

<svelte:head>
	<title>GreenEye - Smart Plant Care</title>
</svelte:head>

<div class="min-h-screen bg-background flex flex-col">
	<!-- Navigation -->
	<nav class="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
		<div class="flex items-center gap-2 text-primary">
			<img
				src={$theme === "light" ? logoDark : logoLight}
				alt="GreenEye Logo"
				class="w-10 h-10 object-contain"
			/>
			<span class="font-bold text-xl">GreenEye</span>
		</div>

		<!-- Desktop Navigation -->
		<div class="hidden sm:flex items-center gap-4">
			<button
				onclick={() => theme.toggle()}
				class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
				aria-label="Toggle theme"
			>
				{#if $theme === "light"}
					<Moon size={20} />
				{:else}
					<Sun size={20} />
				{/if}
			</button>
			<button
				onclick={handleLogin}
				class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
			>
				Log in
			</button>
			<button
				onclick={handleGetStarted}
				class="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
			>
				Get Started
			</button>
		</div>

		<!-- Mobile Navigation -->
		<div class="sm:hidden flex items-center gap-2">
			<button
				onclick={() => theme.toggle()}
				class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
				aria-label="Toggle theme"
			>
				{#if $theme === "light"}
					<Moon size={20} />
				{:else}
					<Sun size={20} />
				{/if}
			</button>
			<button
				onclick={() => (isMenuOpen = !isMenuOpen)}
				class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted text-foreground"
				aria-label="Toggle menu"
			>
				{#if isMenuOpen}
					<X size={24} />
				{:else}
					<Menu size={24} />
				{/if}
			</button>
		</div>
	</nav>

	<!-- Mobile Menu -->
	{#if isMenuOpen}
		<div
			class="sm:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
			transition:fade={{ duration: 200 }}
			onclick={() => (isMenuOpen = false)}
			onkeydown={(e) => e.key === "Escape" && (isMenuOpen = false)}
			role="button"
			tabindex="0"
			aria-label="Close menu"
		>
			<div
				class="absolute top-0 right-0 w-64 h-full bg-card border-l border-border shadow-xl p-6"
				transition:fly={{ x: 300, duration: 300 }}
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<div class="flex justify-end mb-8">
					<button
						onclick={() => (isMenuOpen = false)}
						class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted text-foreground"
					>
						<X size={24} />
					</button>
				</div>
				<div class="flex flex-col gap-4">
					<button
						onclick={handleLogin}
						class="px-4 py-3 rounded-lg text-left hover:bg-muted transition-colors text-foreground"
					>
						Log in
					</button>
					<button
						onclick={handleGetStarted}
						class="px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
					>
						Get Started
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Hero Section -->
	<main class="flex-1 flex flex-col">
		<section
			class="px-6 py-12 md:py-24 lg:py-32 max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center"
		>
			<div class="space-y-6" in:fly={{ y: 20, duration: 600 }}>
				<h1 class="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
					Your Personal <span class="text-primary">Plant Doctor</span> in Your Pocket
				</h1>
				<p class="text-lg text-muted-foreground leading-relaxed max-w-lg">
					Instantly identify plants, diagnose diseases, and get expert care tips. GreenEye
					helps your garden thrive with the power of AI.
				</p>
				<div class="flex flex-col sm:flex-row gap-4 pt-4">
					<button
						onclick={handleGetStarted}
						class="px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center gap-2"
					>
						Start for Free
						<ArrowRight size={20} />
					</button>
					<button
						onclick={handleLogin}
						class="px-8 py-4 rounded-full bg-secondary text-secondary-foreground font-semibold text-lg hover:bg-secondary/80 transition-all hover:scale-105"
					>
						I have an account
					</button>
				</div>
			</div>

			<div class="relative max-w-xs hidden md:block" in:fade={{ duration: 800, delay: 200 }}>
				<div
					class="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl"
				></div>
				<div
					class="relative bg-card border border-border rounded-3xl p-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
				>
					<!-- Mock App Interface Preview -->
					<div
						class="aspect-[9/19] bg-background rounded-2xl overflow-hidden relative border border-border"
					>
						<div
							class="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center"
						>
							<Camera size={48} class="mb-4 text-primary" />
							<p class="font-medium">
								Point your camera at any plant to identify it instantly
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Features Section -->
		<section class="bg-secondary/30 py-24 px-6">
			<div class="max-w-7xl mx-auto">
				<div class="text-center max-w-2xl mx-auto mb-16">
					<h2 class="text-3xl font-bold mb-4">Everything you need to grow</h2>
					<p class="text-muted-foreground">
						Whether you're a beginner or an expert, GreenEye gives you the tools to keep
						your plants healthy and happy.
					</p>
				</div>

				<div class="grid md:grid-cols-3 gap-8">
					<div
						class="bg-card p-8 rounded-3xl border border-border hover:shadow-lg transition-shadow"
					>
						<div
							class="w-12 h-12 rounded-2xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center mb-6"
						>
							<Camera size={24} />
						</div>
						<h3 class="text-xl font-bold mb-3">Instant ID</h3>
						<p class="text-muted-foreground">
							Identify over 20,000 plant species with a single photo. Know exactly
							what you're growing.
						</p>
					</div>

					<div
						class="bg-card p-8 rounded-3xl border border-border hover:shadow-lg transition-shadow"
					>
						<div
							class="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center mb-6"
						>
							<ShieldCheck size={24} />
						</div>
						<h3 class="text-xl font-bold mb-3">Disease Diagnosis</h3>
						<p class="text-muted-foreground">
							Spot problems before they spread. Get accurate diagnoses and treatment
							plans for common plant diseases.
						</p>
					</div>

					<div
						class="bg-card p-8 rounded-3xl border border-border hover:shadow-lg transition-shadow"
					>
						<div
							class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-6"
						>
							<Sprout size={24} />
						</div>
						<h3 class="text-xl font-bold mb-3">Care Guides</h3>
						<p class="text-muted-foreground">
							Get personalized watering schedules, light requirements, and care tips
							for your specific plants.
						</p>
					</div>
				</div>
			</div>
		</section>
	</main>

	<footer class="py-8 text-center text-sm text-muted-foreground border-t border-border">
		<p>&copy; {new Date().getFullYear()} GreenEye. All rights reserved.</p>
	</footer>
</div>
