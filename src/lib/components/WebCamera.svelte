<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Image as ImageIcon, Zap, ZapOff, ZoomIn, ZoomOut, X } from "lucide-svelte";
	import type { CapturedPhoto } from "$lib/types";

	interface Props {
		onCapture: (photo: CapturedPhoto) => void;
		onCancel: () => void;
	}

	let { onCapture, onCancel }: Props = $props();

	let videoElement = $state<HTMLVideoElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	let stream = $state<MediaStream | null>(null);
	let error = $state<string | null>(null);
	let isCapturing = $state(false);

	// Camera Capabilities
	let zoom = $state(1);
	let minZoom = $state(1);
	let maxZoom = $state(1);
	let hasZoom = $state(false);
	let hasFlash = $state(false);
	let isFlashOn = $state(false);
	let videoTrack = $state<MediaStreamTrack | null>(null);

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

			// Get video track capabilities
			const track = stream.getVideoTracks()[0];
			if (track) {
				videoTrack = track;
				const capabilities = track.getCapabilities();
				const settings = track.getSettings();

				// Check for Zoom support
				if ("zoom" in capabilities) {
					hasZoom = true;
					// @ts-expect-error - zoom is standard but TS might miss it in some configs
					minZoom = capabilities.zoom?.min || 1;
					// @ts-expect-error - zoom property not in TS types
					maxZoom = capabilities.zoom?.max || 1;
					zoom = settings.zoom || 1;
				}

				// Check for Torch (Flash) support
				if ("torch" in capabilities) {
					hasFlash = true;
				}
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
			stream.getTracks().forEach((track) => {
				track.stop();
			});
		}
	});

	async function setZoom(value: number) {
		if (!videoTrack || !hasZoom) return;
		try {
			await videoTrack.applyConstraints({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				advanced: [{ zoom: value } as any],
			});
			zoom = value;
		} catch (e) {
			console.error("Failed to set zoom", e);
		}
	}

	async function toggleFlash() {
		if (!videoTrack || !hasFlash) return;
		try {
			const newFlashState = !isFlashOn;
			await videoTrack.applyConstraints({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				advanced: [{ torch: newFlashState } as any],
			});
			isFlashOn = newFlashState;
		} catch (e) {
			console.error("Failed to toggle flash", e);
		}
	}

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

			// Turn off flash before stopping stream if it was on
			if (isFlashOn && videoTrack) {
				try {
					await videoTrack.applyConstraints({
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						advanced: [{ torch: false } as any],
					});
				} catch {
					// Ignore error on cleanup
				}
			}

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

	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			const reader = new FileReader();

			reader.onload = (e) => {
				const result = e.target?.result as string;
				const base64 = result.split(",")[1];
				const format = file.type.split("/")[1];

				// Stop the camera stream
				if (stream) {
					stream.getTracks().forEach((track) => track.stop());
				}

				onCapture({
					base64,
					format: format || "jpeg",
					timestamp: Date.now(),
				});
			};

			reader.readAsDataURL(file);
		}
	}

	// Pinch to Zoom state
	let initialPinchDistance = $state<number | null>(null);
	let initialZoom = $state(1);

	function getTouchDistance(touch1: Touch, touch2: Touch) {
		const dx = touch1.clientX - touch2.clientX;
		const dy = touch1.clientY - touch2.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function handleTouchStart(event: TouchEvent) {
		if (event.touches.length === 2) {
			initialPinchDistance = getTouchDistance(event.touches[0], event.touches[1]);
			initialZoom = zoom;
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (event.touches.length === 2 && initialPinchDistance !== null && hasZoom) {
			const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
			const scale = currentDistance / initialPinchDistance;

			let newZoom = initialZoom * scale;

			// Clamp value
			newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

			setZoom(newZoom);
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		if (event.touches.length < 2) {
			initialPinchDistance = null;
		}
	}

	function handleCancel() {
		// Turn off flash before stopping stream if it was on
		if (isFlashOn && videoTrack) {
			videoTrack
				.applyConstraints({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					advanced: [{ torch: false } as any],
				})
				.catch(() => {});
		}

		// Stop camera stream
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}
		onCancel();
	}
</script>

<div
	class="fixed inset-0 bg-black z-50 flex flex-col"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
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

			<!-- Cancel Button (Top Right) -->
			<div
				class="absolute z-10"
				style="top: max(1.5rem, env(safe-area-inset-top) + 1rem); right: max(1.5rem, env(safe-area-inset-right) + 1rem);"
			>
				<button
					onclick={handleCancel}
					class="p-3 rounded-full backdrop-blur-md transition-all duration-300 bg-black/20 text-white border border-white/20 hover:bg-white/30"
					aria-label="Cancel"
				>
					<X size={24} />
				</button>
			</div>

			<!-- Overlay Guide -->
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
				<div
					class="border-2 border-white/50 rounded-2xl w-4/5 aspect-square max-w-md"
				></div>
			</div>
		</div>

		<!-- Controls -->
		<div
			class="bg-gradient-to-t from-black/80 to-transparent p-6 space-y-4"
			style="padding-bottom: max(1.5rem, env(safe-area-inset-bottom) + 1.5rem);"
		>
			<!-- Zoom Control -->
			{#if hasZoom}
				<div class="flex items-center gap-3 px-4 py-2 mb-2">
					<ZoomOut size={20} class="text-white/70" />
					<input
						type="range"
						min={minZoom}
						max={maxZoom}
						step="0.1"
						value={zoom}
						oninput={(e) => setZoom(parseFloat(e.currentTarget.value))}
						class="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
					/>
					<ZoomIn size={20} class="text-white/70" />
				</div>
			{/if}

			<!-- Instructions -->
			<p class="text-center text-white text-sm mb-2">
				Position the affected plant part within the frame
			</p>

			<!-- Capture Button -->
			<div class="flex items-center justify-center gap-8">
				<!-- Flash/Torch Button (Bottom Left) -->
				{#if hasFlash}
					<button
						onclick={toggleFlash}
						class="px-5 py-4 rounded-full backdrop-blur-md transition-all duration-300 {isFlashOn
							? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
							: 'bg-white/20 text-white border border-white/20 hover:bg-white/30'}"
						aria-label="Toggle flash"
					>
						{#if isFlashOn}
							<Zap size={28} fill="currentColor" />
						{:else}
							<ZapOff size={28} />
						{/if}
					</button>
				{:else}
					<!-- Spacer to maintain layout when flash not available -->
					<div class="w-[76px]"></div>
				{/if}

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

				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					class="hidden"
					onchange={handleFileUpload}
				/>

				<button
					onclick={() => fileInput?.click()}
					class="px-5 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white rounded-full transition-all duration-300 flex items-center gap-2"
					aria-label="Upload image"
				>
					<ImageIcon size={28} />
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
