// === Auth ===
export interface ApiUser {
	id: string;
	username: string;
	email: string;
}

// === Image Upload ===
export interface ImageUploadResponse {
	id: string;
	supabase_path: string;
	uploaded_at: string;
	url: string;
	in_use?: boolean;
}

export interface UploadRecordResponse {
	id: string;
	supabase_path: string;
	uploaded_at: string;
	url: string;
	in_use: boolean;
}

export interface PaginatedUploads {
	results: UploadRecordResponse[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
}

// === Prediction ===
export interface PredictRequest {
	image_url: string;
}

export interface SpeciesPrediction {
	species_id: string;
	name: string;
	common_name: string;
	confidence: number;
}

export interface DiseasePrediction {
	name: string;
	confidence: number;
}

export interface DiseaseResult {
	genus: string;
	disease_name: string;
	confidence: number;
	all_diseases: DiseasePrediction[];
}

export interface PredictResponse {
	predictions: SpeciesPrediction[];
	disease: DiseaseResult | null;
	low_confidence: boolean;
}

// === Combined scan result ===
export interface PlantIDResult {
	imageUrl: string;
	supabasePath: string;
	predictions: SpeciesPrediction[];
	disease: DiseaseResult | null;
	low_confidence: boolean;
	timestamp: number;
}

// === Scan Result (from backend) ===
export interface ScanResultResponse {
	id: number;
	image_url: string;
	plant_name: string;
	top_predictions: SpeciesPrediction[];
	disease_name: string;
	disease_confidence: number | null;
	disease_genus: string;
	all_diseases: DiseasePrediction[];
	created_at: string;
}

// === Disease Library (from Supabase static_diseases table) ===
export interface DiseaseSymptom {
	description: string;
	progression: string;
}

export interface DiseaseCause {
	factor: string;
	detail: string;
}

export interface DiseaseTreatmentStep {
	step: number;
	action: string;
	detail: string;
	urgency: "immediate" | "ongoing" | "conditional";
}

export interface DiseasePreventionTip {
	tip: string;
	detail: string;
}

export interface DiseaseRecommendedActions {
	disease_name: string;
	scientific_name: string;
	affected_plants: string[];
	symptoms: DiseaseSymptom[];
	onset_period: string;
	causes: DiseaseCause[];
	treatments: DiseaseTreatmentStep[];
	prevention: DiseasePreventionTip[];
}

export interface StaticDiseaseResponse {
	disease_id: number;
	disease_name: string;
	genus: string;
	recommended_actions: DiseaseRecommendedActions;
}

// === API Error ===
export interface ApiError {
	error?: string;
	detail?: string;
	[key: string]: unknown;
}
