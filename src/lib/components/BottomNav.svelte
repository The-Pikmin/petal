<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { scale } from "svelte/transition";
	import { Home, BookOpen, Camera, History, User } from "lucide-svelte";

	let currentPath = $derived($page.url.pathname);

	const navItems = [
		{ icon: Home, label: "Home", path: "/" },
		{ icon: BookOpen, label: "Library", path: "/library" },
		{ icon: Camera, label: "Scan", path: "/camera", isCenter: true },
		{ icon: History, label: "History", path: "/history" },
		{ icon: User, label: "Profile", path: "/profile" },
	];

	function navigate(path: string) {
		goto(path);
	}
</script>

<!-- Floating Pill Navigation (Hidden on Desktop) -->
<div class="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-6 px-4 lg:hidden">
	<nav class="max-w-md mx-auto pointer-events-auto">
		<div
			class="bg-background/80 backdrop-blur-xl border border-border rounded-full shadow-2xl px-2 py-2"
		>
			<div class="flex items-center justify-around relative">
				{#each navItems as item}
					{#if item.isCenter}
						<!-- Center Camera Button (Elevated) -->
						<button
							onclick={() => navigate(item.path)}
							class="w-14 h-14 -my-2 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-primary text-primary-foreground"
							aria-label={item.label}
						>
							<item.icon size={28} />
						</button>
					{:else}
						<!-- Regular Nav Item -->
						<button
							onclick={() => navigate(item.path)}
							class="relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-all duration-300 hover:bg-muted/50"
							class:text-primary={currentPath === item.path}
							class:text-muted-foreground={currentPath !== item.path}
							aria-label={item.label}
						>
							<!-- Active indicator dot -->
							{#if currentPath === item.path}
								<div
									class="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
									in:scale={{ duration: 200 }}
									style="view-transition-name: active-dot"
								></div>
							{/if}

							<div
								class="transition-transform duration-200"
								class:scale-110={currentPath === item.path}
							>
								<item.icon size={22} />
							</div>
							<span
								class="text-[10px] font-medium transition-all duration-200"
								class:font-semibold={currentPath === item.path}
							>
								{item.label}
							</span>
						</button>
					{/if}
				{/each}
			</div>
		</div>
	</nav>
</div>

<style>
	button {
		transition:
			transform 0.2s ease,
			background-color 0.3s ease;
	}
</style>
