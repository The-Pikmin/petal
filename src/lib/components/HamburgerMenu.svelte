<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { slide, fade } from "svelte/transition";
	import { Home, BookOpen, Camera, History, User, Menu, X } from "lucide-svelte";

	let isOpen = $state(false);
	let currentPath = $derived($page.url.pathname);

	const navItems = [
		{ icon: Home, label: "Home", path: "/home" },
		{ icon: BookOpen, label: "Library", path: "/library" },
		{ icon: Camera, label: "Scan", path: "/camera" },
		{ icon: History, label: "History", path: "/history" },
		{ icon: User, label: "Profile", path: "/profile" },
	];

	function navigate(path: string) {
		goto(path);
		isOpen = false;
	}

	function toggleMenu() {
		isOpen = !isOpen;
	}
</script>

<!-- Desktop Hamburger Menu (hidden on mobile) -->
<div class="hidden lg:block relative">
	<!-- Hamburger Button -->
	<button
		onclick={toggleMenu}
		class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
		aria-label="Menu"
	>
		{#if isOpen}
			<X size={20} />
		{:else}
			<Menu size={20} />
		{/if}
	</button>

	<!-- Menu Dropdown -->
	{#if isOpen}
		<div
			class="absolute top-full right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-lg overflow-hidden z-50"
			transition:slide={{ duration: 200 }}
		>
			{#each navItems as item}
				<button
					onclick={() => navigate(item.path)}
					class="w-full px-4 py-3 flex items-center gap-3 transition-colors hover:bg-muted {currentPath ===
					item.path
						? 'bg-primary/10 text-primary font-semibold'
						: ''}"
				>
					<item.icon size={20} />
					<span>{item.label}</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Backdrop -->
	{#if isOpen}
		<button
			onclick={() => (isOpen = false)}
			class="fixed inset-0 bg-black/20 z-40"
			transition:fade={{ duration: 200 }}
			aria-label="Close menu"
		></button>
	{/if}
</div>

<style>
	button {
		transition:
			transform 0.2s ease,
			background-color 0.3s ease;
	}
</style>
