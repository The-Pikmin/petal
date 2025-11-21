<script lang="ts">
	import { page } from "$app/stores";
	import BottomNav from "$lib/components/BottomNav.svelte";
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

{#if $page.url.pathname !== "/camera"}
	<BottomNav />
{/if}
