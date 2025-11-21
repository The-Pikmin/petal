<script lang="ts">
	import { goto } from "$app/navigation";
	import { ArrowLeft, Mail, Lock } from "lucide-svelte";
	import { theme } from "$lib/stores/theme.store";
	import logoDark from "$lib/assets/logo-dark.png";
	import logoLight from "$lib/assets/logo-light.png";

	let email = $state("");
	let password = $state("");
	let isLoading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		isLoading = true;

		// Simulate network request
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Mock login success
		isLoading = false;
		goto("/home");
	}
</script>

<svelte:head>
	<title>Login - GreenEye</title>
</svelte:head>

<div class="min-h-screen bg-background flex flex-col items-center justify-center p-6">
	<div class="w-full max-w-md space-y-8">
		<!-- Header -->
		<div class="text-center space-y-2">
			<div
				class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 text-primary mb-4 p-5"
			>
				<img
					src={$theme === "light" ? logoDark : logoLight}
					alt="GreenEye Logo"
					class="w-full h-full object-contain"
				/>
			</div>
			<h1 class="text-3xl font-bold tracking-tight">Welcome back</h1>
			<p class="text-muted-foreground">Enter your credentials to access your garden</p>
		</div>

		<!-- Form -->
		<form
			onsubmit={handleLogin}
			class="space-y-6 bg-card p-8 rounded-3xl border border-border shadow-sm"
		>
			<div class="space-y-2">
				<label
					for="email"
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>Email</label
				>
				<div class="relative">
					<div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
						<Mail size={18} />
					</div>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="name@example.com"
						required
						class="flex h-12 w-full rounded-xl border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label
						for="password"
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>Password</label
					>
					<button type="button" class="text-sm font-medium text-primary hover:underline"
						>Forgot password?</button
					>
				</div>
				<div class="relative">
					<div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
						<Lock size={18} />
					</div>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						class="flex h-12 w-full rounded-xl border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={isLoading}
				class="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full"
			>
				{#if isLoading}
					<span class="animate-spin mr-2">⏳</span> Signing in...
				{:else}
					Sign In
				{/if}
			</button>
		</form>

		<!-- Footer -->
		<div class="text-center text-sm text-muted-foreground">
			Don't have an account?
			<a href="/signup" class="font-medium text-primary hover:underline">Sign up</a>
		</div>

		<div class="text-center">
			<a
				href="/"
				class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft size={16} class="mr-1" /> Back to Home
			</a>
		</div>
	</div>
</div>
