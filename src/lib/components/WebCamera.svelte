<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import {
		AlertCircle,
		CheckCircle2,
		Image as ImageIcon,
		Leaf,
		LoaderCircle,
		Search,
		X,
		Zap,
		ZapOff,
		ZoomIn,
		ZoomOut,
	} from "lucide-svelte";
	import {
		CAMERA_DETECTION_COPY,
		PLANT_DETECTION_CONFIG,
		type CameraDetectionState,
		type PlantDetectionResult,
	} from "$lib/config/plant-detection";
	import { loadPlantDetector, type PlantDetector } from "$lib/services/plant-detector";
	import type { CapturedPhoto } from "$lib/types";

	interface Props {
		onCapture: (photo: CapturedPhoto) => void;
		onCancel: () => void;
	}

	type CaptureMode = "manual" | "auto";

	let { onCapture, onCancel }: Props = $props();

	let videoElement = $state<HTMLVideoElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	let stream = $state<MediaStream | null>(null);
	let error = $state<string | null>(null);
	let isCapturing = $state(false);
	let isGalleryValidating = $state(false);
	let detectionState = $state<CameraDetectionState>("loading_model");
	let latestDetection = $state<PlantDetectionResult | null>(null);
	let latestStabilityScore = $state<number | null>(null);
	let autoCaptureProgress = $state(0);
	let detector = $state<PlantDetector | null>(null);
	let detectorError = $state<string | null>(null);

	let zoom = $state(1);
	let minZoom = $state(1);
	let maxZoom = $state(1);
	let hasZoom = $state(false);
	let hasFlash = $state(false);
	let isFlashOn = $state(false);
	let videoTrack = $state<MediaStreamTrack | null>(null);

	let detectionTimer: number | null = null;
	let progressAnimationFrame: number | null = null;
	let lowConfidenceStartAt = 0;
	let holdStartAt: number | null = null;
	let isMounted = true;
	let detectionCanvas: HTMLCanvasElement | null = null;
	let motionCanvas: HTMLCanvasElement | null = null;
	let previousMotionPixels: Uint8ClampedArray | null = null;

	const detectionIntervalMs = Math.round(1000 / PLANT_DETECTION_CONFIG.detectionFps);
	const overlayCopy = $derived(CAMERA_DETECTION_COPY[detectionState]);
	const detectorStatusNote = $derived(
		detectorError
			? "Auto-scan is unavailable on this device. Manual capture still works."
			: null
	);
	const progressPathLength = $derived(Math.max(0, Math.min(100, autoCaptureProgress * 100)));
	const debugMetrics = $derived(
		PLANT_DETECTION_CONFIG.debugEnabled
			? {
					score: latestDetection?.score,
					stability: latestStabilityScore,
					progress: autoCaptureProgress,
				}
			: null
	);

	onMount(async () => {
		await initializeCamera();
		if (!error) {
			void initializeDetector();
		}
	});

	onDestroy(() => {
		isMounted = false;
		stopDetectionLoop();
		stopProgressLoop();
		detector?.dispose();
		void shutdownCamera();
	});

	async function initializeCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "environment",
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
				audio: false,
			});

			if (videoElement) {
				videoElement.srcObject = stream;
				await videoElement.play().catch(() => {});
			}

			const track = stream.getVideoTracks()[0];
			if (track) {
				videoTrack = track;
				const capabilities = track.getCapabilities();
				const settings = track.getSettings();

				if ("zoom" in capabilities) {
					hasZoom = true;
					// @ts-expect-error - zoom is standard but TS might miss it in some configs
					minZoom = capabilities.zoom?.min || 1;
					// @ts-expect-error - zoom property not in TS types
					maxZoom = capabilities.zoom?.max || 1;
					zoom = settings.zoom || 1;
				}

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
	}

	async function initializeDetector() {
		try {
			detectionState = "loading_model";
			detector = await loadPlantDetector();
			if (!isMounted) return;
			detectorError = null;
			syncOverlayState(performance.now());
			scheduleDetectionLoop();
		} catch {
			if (!isMounted) return;
			detectorError = "Auto-scan unavailable";
			detectionState = "searching";
		}
	}

	function scheduleDetectionLoop() {
		stopDetectionLoop();
		if (!shouldRunDetection()) return;

		detectionTimer = window.setTimeout(() => {
			void runDetectionTick();
		}, detectionIntervalMs);
	}

	function stopDetectionLoop() {
		if (detectionTimer !== null) {
			window.clearTimeout(detectionTimer);
			detectionTimer = null;
		}
	}

	function startProgressLoop() {
		if (progressAnimationFrame !== null) {
			return;
		}

		progressAnimationFrame = window.requestAnimationFrame(updateProgressAnimation);
	}

	function stopProgressLoop() {
		if (progressAnimationFrame !== null) {
			window.cancelAnimationFrame(progressAnimationFrame);
			progressAnimationFrame = null;
		}
	}

	function updateProgressAnimation(now: number) {
		progressAnimationFrame = null;

		if (!holdStartAt || !isMounted || isCapturing || detectionState !== "locked") {
			return;
		}

		const elapsed = now - holdStartAt;
		autoCaptureProgress = Math.min(elapsed / PLANT_DETECTION_CONFIG.dwellDurationMs, 1);

		if (autoCaptureProgress < 1) {
			progressAnimationFrame = window.requestAnimationFrame(updateProgressAnimation);
		}
	}

	function shouldRunDetection(): boolean {
		return Boolean(
			isMounted &&
				detector &&
				videoElement &&
				stream &&
				!error &&
				!isCapturing &&
				!isGalleryValidating
		);
	}

	async function runDetectionTick() {
		if (!shouldRunDetection() || !videoElement || !detector) return;
		if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
			scheduleDetectionLoop();
			return;
		}

		try {
			const sampleCanvas = getDetectionCanvas();
			const sampleContext = sampleCanvas.getContext("2d");
			const motionSampleCanvas = getMotionCanvas();
			const motionContext = motionSampleCanvas.getContext("2d");
			if (!sampleContext || !motionContext) {
				scheduleDetectionLoop();
				return;
			}

			const { size, sx, sy } = getGuideCrop(
				videoElement.videoWidth,
				videoElement.videoHeight
			);

			drawCroppedVideoFrame(videoElement, sampleCanvas, sampleContext, sx, sy, size);
			drawCroppedVideoFrame(videoElement, motionSampleCanvas, motionContext, sx, sy, size);

			const [result, stabilityScore] = await Promise.all([
				detector.classify(sampleCanvas),
				Promise.resolve(measureMotionScore(motionContext, motionSampleCanvas)),
			]);
			if (!isMounted) return;

			latestDetection = result;
			latestStabilityScore = stabilityScore;

			const shouldAutoCapture = syncOverlayState(performance.now(), result, stabilityScore);
			if (shouldAutoCapture) {
				await capturePhoto("auto");
				return;
			}
		} catch {
			if (!isMounted) return;
			detectorError = "Auto-scan unavailable";
			resetAutoCaptureLock();
			detectionState = "searching";
		} finally {
			if (shouldRunDetection()) {
				scheduleDetectionLoop();
			}
		}
	}

	function drawCroppedVideoFrame(
		video: HTMLVideoElement,
		canvas: HTMLCanvasElement,
		context: CanvasRenderingContext2D,
		sx: number,
		sy: number,
		size: number
	) {
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.imageSmoothingEnabled = true;
		context.imageSmoothingQuality = "high";
		context.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
	}

	function syncOverlayState(
		now: number,
		detection: PlantDetectionResult | null = latestDetection,
		stabilityScore: number | null = latestStabilityScore
	): boolean {
		if (isCapturing) {
			detectionState =
				detectionState === "auto_capturing"
					? "auto_capturing"
					: "manual_capture_in_progress";
			return false;
		}

		if (!detector) {
			resetAutoCaptureLock();
			detectionState = detectorError ? "searching" : "loading_model";
			return false;
		}

		if (detection?.isPlantLike) {
			lowConfidenceStartAt = 0;

			if (
				stabilityScore !== null &&
				stabilityScore <= PLANT_DETECTION_CONFIG.stabilityThreshold
			) {
				if (holdStartAt === null) {
					holdStartAt = now;
					startProgressLoop();
				}

				const elapsed = now - holdStartAt;
				autoCaptureProgress = Math.min(elapsed / PLANT_DETECTION_CONFIG.dwellDurationMs, 1);

				if (elapsed >= PLANT_DETECTION_CONFIG.dwellDurationMs) {
					detectionState = "auto_capturing";
					autoCaptureProgress = 1;
					stopProgressLoop();
					return true;
				}

				detectionState = "locked";
				startProgressLoop();
				return false;
			}

			resetAutoCaptureLock();
			detectionState = "detecting";
			return false;
		}

		resetAutoCaptureLock();
		const hasHintTimedOut =
			lowConfidenceStartAt !== 0 &&
			now - lowConfidenceStartAt >= PLANT_DETECTION_CONFIG.noDetectionHintDelayMs;

		if (!lowConfidenceStartAt) {
			lowConfidenceStartAt = now;
		}

		detectionState = hasHintTimedOut ? "no_detection_hint" : "searching";
		return false;
	}

	function resetAutoCaptureLock() {
		stopProgressLoop();
		holdStartAt = null;
		autoCaptureProgress = 0;
	}

	function getDetectionCanvas() {
		if (!detectionCanvas) {
			detectionCanvas = document.createElement("canvas");
			detectionCanvas.width = 224;
			detectionCanvas.height = 224;
		}

		return detectionCanvas;
	}

	function getMotionCanvas() {
		if (!motionCanvas) {
			motionCanvas = document.createElement("canvas");
			motionCanvas.width = PLANT_DETECTION_CONFIG.motionSampleSize;
			motionCanvas.height = PLANT_DETECTION_CONFIG.motionSampleSize;
		}

		return motionCanvas;
	}

	function getGuideCrop(videoWidth: number, videoHeight: number) {
		const size = Math.min(videoWidth, videoHeight) * PLANT_DETECTION_CONFIG.guideBoxScale;
		return {
			size,
			sx: (videoWidth - size) / 2,
			sy: (videoHeight - size) / 2,
		};
	}

	function measureMotionScore(
		context: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement
	): number {
		const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
		if (!previousMotionPixels) {
			previousMotionPixels = new Uint8ClampedArray(pixels);
			return Number.POSITIVE_INFINITY;
		}

		let totalDiff = 0;
		const pixelCount = pixels.length / 4;

		for (let i = 0; i < pixels.length; i += 4) {
			totalDiff += Math.abs(pixels[i] - previousMotionPixels[i]);
			totalDiff += Math.abs(pixels[i + 1] - previousMotionPixels[i + 1]);
			totalDiff += Math.abs(pixels[i + 2] - previousMotionPixels[i + 2]);
		}

		previousMotionPixels = new Uint8ClampedArray(pixels);
		return totalDiff / (pixelCount * 3 * 255);
	}

	async function setZoom(value: number) {
		if (!videoTrack || !hasZoom) return;
		try {
			await videoTrack.applyConstraints({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				advanced: [{ zoom: value } as any],
			});
			zoom = value;
		} catch {
			error = "This device could not adjust zoom right now.";
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
		} catch {
			error = "Flash controls are not available on this device.";
		}
	}

	async function capturePhoto(mode: CaptureMode = "manual") {
		if (!videoElement || isCapturing) return;

		try {
			isCapturing = true;
			stopDetectionLoop();
			stopProgressLoop();
			detectionState = mode === "auto" ? "auto_capturing" : "manual_capture_in_progress";

			if (mode === "auto") {
				await wait(140);
			}

			const canvas = document.createElement("canvas");
			canvas.width = videoElement.videoWidth;
			canvas.height = videoElement.videoHeight;

			const context = canvas.getContext("2d");
			if (!context) {
				throw new Error("Failed to get canvas context");
			}

			context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
			const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
			const base64 = dataUrl.split(",")[1];
			const capturedDetection = await detectCapturedFrame(canvas);

			await finalizeCapture({
				base64,
				format: "jpeg",
				timestamp: Date.now(),
				source: "camera",
				captureMode: mode,
				plantDetection: capturedDetection
					? {
							checked: capturedDetection.checked,
							score: capturedDetection.score,
							isPlantLike: capturedDetection.isPlantLike,
						}
					: latestDetection
						? {
								checked: latestDetection.checked,
								score: latestDetection.score,
								isPlantLike: latestDetection.isPlantLike,
							}
						: {
								checked: false,
							},
				autoCaptureMetrics:
					mode === "auto"
						? {
								dwellDurationMs: PLANT_DETECTION_CONFIG.dwellDurationMs,
								stabilityScore: latestStabilityScore ?? undefined,
								plantScore: latestDetection?.score,
							}
						: undefined,
			});
		} catch (err) {
			if (err instanceof Error) {
				error = "Failed to capture photo: " + err.message;
			} else {
				error = "Failed to capture photo";
			}
			isCapturing = false;
			resetAutoCaptureLock();
			syncOverlayState(performance.now());
			scheduleDetectionLoop();
		}
	}

	async function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = "";

		if (!file) return;

		try {
			isGalleryValidating = true;
			stopDetectionLoop();
			resetAutoCaptureLock();

			const dataUrl = await readFileAsDataUrl(file);
			await finalizeCapture(photoFromDataUrl(dataUrl, file));
		} catch (err) {
			if (err instanceof Error) {
				error = "Failed to load image: " + err.message;
			} else {
				error = "Failed to load image";
			}
			syncOverlayState(performance.now());
			scheduleDetectionLoop();
		} finally {
			isGalleryValidating = false;
		}
	}

	async function detectCapturedFrame(
		canvas: HTMLCanvasElement
	): Promise<PlantDetectionResult | null> {
		if (!detector) {
			return null;
		}

		try {
			return await detector.classify(canvas);
		} catch {
			return null;
		}
	}

	function getTouchDistance(touch1: Touch, touch2: Touch) {
		const dx = touch1.clientX - touch2.clientX;
		const dy = touch1.clientY - touch2.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	let initialPinchDistance = $state<number | null>(null);
	let initialZoom = $state(1);

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
			newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
			void setZoom(newZoom);
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		if (event.touches.length < 2) {
			initialPinchDistance = null;
		}
	}

	async function handleCancel() {
		stopDetectionLoop();
		await shutdownCamera();
		onCancel();
	}

	async function finalizeCapture(photo: CapturedPhoto) {
		await shutdownCamera();
		onCapture(photo);
	}

	async function shutdownCamera() {
		if (isFlashOn && videoTrack) {
			try {
				await videoTrack.applyConstraints({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					advanced: [{ torch: false } as any],
				});
			} catch {
				// Ignore cleanup failures.
			}
			isFlashOn = false;
		}

		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
	}

	function readFileAsDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(new Error("Unable to read the selected file."));
			reader.readAsDataURL(file);
		});
	}

	function photoFromDataUrl(dataUrl: string, file: File): CapturedPhoto {
		const base64 = dataUrl.split(",")[1];
		const format = file.type.split("/")[1] || "jpeg";

		return {
			base64,
			format,
			timestamp: Date.now(),
			source: "gallery",
		};
	}

	function wait(ms: number) {
		return new Promise((resolve) => window.setTimeout(resolve, ms));
	}
