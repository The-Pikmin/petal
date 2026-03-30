export type CameraDetectionState =
	| "loading_model"
	| "searching"
	| "detecting"
	| "locked"
	| "auto_capturing"
	| "no_detection_hint"
	| "manual_capture_in_progress";

export interface PlantDetectionResult {
	checked: boolean;
	score?: number;
	isPlantLike?: boolean;
	topPrediction?: string;
}

export interface CameraDetectionCopy {
	title: string;
	description: string;
}

export const PLANT_DETECTION_CONFIG = {
	detectionFps: 5,
	plantConfidenceThreshold: 0.2,
	stabilityThreshold: 0.04,
	stabilitySmoothingFactor: 0.35,
	dwellDurationMs: 1_500,
	lockReleaseGraceMs: 350,
	noDetectionHintDelayMs: 5_000,
	motionSampleSize: 24,
	topKPredictions: 5,
	guideBoxScale: 0.8,
	modelVersion: 1 as const,
	modelAlpha: 0.25 as const,
	debugEnabled: false,
};

export const CAMERA_DETECTION_COPY: Record<CameraDetectionState, CameraDetectionCopy> = {
	loading_model: {
		title: "Auto-scan loading...",
		description: "Point the camera at a plant while detection gets ready.",
	},
	searching: {
		title: "Point at a plant",
		description: "Keep the leaf or plant centered inside the frame.",
	},
	detecting: {
		title: "Plant detected",
		description: "Hold steady to start auto-capture, or tap the shutter now.",
	},
	locked: {
		title: "Capturing soon...",
		description: "Keep the plant steady inside the frame until the ring completes.",
	},
	auto_capturing: {
		title: "Capturing now",
		description: "Hold still for just a moment.",
	},
	no_detection_hint: {
		title: "Try moving closer",
		description: "Adjust the angle or lighting so the plant fills more of the guide.",
	},
	manual_capture_in_progress: {
		title: "Capturing photo",
		description: "Preparing your image for review.",
	},
};
