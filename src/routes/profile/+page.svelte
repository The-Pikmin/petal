<script lang="ts">
	import { theme } from "$lib/stores/theme.store";
	import { mockUserProfile } from "$lib/services/mock-data";
	import type { UserProfile } from "$lib/types";
	import {
		User,
		Mail,
		Calendar,
		Bell,
		Globe,
		Shield,
		HelpCircle,
		Info,
		LogOut,
		ChevronRight,
		Sun,
		Moon,
		Edit,
	} from "lucide-svelte";

	import HamburgerMenu from "$lib/components/HamburgerMenu.svelte";

	let userProfile = $state<UserProfile>(mockUserProfile);

	function formatJoinDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString("en-US", {
			month: "long",
			year: "numeric",
		});
	}

	const settingsSections = [
		{
			title: "Account",
			items: [
				{ icon: User, label: "Edit Profile", action: () => {} },
				{ icon: Mail, label: "Email & Password", action: () => {} },
			],
		},
		{
			title: "Preferences",
			items: [
				{
					icon: Bell,
					label: "Notifications",
					subtitle: userProfile.settings.notifications.enabled ? "Enabled" : "Disabled",
					action: () => {},
				},
				{
					icon: Globe,
					label: "Language",
					subtitle: "English",
					action: () => {},
				},
			],
		},
		{
			title: "Privacy & Security",
			items: [
				{ icon: Shield, label: "Data & Privacy", action: () => {} },
				{ icon: Shield, label: "Terms of Service", action: () => {} },
			],
		},
		{
			title: "Support",
			items: [
				{ icon: HelpCircle, label: "Help & FAQs", action: () => {} },
				{ icon: Info, label: "About GreenEye", action: () => {} },
			],
		},
	];
</script>

<svelte:head>
	<title>Profile - GreenEye</title>
</svelte:head>

<div class="min-h-screen pb-20 bg-secondary/30">
	<!-- Header -->
	<header
		class="px-6 py-6 bg-background fixed top-0 left-0 right-0 z-50 pt-[calc(1.5rem+env(safe-area-inset-top))]"
	>
		<div class="container-responsive">
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold text-foreground">Profile</h1>
				<HamburgerMenu />
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="px-6 py-6 space-y-6 pt-24">
		<div class="container-responsive desktop-sidebar-layout space-y-6 lg:space-y-0">
			<!-- Left Column (Desktop) -->
			<div class="space-y-6 lg:col-start-1 lg:row-start-1 lg:h-fit lg:sticky lg:top-28">
				<!-- Profile Card -->
				<div
					class="rounded-3xl p-6 bg-card text-card-foreground shadow-sm border border-border"
				>
					<div class="flex items-center gap-4 mb-4">
						<!-- Avatar -->
						<div
							class="w-20 h-20 rounded-full flex items-center justify-center bg-primary text-primary-foreground"
						>
							<User size={32} />
						</div>

						<!-- User Info -->
						<div class="flex-1">
							<h2 class="text-xl font-bold text-foreground mb-1">
								{userProfile.name}
							</h2>
							<p class="text-sm text-muted-foreground mb-1">
								{userProfile.email}
							</p>
							<p class="text-xs text-muted-foreground flex items-center gap-1">
								<Calendar size={12} />
								Joined {formatJoinDate(userProfile.joinedDate)}
							</p>
						</div>

						<!-- Edit Button -->
						<button
							class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
							aria-label="Edit profile"
						>
							<Edit size={18} />
						</button>
					</div>
				</div>

				<!-- Theme Toggle Card -->
				<div
					class="rounded-3xl p-4 bg-card text-card-foreground shadow-sm border border-border"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="w-10 h-10 rounded-full flex items-center justify-center bg-muted"
							>
								{#if $theme === "light"}
									<Sun size={20} />
								{:else}
									<Moon size={20} />
								{/if}
							</div>
							<div>
								<p class="font-medium text-foreground">Theme</p>
								<p class="text-sm text-muted-foreground">
									{$theme === "light" ? "Light" : "Dark"} mode
								</p>
							</div>
						</div>
						<button
							onclick={() => theme.toggle()}
							class="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
						>
							Switch
						</button>
					</div>
				</div>
			</div>

			<!-- Right Column (Desktop) -->
			<div class="space-y-6 lg:col-start-2 lg:row-start-1">
				<!-- Settings Sections -->
				{#each settingsSections as section}
					<div class="space-y-2">
						<h3 class="text-sm font-semibold text-muted-foreground px-2">
							{section.title}
						</h3>
						<div
							class="rounded-3xl overflow-hidden bg-card text-card-foreground shadow-sm border border-border"
						>
							{#each section.items as item, index}
								<button
									onclick={item.action}
									class="w-full px-4 py-4 flex items-center gap-3 transition-colors hover:bg-muted"
									class:border-t={index > 0}
									class:border-border={index > 0}
								>
									<div
										class="w-10 h-10 rounded-full flex items-center justify-center bg-muted flex-shrink-0"
									>
										<item.icon size={20} />
									</div>
									<div class="flex-1 text-left">
										<p class="font-medium text-foreground">
											{item.label}
										</p>
										{#if "subtitle" in item}
											<p class="text-sm text-muted-foreground">
												{item.subtitle}
											</p>
										{/if}
									</div>
									<ChevronRight size={20} class="text-muted-foreground" />
								</button>
							{/each}
						</div>
					</div>
				{/each}

				<!-- Sign Out Button -->
				<div class="pt-4">
					<button
						class="w-full px-6 py-4 rounded-3xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-destructive text-white flex items-center justify-center gap-2"
					>
						<LogOut size={20} />
						Sign Out
					</button>
				</div>

				<!-- App Version -->
				<div class="text-center pb-4">
					<p class="text-xs text-muted-foreground">GreenEye v1.0.0</p>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	/* Smooth transitions */
	button {
		transition:
			transform 0.2s ease,
			background-color 0.3s ease;
	}
</style>
