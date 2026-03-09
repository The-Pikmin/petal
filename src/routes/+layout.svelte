<script lang="ts">
	import { page } from "$app/stores";
	import { browser } from "$app/environment";
	import { Capacitor } from "@capacitor/core";
	import { App } from "@capacitor/app";
	import BottomNav from "$lib/components/BottomNav.svelte";
	import SplashScreen from "$lib/components/SplashScreen.svelte";
	import logoDark from "$lib/assets/logo-dark.png";
	import { isSplashVisible } from "$lib/stores/splash.store";
	import { onMount } from "svelte";
	import { auth } from "$lib/stores/auth.store";
	import { supabase } from "$lib/services/supabase";
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

		// Listen for OAuth deep link redirects on native
		App.addListener("appUrlOpen", async ({ url }) => {
			const hashIndex = url.indexOf("#");
			if (hashIndex >= 0) {
				const params = new URLSearchParams(url.substring(hashIndex + 1));
				const accessToken = params.get("access_token");
				const refreshToken = params.get("refresh_token");
				if (accessToken && refreshToken) {
					await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					});
				}
			}
		});
	}

	onMount(async () => {
		await auth.initialize();
	});

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
