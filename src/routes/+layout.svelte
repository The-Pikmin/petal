<script lang="ts">
	import { page } from "$app/stores";
	import { browser } from "$app/environment";
	import { Capacitor } from "@capacitor/core";
	import BottomNav from "$lib/components/BottomNav.svelte";
	import SplashScreen from "$lib/components/SplashScreen.svelte";
	import logoDark from "$lib/assets/logo-dark.png";
	import { isSplashVisible } from "$lib/stores/splash.store";
	import "../app.css";

	let { children } = $props();
	let showSplash = $state(false);

	// Only show splash on first load in Capacitor mobile app
	if (browser && Capacitor.isNativePlatform()) {
		const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
		if (!hasSeenSplash) {
			showSplash = true;
			isSplashVisible.set(true);
		}
	}

	function handleSplashComplete() {
		if (browser) {
			sessionStorage.setItem("hasSeenSplash", "true");
		}
		showSplash = false;
		setTimeout(() => {
			isSplashVisible.set(false);
		}, 500); // Wait for fade out
	}
</script>

<svelte:head>
	<link rel="icon" href={logoDark} />
</svelte:head>

{#if showSplash}
	<SplashScreen onComplete={handleSplashComplete} />
{/if}

{@render children()}

{#if $page.url.pathname !== "/" && $page.url.pathname !== "/login" && $page.url.pathname !== "/signup" && $page.url.pathname !== "/camera" && $page.url.pathname !== "/scan" && $page.url.pathname !== "/onboarding"}
	<BottomNav />
{/if}
