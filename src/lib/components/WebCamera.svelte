<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import type { CapturedPhoto } from "$lib/types";

	interface Props {
		onCapture: (photo: CapturedPhoto) => void;
		onCancel: () => void;
	}

	let { onCapture, onCancel }: Props = $props();

	let videoElement = $state<HTMLVideoElement | null>(null);
	let stream = $state<MediaStream | null>(null);
	let error = $state<string | null>(null);
	let isCapturing = $state(false);

	onMount(async () => {
		try {
			// Request camera access with preference for rear camera
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "environment", // Prefer rear camera on mobile
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
				audio: false,
			});

			if (videoElement) {
				videoElement.srcObject = stream;
			}
		} catch (err) {
			if (err instanceof Error) {
				if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
					error = "Camera permission denied. Please allow camera access to continue.";
				} else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
					error = "No camera found on this device.";
				} else {
					error = "Failed to access camera: " + err.message;
				}
			} else {
				error = "An unexpected error occurred while accessing the camera.";
			}
		}
	});

	onDestroy(() => {
		// Clean up camera stream
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}
	});

	async function capturePhoto() {
		if (!videoElement || isCapturing) return;

		try {
			isCapturing = true;

			// Create canvas to capture the video frame
			const canvas = document.createElement("canvas");
			canvas.width = videoElement.videoWidth;
			canvas.height = videoElement.videoHeight;

			const context = canvas.getContext("2d");
			if (!context) {
				throw new Error("Failed to get canvas context");
			}

			// Draw current video frame to canvas
			context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

			// Convert to base64
			const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
			const base64 = dataUrl.split(",")[1];

			// Stop the camera stream
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}

			// Call the onCapture callback with photo data
			onCapture({
				base64,
				format: "jpeg",
				timestamp: Date.now(),
			});
		} catch (err) {
			if (err instanceof Error) {
				error = "Failed to capture photo: " + err.message;
			} else {
				error = "Failed to capture photo";
			}
			isCapturing = false;
		}
	}

	function handleCancel() {
		// Stop camera stream
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}
		onCancel();
	}
</script>

<div class="fixed inset-0 bg-black z-50 flex flex-col">
	{#if error}
		<!-- Error State -->
		<div class="flex-1 flex items-center justify-center p-6">
			<div
				class="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20"
			>
				<div class="text-center space-y-4">
					<div class="text-6xl">⚠️</div>
					<h2 class="text-2xl font-bold text-white">Camera Error</h2>
					<p class="text-emerald-200/90">{error}</p>
					<button
						onclick={handleCancel}
						class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300"
					>
						Go Back
					</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- Camera View -->
		<div class="relative flex-1 overflow-hidden">
			<!-- Video Element -->
			<video
				bind:this={videoElement}
				autoplay
				playsinline
				class="absolute inset-0 w-full h-full object-cover"
			>
				<track kind="captions" src="" label="English" />
			</video>

			<!-- Overlay Guide -->
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
				<div
					class="border-2 border-white/50 rounded-2xl w-4/5 aspect-square max-w-md"
				></div>
			</div>
		</div>

		<!-- Controls -->
		<div class="bg-gradient-to-t from-black/80 to-transparent p-6 space-y-4">
			<!-- Instructions -->
			<p class="text-center text-white text-sm mb-2">
				Position the affected plant part within the frame
			</p>

			<!-- Capture Button -->
			<div class="flex items-center justify-center gap-4">
				<button
					onclick={handleCancel}
					class="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-full transition-all duration-300"
				>
					Cancel
				</button>

				<button
					onclick={capturePhoto}
					disabled={isCapturing}
					aria-label="Capture photo"
					class="w-20 h-20 rounded-full bg-white hover:bg-gray-200 disabled:bg-gray-400 border-4 border-white/50 shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
				>
					<div
						class="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500"
					></div>
				</button>

				<button
					onclick={handleCancel}
					aria-label="Hidden cancel button for spacing"
					class="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-full transition-all duration-300 opacity-0 pointer-events-none"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	video {
		/* Ensure video fills container */
		object-fit: cover;
	}
</style>
