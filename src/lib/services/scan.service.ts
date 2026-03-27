import { apiFetch } from "$lib/services/api";
import type {
	ImageUploadResponse,
	PredictResponse,
	PlantIDResult,
	ScanResultResponse,
	StaticDiseaseResponse,
	UploadRecordResponse,
} from "$lib/types/api.types";
import type { CapturedPhoto, ScanRecord } from "$lib/types";

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
			plant_name: topPrediction?.name ?? "Unknown",
			top_predictions: result.predictions,
			disease_name: result.disease?.disease_name ?? "",
			disease_confidence: result.disease?.confidence ?? null,
			disease_genus: result.disease?.genus ?? "",
			all_diseases: result.disease?.all_diseases ?? [],
		}),
	});
}

function mapResponseToScanRecord(r: ScanResultResponse): ScanRecord {
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
		plantName: r.plant_name,
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

export async function fetchUploads(): Promise<UploadRecordResponse[]> {
	return apiFetch<UploadRecordResponse[]>("/images/list/");
}

export async function deleteUpload(id: number): Promise<void> {
	await apiFetch(`/images/${id}/`, {
		method: "DELETE",
	});
}

export async function fetchAllDiseases(): Promise<StaticDiseaseResponse[]> {
	return apiFetch<StaticDiseaseResponse[]>("/diseases/");
}

export async function fetchDiseaseInfo(
	genus: string,
	diseaseName: string
): Promise<StaticDiseaseResponse> {
	return apiFetch<StaticDiseaseResponse>(
		`/diseases/${encodeURIComponent(genus)}/${encodeURIComponent(diseaseName)}/`
	);
}
