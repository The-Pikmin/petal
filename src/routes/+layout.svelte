<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";
	import { Capacitor } from "@capacitor/core";
	import { App } from "@capacitor/app";
	import type { PluginListenerHandle } from "@capacitor/core";
	import { Browser } from "@capacitor/browser";
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
	let appUrlOpenListener: PluginListenerHandle | null = null;

	// Only show splash on first load in Capacitor mobile app
	if (browser && Capacitor.isNativePlatform()) {
		const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
		if (!hasSeenSplash) {
			showSplash = true;
			isSplashVisible.set(true);
		}
	}

	onMount(() => {
		const setup = async () => {
			if (browser && Capacitor.isNativePlatform() && !appUrlOpenListener) {
				appUrlOpenListener = await App.addListener("appUrlOpen", async ({ url }) => {
					if (!url.startsWith("com.greeneye.app://login-callback")) {
						return;
					}

					try {
						await Browser.close();
					} catch {
						// Browser may already be closed
					}

					let sessionSet = false;

					try {
						const parsedUrl = new URL(url);

						// Implicit flow: tokens in # hash fragment
						if (parsedUrl.hash) {
							const params = new URLSearchParams(parsedUrl.hash.slice(1));
							const accessToken = params.get("access_token");
							const refreshToken = params.get("refresh_token");
							if (accessToken && refreshToken) {
								await supabase.auth.setSession({
									access_token: accessToken,
									refresh_token: refreshToken,
								});
								sessionSet = true;
							}
						}

						// PKCE flow: ?code= query parameter
						if (!sessionSet) {
							const code = parsedUrl.searchParams.get("code");
							if (code) {
								await supabase.auth.exchangeCodeForSession(code);
								sessionSet = true;
							}
						}

						if (!sessionSet) {
							console.error(
								"Native auth callback did not contain a Supabase session."
							);
							return;
						}

						await auth.refresh();
						await goto("/onboarding", { replaceState: true });
					} catch (error) {
						console.error("Failed to handle native auth callback:", error);
					}
				});
			}

			await auth.initialize();
		};

		void setup();

		return () => {
			appUrlOpenListener?.remove();
			appUrlOpenListener = null;
		};
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
