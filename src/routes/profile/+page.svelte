<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { fade, fly } from "svelte/transition";
	import {
		Bell,
		Camera,
		LogOut,
		Mail,
		Moon,
		Shield,
		Sun,
		Upload,
		User,
		X,
	} from "lucide-svelte";

	import HamburgerMenu from "$lib/components/HamburgerMenu.svelte";
	import { requireAuth } from "$lib/guards/auth.guard";
	import {
		deleteUserAvatar,
		updateUserProfile,
		updateUserSettings,
		uploadUserAvatar,
	} from "$lib/services/profile.service";
	import { auth, currentUser } from "$lib/stores/auth.store";
	import { theme } from "$lib/stores/theme.store";
	import { supabase } from "$lib/services/supabase";
	import type { Theme } from "$lib/stores/theme.store";

	type StatusTone = "info" | "success" | "error";

	let profileForm = $state({
		username: "",
		displayName: "",
	});
	let settingsForm = $state({
		notificationsEnabled: true,
		scanReminders: true,
		careReminders: true,
		shareData: false,
		analyticsEnabled: true,
	});
	let passwordForm = $state({
		nextPassword: "",
		confirmPassword: "",
	});

	let statusMessage = $state("");
	let statusTone = $state<StatusTone>("info");
	let isSavingProfile = $state(false);
	let isSavingSettings = $state(false);
	let isUpdatingPassword = $state(false);
	let isUploadingAvatar = $state(false);
	let lastHydratedUserId = "";

	onMount(() => requireAuth());

	$effect(() => {
		const user = $currentUser;
		if (!user || user.id === lastHydratedUserId) return;

		lastHydratedUserId = user.id;
		profileForm = {
			username: user.username,
			displayName: user.display_name,
		};
		settingsForm = {
			notificationsEnabled: user.settings.notifications.enabled,
			scanReminders: user.settings.notifications.scan_reminders,
			careReminders: user.settings.notifications.care_reminders,
			shareData: user.settings.privacy.share_data,
			analyticsEnabled: user.settings.privacy.analytics_enabled,
		};
	});

	$effect(() => {
		if (!statusMessage) return;
		const timeoutId = window.setTimeout(() => {
			statusMessage = "";
		}, 4200);

		return () => window.clearTimeout(timeoutId);
	});

	function setStatus(message: string, tone: StatusTone = "success") {
		statusMessage = message;
		statusTone = tone;
	}

	function formatJoinDate(joinedAt?: string) {
		if (!joinedAt) return "";
		return new Date(joinedAt).toLocaleDateString(undefined, {
			month: "long",
			year: "numeric",
		});
	}

	async function handleSignOut() {
		await auth.logout();
		goto("/login", { replaceState: true });
	}

	async function handleProfileSave() {
		if (!$currentUser) return;
		isSavingProfile = true;
		try {
			const updatedUser = await updateUserProfile({
				username: profileForm.username.trim(),
				display_name: profileForm.displayName.trim(),
			});
			await auth.setProfile(updatedUser);
			setStatus("Profile updated.");
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Failed to update profile.", "error");
		} finally {
			isSavingProfile = false;
		}
	}

	async function handleAvatarChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		isUploadingAvatar = true;
		try {
			const updatedUser = await uploadUserAvatar(file);
			await auth.setProfile(updatedUser);
			setStatus("Profile photo updated.");
		} catch (error) {
			setStatus(
				error instanceof Error ? error.message : "Failed to upload profile photo.",
				"error"
			);
		} finally {
			input.value = "";
			isUploadingAvatar = false;
		}
	}

	async function handleAvatarDelete() {
		if (!$currentUser) return;
		isUploadingAvatar = true;
		try {
			await deleteUserAvatar();
			await auth.setProfile({ ...$currentUser, avatar_url: "" });
			setStatus("Profile photo removed.");
		} catch (error) {
			setStatus(
				error instanceof Error ? error.message : "Failed to remove profile photo.",
				"error"
			);
		} finally {
			isUploadingAvatar = false;
		}
	}

	async function handleThemeChange(nextTheme: Theme) {
		if (!$currentUser) return;
		await theme.setTheme(nextTheme);
		await auth.setProfile({
			...$currentUser,
			settings: {
				...$currentUser.settings,
				theme: nextTheme,
			},
		});
	}

	async function handleSettingsSave() {
		if (!$currentUser) return;
		isSavingSettings = true;
		try {
			const settings = await updateUserSettings({
				notifications: {
					enabled: settingsForm.notificationsEnabled,
					scan_reminders: settingsForm.scanReminders,
					care_reminders: settingsForm.careReminders,
				},
				privacy: {
					share_data: settingsForm.shareData,
					analytics_enabled: settingsForm.analyticsEnabled,
				},
			});
			await auth.setProfile({
				...$currentUser,
				settings,
			});
			setStatus("Settings updated.");
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Failed to update settings.", "error");
		} finally {
			isSavingSettings = false;
		}
	}

	async function handlePasswordUpdate() {
		if (passwordForm.nextPassword.length < 8) {
			setStatus("Password must be at least 8 characters.", "error");
			return;
		}

		if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
			setStatus("Passwords do not match.", "error");
			return;
		}

		isUpdatingPassword = true;
		try {
			const { error } = await supabase.auth.updateUser({
				password: passwordForm.nextPassword,
			});
			if (error) throw error;
			passwordForm = { nextPassword: "", confirmPassword: "" };
			setStatus("Password updated.");
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Failed to update password.", "error");
		} finally {
			isUpdatingPassword = false;
		}
	}
