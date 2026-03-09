// === Auth ===
export interface ApiUser {
	id: string;
	username: string;
	email: string;
}

// === Image Upload ===
export interface ImageUploadResponse {
	id: number;
	supabase_path: string;
	uploaded_at: string;
	url: string;
}

// === Prediction ===
export interface PredictRequest {
	image_url: string;
}

export interface SpeciesPrediction {
	species_id: string;
	name: string;
	confidence: number;
}

export interface PredictResponse {
	predictions: SpeciesPrediction[];
}

// === Combined scan result ===
export interface PlantIDResult {
	imageUrl: string;
	predictions: SpeciesPrediction[];
	timestamp: number;
}

// === API Error ===
export interface ApiError {
	error?: string;
	detail?: string;
	[key: string]: unknown;
}
