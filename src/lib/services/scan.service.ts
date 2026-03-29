import { apiFetch } from "$lib/services/api";
import type {
	ImageUploadResponse,
	PredictResponse,
	PlantIDResult,
	ScanResultResponse,
	StaticDiseaseResponse,
	UploadRecordResponse,
	PaginatedUploads,
} from "$lib/types/api.types";
import type { CapturedPhoto, ScanRecord } from "$lib/types";

let diseaseLibraryCache: StaticDiseaseResponse[] | null = null;
let diseaseLibraryPromise: Promise<StaticDiseaseResponse[]> | null = null;
const diseaseDetailCache = new Map<string, StaticDiseaseResponse>();

function base64ToFile(photo: CapturedPhoto): File {
	const byteString = atob(photo.base64);
	const arrayBuffer = new ArrayBuffer(byteString.length);
	const uint8Array = new Uint8Array(arrayBuffer);
	for (let i = 0; i < byteString.length; i++) {
		uint8Array[i] = byteString.charCodeAt(i);
	}
	const blob = new Blob([uint8Array], { type: `image/${photo.format}` });
	return new File([blob], `plant-${photo.timestamp}.${photo.format}`, {
		type: `image/${photo.format}`,
	});
}

export async function identifyPlant(photo: CapturedPhoto): Promise<PlantIDResult> {
	const file = base64ToFile(photo);
	const formData = new FormData();
	formData.append("image", file);

	const uploadResponse = await apiFetch<ImageUploadResponse>("/images/upload/", {
		method: "POST",
		body: formData,
	});

	const predictResponse = await apiFetch<PredictResponse>("/predict/", {
		method: "POST",
		body: JSON.stringify({ image_url: uploadResponse.url }),
	});

	return {
		imageUrl: uploadResponse.url,
		supabasePath: uploadResponse.supabase_path,
		predictions: predictResponse.predictions,
		disease: predictResponse.disease ?? null,
		low_confidence: predictResponse.low_confidence ?? false,
		timestamp: Date.now(),
	};
}

export async function saveScan(result: PlantIDResult): Promise<void> {
	const topPrediction = result.predictions[0];
	await apiFetch("/scans/", {
		method: "POST",
		body: JSON.stringify({
			image_url: result.imageUrl,
			supabase_path: result.supabasePath,
			plant_name: topPrediction?.common_name || topPrediction?.name || "Unknown",
			top_predictions: result.predictions,
			disease_name: result.disease?.disease_name ?? "",
			disease_confidence: result.disease?.confidence ?? null,
			disease_genus: result.disease?.genus ?? "",
			all_diseases: result.disease?.all_diseases ?? [],
		}),
	});
}

function mapResponseToScanRecord(r: ScanResultResponse): ScanRecord {
	const topPrediction = r.top_predictions[0];
	const commonName = topPrediction?.common_name?.trim() || "";
	const scientificName = topPrediction?.name?.trim() || r.plant_name;
	const displayPlantName = commonName || r.plant_name || scientificName;
	let diseaseName: string;
	let description: string;
	if (!r.disease_name) {
		diseaseName = "Unknown";
		description = "No disease detected";
	} else if (r.disease_name === "Healthy") {
		diseaseName = "Healthy Plant";
		description = "No disease detected";
	} else {
		diseaseName = r.disease_name.replaceAll("_", " ");
		description = r.disease_genus ? `Detected in ${r.disease_genus}` : "Disease detected";
	}

	const confidence = r.disease_confidence ?? 0;
	let severity: "low" | "medium" | "high";
	if (confidence >= 0.8) severity = "high";
	else if (confidence >= 0.5) severity = "medium";
	else severity = "low";

	return {
		id: String(r.id),
		photo: { base64: "", format: "jpeg", timestamp: new Date(r.created_at).getTime() },
		diagnosis: {
			diseaseName,
			confidence,
			description,
			severity,
			treatments: [],
			affectedParts: [],
		},
		plantName: displayPlantName,
		commonName: commonName || undefined,
		scientificName: scientificName || undefined,
		timestamp: new Date(r.created_at).getTime(),
		imageUrl: r.image_url,
	};
}

export async function fetchScanHistory(): Promise<ScanRecord[]> {
	const data = await apiFetch<ScanResultResponse[]>("/scans/list/");
	return data.map(mapResponseToScanRecord);
}

export async function fetchScanById(id: string): Promise<ScanResultResponse> {
	return apiFetch<ScanResultResponse>(`/scans/${id}/`);
}

export async function deleteScan(id: string): Promise<void> {
	await apiFetch(`/scans/${id}/`, {
		method: "DELETE",
	});
}

export async function fetchUploads(
	page: number = 1,
	pageSize: number = 24
): Promise<PaginatedUploads> {
	return apiFetch<PaginatedUploads>(`/images/list/?page=${page}&page_size=${pageSize}`);
}

export async function deleteUpload(id: number): Promise<void> {
	await apiFetch(`/images/${id}/`, {
		method: "DELETE",
	});
}

export async function fetchAllDiseases(): Promise<StaticDiseaseResponse[]> {
	if (diseaseLibraryCache) {
		return diseaseLibraryCache;
	}

	if (!diseaseLibraryPromise) {
		diseaseLibraryPromise = apiFetch<StaticDiseaseResponse[]>("/diseases/")
			.then((data) => {
				diseaseLibraryCache = data;
				for (const disease of data) {
					const key = `${disease.genus}::${disease.disease_name}`;
					diseaseDetailCache.set(key, disease);
				}
				return data;
			})
			.finally(() => {
				diseaseLibraryPromise = null;
			});
	}

	return diseaseLibraryPromise;
}

export async function fetchDiseaseInfo(
	genus: string,
	diseaseName: string
): Promise<StaticDiseaseResponse> {
	const cacheKey = `${genus}::${diseaseName}`;
	const cachedDisease = diseaseDetailCache.get(cacheKey);
	if (cachedDisease) {
		return cachedDisease;
	}

	if (diseaseLibraryCache) {
		const match = diseaseLibraryCache.find(
			(disease) => disease.genus === genus && disease.disease_name === diseaseName
		);
		if (match) {
			diseaseDetailCache.set(cacheKey, match);
			return match;
		}
	}

	const disease = await apiFetch<StaticDiseaseResponse>(
		`/diseases/${encodeURIComponent(genus)}/${encodeURIComponent(diseaseName)}/`
	);
	diseaseDetailCache.set(cacheKey, disease);
	return disease;
}

export function preloadDiseaseLibrary(): void {
	void fetchAllDiseases().catch(() => undefined);
}