</script>

<div
	class="fixed inset-0 bg-black z-50 flex flex-col"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<div class="sr-only" aria-live="polite">
		{overlayCopy.title}. {overlayCopy.description}
	</div>

	{#if error}
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
		<div class="relative flex-1 overflow-hidden">
			<video
				bind:this={videoElement}
				autoplay
				playsinline
				class="absolute inset-0 w-full h-full object-cover"
			>
				<track kind="captions" src="" label="English" />
			</video>

			{#if detectionState === "auto_capturing"}
				<div class="camera-flash absolute inset-0 pointer-events-none"></div>
			{/if}

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

			<div class="absolute inset-0 flex items-center justify-center pointer-events-none px-8">
				<div class="w-full max-w-md">
					<div
						class={`camera-guide relative aspect-square rounded-[2rem] border-2 ${
							detectionState === "loading_model"
								? "border-white/60 border-dashed"
								: detectionState === "detecting"
									? "border-amber-300 shadow-[0_0_0_1px_rgba(253,224,71,0.3),0_0_30px_rgba(253,224,71,0.18)] camera-guide--detecting"
									: detectionState === "locked" ||
										  detectionState === "auto_capturing"
										? "border-emerald-300 shadow-[0_0_0_1px_rgba(110,231,183,0.4),0_0_30px_rgba(52,211,153,0.22)] camera-guide--locked"
										: detectionState === "manual_capture_in_progress"
											? "border-emerald-300 shadow-[0_0_0_1px_rgba(110,231,183,0.25)]"
											: "border-white/70 border-dashed camera-guide--searching"
						} ${detectionState === "no_detection_hint" ? "border-white/85" : ""}`}
					>
						{#if detectionState === "locked" || detectionState === "auto_capturing"}
							<svg
								viewBox="0 0 100 100"
								class="absolute -inset-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)]"
								aria-hidden="true"
							>
								<rect
									x="3"
									y="3"
									width="94"
									height="94"
									rx="16"
									ry="16"
									fill="none"
									stroke="rgba(255,255,255,0.14)"
									stroke-width="2.5"
								/>
								<rect
									x="3"
									y="3"
									width="94"
									height="94"
									rx="16"
									ry="16"
									fill="none"
									stroke="rgb(167,243,208)"
									stroke-width="2.5"
									stroke-linecap="round"
									pathLength="100"
									stroke-dasharray={`${progressPathLength} 100`}
								/>
							</svg>
						{/if}

						<div
							class="absolute inset-x-0 -bottom-24 flex flex-col items-center text-center gap-3 px-4"
						>
							<div
								class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 backdrop-blur-md"
							>
								{#if detectionState === "loading_model"}
									<LoaderCircle
										size={18}
										class="text-white animate-spin motion-reduce:animate-none"
									/>
								{:else if detectionState === "locked"}
									<CheckCircle2 size={18} class="text-emerald-200" />
								{:else if detectionState === "auto_capturing"}
									<LoaderCircle
										size={18}
										class="text-emerald-100 animate-spin motion-reduce:animate-none"
									/>
								{:else if detectionState === "detecting"}
									<Leaf size={18} class="text-amber-200" />
								{:else if detectionState === "no_detection_hint"}
									<AlertCircle size={18} class="text-white" />
								{:else}
									<Search size={18} class="text-white" />
								{/if}
								<span class="text-sm font-semibold text-white"
									>{overlayCopy.title}</span
								>
							</div>
							<div class="max-w-xs space-y-2">
								<p class="text-sm text-white/90">{overlayCopy.description}</p>
								{#if detectorStatusNote}
									<p class="text-xs text-white/65">{detectorStatusNote}</p>
								{/if}
								{#if debugMetrics}
									<p class="text-[11px] font-mono text-white/55">
										score={debugMetrics.score?.toFixed(3) ?? "n/a"}
										stability={debugMetrics.stability?.toFixed(3) ?? "n/a"}
										progress={(debugMetrics.progress * 100).toFixed(0)}%
									</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div
			class="bg-gradient-to-t from-black/80 to-transparent p-6 space-y-4"
			style="padding-bottom: max(1.5rem, env(safe-area-inset-bottom) + 1.5rem);"
		>
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

			<p class="text-center text-white text-sm mb-2">
				Center the plant in the guide and hold steady for auto-capture, or tap the shutter
				any time.
			</p>

			<div class="flex items-center justify-center gap-8">
				{#if hasFlash}
					<button
						onclick={toggleFlash}
						class={`px-5 py-4 rounded-full backdrop-blur-md transition-all duration-300 ${
							isFlashOn
								? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/50"
								: "bg-white/20 text-white border border-white/20 hover:bg-white/30"
						}`}
						aria-label="Toggle flash"
					>
						{#if isFlashOn}
							<Zap size={28} fill="currentColor" />
						{:else}
							<ZapOff size={28} />
						{/if}
					</button>
				{:else}
					<div class="w-[76px]"></div>
				{/if}

				<button
					onclick={() => capturePhoto("manual")}
					disabled={isCapturing || isGalleryValidating}
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
					disabled={isCapturing || isGalleryValidating}
					class="px-5 py-4 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:text-white/40 backdrop-blur-sm border border-white/30 text-white rounded-full transition-all duration-300 flex items-center gap-2"
					aria-label="Upload image"
				>
					{#if isGalleryValidating}
						<LoaderCircle size={28} class="animate-spin motion-reduce:animate-none" />
					{:else}
						<ImageIcon size={28} />
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	video {
		object-fit: cover;
	}

	.camera-guide--searching {
		animation: guide-pulse 2.4s ease-in-out infinite;
	}

	.camera-guide--detecting {
		animation: guide-glow 1.8s ease-in-out infinite;
	}

	.camera-guide--locked {
		animation: guide-lock 1.2s ease-in-out infinite;
	}

	.camera-flash {
		animation: shutter-flash 180ms ease-out forwards;
		background: rgba(255, 255, 255, 0.28);
	}

	@keyframes guide-pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.8;
		}
		50% {
			transform: scale(1.015);
			opacity: 1;
		}
	}

	@keyframes guide-glow {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.02);
		}
	}

	@keyframes guide-lock {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.01);
		}
	}

	@keyframes shutter-flash {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.camera-guide--searching,
		.camera-guide--detecting,
		.camera-guide--locked,
		.camera-flash {
			animation: none;
		}
	}
</style>
