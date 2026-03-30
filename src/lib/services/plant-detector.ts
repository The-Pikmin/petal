import { PLANT_DETECTION_CONFIG, type PlantDetectionResult } from "$lib/config/plant-detection";
import type { MobileNet } from "@tensorflow-models/mobilenet";

type DetectorInput = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageData;

export interface PlantDetector {
	classify(input: DetectorInput): Promise<PlantDetectionResult>;
	dispose(): void;
}

const PLANT_LABEL_PATTERNS = [
	/\bplant\b/i,
	/\bleaf\b/i,
	/\bflower\b/i,
	/\bpetal\b/i,
	/\btree\b/i,
	/\bfern\b/i,
	/\bcactus\b/i,
	/\borchid\b/i,
	/\blily\b/i,
	/\bdaisy\b/i,
	/\bsunflower\b/i,
	/\brose\b/i,
	/\bcorn\b/i,
	/\bmaize\b/i,
	/\brapeseed\b/i,
	/\bacorn\b/i,
	/\bchestnut\b/i,
	/\bstrawberry\b/i,
	/\bfig\b/i,
	/\bpineapple\b/i,
	/\bjackfruit\b/i,
	/\bpomegranate\b/i,
	/\bartichoke\b/i,
	/\bbroccoli\b/i,
	/\bcauliflower\b/i,
	/\bzucchini\b/i,
	/\bcucumber\b/i,
	/\bcardoon\b/i,
	/\bbell pepper\b/i,
	/\byellow lady'?s slipper\b/i,
	/\bhip, rose hip\b/i,
	/\bear, spike, capitulum\b/i,
];

let detectorPromise: Promise<PlantDetector> | null = null;

export function loadPlantDetector(): Promise<PlantDetector> {
	if (!detectorPromise) {
		detectorPromise = createPlantDetector().catch((error) => {
			detectorPromise = null;
			throw error;
		});
	}

	return detectorPromise;
}

async function createPlantDetector(): Promise<PlantDetector> {
	const [mobilenet, tf] = await Promise.all([
		import("@tensorflow-models/mobilenet"),
		import("@tensorflow/tfjs"),
	]);

	await configureBackend(tf);

	const model = await mobilenet.load({
		version: PLANT_DETECTION_CONFIG.modelVersion,
		alpha: PLANT_DETECTION_CONFIG.modelAlpha,
	});

	return {
		async classify(input) {
			const predictions = await model.classify(input, PLANT_DETECTION_CONFIG.topKPredictions);
			return scorePredictions(predictions);
		},
		dispose() {
			const disposableModel = model as MobileNet & {
				model?: {
					dispose?: () => void;
				};
			};
			disposableModel.model?.dispose?.();
			detectorPromise = null;
		},
	};
}

async function configureBackend(tf: typeof import("@tensorflow/tfjs")): Promise<void> {
	await tf.ready();

	for (const backend of ["webgl", "cpu"] as const) {
		try {
			if (tf.getBackend() !== backend) {
				await tf.setBackend(backend);
				await tf.ready();
			}
			return;
		} catch {
			// Try the next backend.
		}
	}
}

function scorePredictions(
	predictions: Array<{ className: string; probability: number }>
): PlantDetectionResult {
	const plantMatches = predictions.filter((prediction) =>
		PLANT_LABEL_PATTERNS.some((pattern) => pattern.test(prediction.className))
	);

	const score = plantMatches.reduce((sum, prediction) => sum + prediction.probability, 0);
	const topPrediction = predictions[0]?.className;

	return {
		checked: true,
		score,
		isPlantLike: score >= PLANT_DETECTION_CONFIG.plantConfidenceThreshold,
		topPrediction,
	};
}
