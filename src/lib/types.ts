/**
 * Represents a captured photo from the camera
 */
export interface CapturedPhoto {
	/** Base64 encoded image data */
	base64: string;
	/** Image format (jpeg, png, etc.) */
	format: string;
	/** Timestamp when photo was captured */
	timestamp: number;
}

/**
 * Represents a plant disease diagnosis result
 */
export interface DiagnosisResult {
	/** Name of the detected disease */
	diseaseName: string;
	/** Confidence score (0-1) */
	confidence: number;
	/** Description of the disease */
	description: string;
	/** Severity level */
	severity: "low" | "medium" | "high" | "critical";
	/** Treatment recommendations */
	treatments: Treatment[];
	/** Affected plant parts */
	affectedParts: string[];
}

/**
 * Represents a treatment recommendation
 */
export interface Treatment {
	/** Treatment name */
	name: string;
	/** Treatment description */
	description: string;
	/** Treatment type */
	type: "organic" | "chemical" | "cultural" | "biological";
	/** Steps to apply treatment */
	steps: string[];
}

/**
 * Represents a historical scan record
 */
export interface ScanRecord {
	/** Unique identifier */
	id: string;
	/** Captured photo */
	photo: CapturedPhoto;
	/** Diagnosis result */
	diagnosis: DiagnosisResult;
	/** Timestamp when scan was performed */
	timestamp: number;
	/** Plant name (if identified) */
	plantName?: string;
	/** User notes */
	notes?: string;
}

/**
 * Represents a disease in the library
 */
export interface DiseaseLibraryEntry {
	/** Unique identifier */
	id: string;
	/** Disease name */
	name: string;
	/** Disease category */
	category: "fungal" | "bacterial" | "viral" | "pest" | "nutrient" | "environmental";
	/** Severity level */
	severity: "low" | "medium" | "high" | "critical";
	/** Short description */
	description: string;
	/** Detailed information */
	details: string;
	/** Common symptoms */
	symptoms: string[];
	/** Affected plants */
	affectedPlants: string[];
	/** Treatment recommendations */
	treatments: Treatment[];
	/** Prevention tips */
	prevention: string[];
	/** Thumbnail image URL */
	thumbnail: string;
}

/**
 * Represents user profile data
 */
export interface UserProfile {
	/** User ID */
	id: string;
	/** Display name */
	name: string;
	/** Email address */
	email: string;
	/** Avatar URL */
	avatar?: string;
	/** Account created date */
	joinedDate: number;
	/** User statistics */
	stats: UserStats;
	/** User settings */
	settings: UserSettings;
}

/**
 * User statistics
 */
export interface UserStats {
	/** Total number of scans */
	totalScans: number;
	/** Number of plants saved */
	plantsSaved: number;
	/** Number of unique diseases identified */
	diseasesIdentified: number;
	/** Last scan date */
	lastScanDate?: number;
}

/**
 * User settings and preferences
 */
export interface UserSettings {
	/** Notification preferences */
	notifications: {
		enabled: boolean;
		scanReminders: boolean;
		careReminders: boolean;
	};
	/** Language preference */
	language: string;
	/** Theme preference */
	theme: "light" | "dark" | "auto";
	/** Privacy settings */
	privacy: {
		shareData: boolean;
		analyticsEnabled: boolean;
	};
}