</script>

<svelte:head>
	<title>Profile - GreenEye</title>
</svelte:head>

<div class="min-h-screen bg-secondary/30 pb-20">
	<header
		class="sticky top-0 z-50 bg-background px-6 py-6 pt-[calc(1.5rem+env(safe-area-inset-top))]"
	>
		<div class="container-responsive">
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold text-foreground">Profile</h1>
				<HamburgerMenu />
			</div>
		</div>
	</header>

	<main class="px-6 py-6">
		<div class="container-responsive desktop-sidebar-layout space-y-6 lg:space-y-0">
			<div class="space-y-6 lg:sticky lg:top-28">
				<section
					class="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm"
					in:fade={{ duration: 300 }}
				>
					<div class="flex items-start gap-4">
						<div class="relative">
							<div
								class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground"
							>
								{#if $currentUser?.avatar_url}
									<img
										src={$currentUser.avatar_url}
										alt="Profile avatar"
										class="h-full w-full object-cover"
									/>
								{:else}
									<User size={32} />
								{/if}
							</div>
							<label
								class="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-sm"
							>
								<input
									type="file"
									accept="image/*"
									class="hidden"
									onchange={handleAvatarChange}
									disabled={isUploadingAvatar}
								/>
								<Camera size={18} />
							</label>
						</div>

						<div class="flex-1">
							<h2 class="text-xl font-bold text-foreground">
								{$currentUser?.display_name ?? ""}
							</h2>
							<p class="text-sm text-muted-foreground">{$currentUser?.email ?? ""}</p>
							{#if $currentUser?.joined_at}
								<p class="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
									Member since {formatJoinDate($currentUser.joined_at)}
								</p>
							{/if}
						</div>
					</div>

					<div class="mt-5 flex gap-3">
						<label
							class="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
						>
							<input
								type="file"
								accept="image/*"
								class="hidden"
								onchange={handleAvatarChange}
								disabled={isUploadingAvatar}
							/>
							<Upload size={16} />
							{isUploadingAvatar ? "Uploading..." : "Upload Photo"}
						</label>
						{#if $currentUser?.avatar_url}
							<button
								type="button"
								class="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
								onclick={handleAvatarDelete}
								disabled={isUploadingAvatar}
							>
								<X size={16} />
								Remove
							</button>
						{/if}
					</div>
				</section>

				{#if statusMessage}
					<div
						class={`rounded-3xl border p-4 shadow-sm ${
							statusTone === "success"
								? "border-green-500/20 bg-green-500/10"
								: statusTone === "error"
									? "border-red-500/20 bg-red-500/10"
									: "border-primary/15 bg-primary/5"
						}`}
						in:fly={{ y: 10, duration: 220 }}
						out:fade={{ duration: 180 }}
					>
						<p class="text-sm text-foreground">{statusMessage}</p>
					</div>
				{/if}

				<button
					type="button"
					class="flex w-full items-center justify-center gap-2 rounded-3xl bg-destructive px-6 py-4 font-semibold text-white transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99]"
					onclick={handleSignOut}
				>
					<LogOut size={20} />
					Sign Out
				</button>
			</div>

			<div class="space-y-6">
				<section
					class="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm"
					in:fly|global={{ y: 20, duration: 350, delay: 100 }}
				>
					<h3 class="text-lg font-semibold text-foreground">Edit Profile</h3>
					<div class="mt-5 grid gap-4 md:grid-cols-2">
						<label class="space-y-2">
							<span class="text-sm font-medium text-foreground">Display Name</span>
							<input
								class="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
								bind:value={profileForm.displayName}
								placeholder="How your name appears"
							/>
						</label>
						<label class="space-y-2">
							<span class="text-sm font-medium text-foreground">Username</span>
							<input
								class="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
								bind:value={profileForm.username}
								placeholder="Username"
							/>
						</label>
						<label class="space-y-2 md:col-span-2">
							<span class="text-sm font-medium text-foreground">Email</span>
							<div
								class="flex items-center gap-3 rounded-2xl border border-border bg-muted/60 px-4 py-3 text-muted-foreground"
							>
								<Mail size={18} />
								<span>{$currentUser?.email ?? ""}</span>
							</div>
						</label>
					</div>
					<div class="mt-5">
						<button
							type="button"
							class="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
							onclick={handleProfileSave}
							disabled={isSavingProfile}
						>
							{isSavingProfile ? "Saving..." : "Save Profile"}
						</button>
					</div>
				</section>

				<section
					class="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm"
					in:fly|global={{ y: 20, duration: 350, delay: 180 }}
				>
					<h3 class="text-lg font-semibold text-foreground">Theme Sync</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						Choose a theme once and keep it with your account across devices.
					</p>
					<div class="mt-5 grid gap-3 sm:grid-cols-3">
						{#each [
							{ value: "light", label: "Light", icon: Sun },
							{ value: "dark", label: "Dark", icon: Moon },
							{ value: "auto", label: "Auto", icon: User },
						] as option}
							<button
								type="button"
								class={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
									$currentUser?.settings.theme === option.value
										? "border-primary bg-primary text-primary-foreground"
										: "border-border bg-background text-foreground hover:bg-muted"
								}`}
								onclick={() => handleThemeChange(option.value as Theme)}
							>
								<option.icon size={16} />
								{option.label}
							</button>
						{/each}
					</div>
				</section>

				<section
					class="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm"
					in:fly|global={{ y: 20, duration: 350, delay: 260 }}
				>
					<h3 class="text-lg font-semibold text-foreground">Notifications & Privacy</h3>
					<div class="mt-5 space-y-4">
						<div class="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
							<div class="flex items-center gap-3">
								<Bell size={18} />
								<div>
									<p class="font-medium text-foreground">Notifications Enabled</p>
									<p class="text-sm text-muted-foreground">
										Use this as the master switch for reminder delivery.
									</p>
								</div>
							</div>
							<input type="checkbox" bind:checked={settingsForm.notificationsEnabled} />
						</div>

						<div class="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
							<div>
								<p class="font-medium text-foreground">Scan Reminders</p>
								<p class="text-sm text-muted-foreground">
									Remind me to revisit plants that need another scan.
								</p>
							</div>
							<input type="checkbox" bind:checked={settingsForm.scanReminders} />
						</div>

						<div class="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
							<div>
								<p class="font-medium text-foreground">Care Reminders</p>
								<p class="text-sm text-muted-foreground">
									Store my reminder preference for future care features.
								</p>
							</div>
							<input type="checkbox" bind:checked={settingsForm.careReminders} />
						</div>

						<div class="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
							<div class="flex items-center gap-3">
								<Shield size={18} />
								<div>
									<p class="font-medium text-foreground">Share Anonymous Data</p>
									<p class="text-sm text-muted-foreground">
										Allow aggregated usage data to help improve diagnosis quality.
									</p>
								</div>
							</div>
							<input type="checkbox" bind:checked={settingsForm.shareData} />
						</div>

						<div class="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
							<div>
								<p class="font-medium text-foreground">Analytics</p>
								<p class="text-sm text-muted-foreground">
									Keep lightweight product analytics enabled for this account.
								</p>
							</div>
							<input type="checkbox" bind:checked={settingsForm.analyticsEnabled} />
						</div>
					</div>

					<div class="mt-5">
						<button
							type="button"
							class="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
							onclick={handleSettingsSave}
							disabled={isSavingSettings}
						>
							{isSavingSettings ? "Saving..." : "Save Settings"}
						</button>
					</div>
				</section>

				<section
					class="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm"
					in:fly|global={{ y: 20, duration: 350, delay: 340 }}
				>
					<h3 class="text-lg font-semibold text-foreground">Password</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						Update your account password through your active Supabase session.
					</p>
					<div class="mt-5 grid gap-4 md:grid-cols-2">
						<label class="space-y-2">
							<span class="text-sm font-medium text-foreground">New Password</span>
							<input
								type="password"
								class="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
								bind:value={passwordForm.nextPassword}
								placeholder="At least 8 characters"
							/>
						</label>
						<label class="space-y-2">
							<span class="text-sm font-medium text-foreground">Confirm Password</span>
							<input
								type="password"
								class="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
								bind:value={passwordForm.confirmPassword}
								placeholder="Repeat password"
							/>
						</label>
					</div>
					<div class="mt-5">
						<button
							type="button"
							class="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
							onclick={handlePasswordUpdate}
							disabled={isUpdatingPassword}
						>
							{isUpdatingPassword ? "Updating..." : "Update Password"}
						</button>
					</div>
				</section>
			</div>
		</div>
	</main>
</div>
