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

			<!-- Login button -->
			<button
				type="submit"
				disabled={isLoading}
				class="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? "Signing in..." : "Sign in"}
			</button>
		</form>

		<!-- Divider -->
		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-border"></div>
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-background px-2 text-muted-foreground">Or continue with</span>
			</div>
		</div>

		<!-- Google Sign-in -->
		<button
			type="button"
			class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
		>
			<svg class="w-5 h-5" viewBox="0 0 24 24">
				<path
					fill="#4285F4"
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				/>
				<path
					fill="#34A853"
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				/>
				<path
					fill="#FBBC05"
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
				/>
				<path
					fill="#EA4335"
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				/>
			</svg>
			<span class="font-medium text-foreground">Continue with Google</span>
		</button>

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
