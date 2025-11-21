<script lang="ts">
	import { onMount } from "svelte";
	import { fade, scale } from "svelte/transition";
	import { theme } from "$lib/stores/theme.store";
	import logoDark from "$lib/assets/logo-dark.png";
	import logoLight from "$lib/assets/logo-light.png";

	let { onComplete } = $props<{ onComplete: () => void }>();

	onMount(() => {
		// Auto-hide after 2 seconds
		const timeout = setTimeout(() => {
			onComplete();
		}, 2000);

		return () => clearTimeout(timeout);
	});
</script>

<div
	class="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center"
	transition:fade={{ duration: 500 }}
>
	<div class="flex flex-col items-center gap-6" transition:scale={{ duration: 600, start: 0.8 }}>
		<img
			src={$theme === "light" ? logoDark : logoLight}
			alt="GreenEye Logo"
			class="w-32 h-32 object-contain"
		/>
		<div class="flex flex-col items-center gap-2">
			<h1 class="text-4xl font-bold text-primary">GreenEye</h1>
			<p class="text-muted-foreground">Your Personal Plant Doctor</p>
		</div>
	</div>

	<!-- Loading indicator -->
	<div class="absolute bottom-20">
		<div class="flex gap-2">
			<div
				class="w-2 h-2 rounded-full bg-primary animate-pulse"
				style="animation-delay: 0ms"
			></div>
			<div
				class="w-2 h-2 rounded-full bg-primary animate-pulse"
				style="animation-delay: 150ms"
			></div>
			<div
				class="w-2 h-2 rounded-full bg-primary animate-pulse"
				style="animation-delay: 300ms"
			></div>
		</div>
	</div>
</div>
