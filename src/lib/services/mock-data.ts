import type { ScanRecord, DiseaseLibraryEntry, UserProfile } from "$lib/types";

/**
 * Mock scan history data
 */
export const mockScanHistory: ScanRecord[] = [
	{
		id: "scan-001",
		photo: {
			base64: "/images/scans/tomato-blight.jpg",
			format: "jpeg",
			timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
		},
		diagnosis: {
			diseaseName: "Early Blight",
			confidence: 0.92,
			description:
				"A fungal disease causing dark spots with concentric rings on lower leaves.",
			severity: "medium",
			treatments: [
				{
					name: "Copper Fungicide Spray",
					description: "Apply copper-based fungicide to affected areas",
					type: "chemical",
					steps: [
						"Remove severely affected leaves",
						"Mix fungicide according to label",
						"Spray in early morning or evening",
					],
				},
			],
			affectedParts: ["leaves", "stems"],
		},
		plantName: "Tomato",
		timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
	},
	{
		id: "scan-002",
		photo: {
			base64: "/images/scans/rose-blackspot.jpg",
			format: "jpeg",
			timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
		},
		diagnosis: {
			diseaseName: "Black Spot",
			confidence: 0.88,
			description: "A fungal disease causing black spots with yellowing on rose leaves.",
			severity: "medium",
			treatments: [
				{
					name: "Neem Oil Treatment",
					description: "Organic treatment using neem oil spray",
					type: "organic",
					steps: ["Remove infected leaves", "Spray neem oil solution", "Repeat weekly"],
				},
			],
			affectedParts: ["leaves"],
		},
		plantName: "Rose",
		timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
	},
	{
		id: "scan-003",
		photo: {
			base64: "/images/scans/healthy-plant.jpg",
			format: "jpeg",
			timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
		},
		diagnosis: {
			diseaseName: "Healthy Plant",
			confidence: 0.96,
			description: "No diseases detected. Your plant appears healthy!",
			severity: "low",
			treatments: [],
			affectedParts: [],
		},
		plantName: "Basil",
		timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
	},
	{
		id: "scan-004",
		photo: {
			base64: "/images/scans/powdery-mildew.jpg",
			format: "jpeg",
			timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
		},
		diagnosis: {
			diseaseName: "Powdery Mildew",
			confidence: 0.85,
			description: "A fungal disease causing white powdery coating on leaves and stems.",
			severity: "medium",
			treatments: [
				{
					name: "Baking Soda Spray",
					description: "Homemade organic treatment",
					type: "organic",
					steps: [
						"Mix 1 tbsp baking soda with 1 gallon water",
						"Add few drops of dish soap",
						"Spray on affected areas",
					],
				},
			],
			affectedParts: ["leaves", "stems"],
		},
		plantName: "Zucchini",
		timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
	},
];

/**
 * Mock disease library data
 */
export const mockDiseaseLibrary: DiseaseLibraryEntry[] = [
	{
		id: "disease-001",
		name: "Early Blight",
		category: "fungal",
		severity: "medium",
		description: "Fungal disease causing dark spots on leaves",
		details:
			"Early blight is a common fungal disease affecting tomatoes and potatoes. It typically appears as dark spots with concentric rings on lower leaves, eventually causing yellowing and leaf drop.",
		symptoms: [
			"Dark brown spots with concentric rings",
			"Yellowing around spots",
			"Lower leaves affected first",
			"Premature leaf drop",
		],
		affectedPlants: ["Tomato", "Potato", "Eggplant"],
		treatments: [
			{
				name: "Copper Fungicide",
				description: "Apply copper-based fungicide spray",
				type: "chemical",
				steps: [
					"Remove affected leaves",
					"Apply every 7-10 days",
					"Continue until harvest",
				],
			},
		],
		prevention: [
			"Rotate crops annually",
			"Mulch around plants",
			"Water at soil level",
			"Ensure good air circulation",
		],
		thumbnail: "/images/diseases/early-blight.jpg",
	},
	{
		id: "disease-002",
		name: "Powdery Mildew",
		category: "fungal",
		severity: "medium",
		description: "White powdery coating on plant surfaces",
		details:
			"Powdery mildew is a fungal disease that appears as white, powdery spots on leaves and stems. It thrives in warm, dry conditions with high humidity.",
		symptoms: ["White powdery coating", "Distorted leaves", "Stunted growth", "Reduced yield"],
		affectedPlants: ["Zucchini", "Cucumber", "Roses", "Peas"],
		treatments: [
			{
				name: "Neem Oil",
				description: "Organic neem oil spray treatment",
				type: "organic",
				steps: ["Mix neem oil with water", "Spray all plant surfaces", "Apply weekly"],
			},
		],
		prevention: [
			"Plant in full sun",
			"Space plants properly",
			"Avoid overhead watering",
			"Choose resistant varieties",
		],
		thumbnail: "/images/diseases/powdery-mildew.jpg",
	},
	{
		id: "disease-003",
		name: "Black Spot",
		category: "fungal",
		severity: "medium",
		description: "Black spots on rose leaves",
		details:
			"Black spot is a fungal disease primarily affecting roses. It causes circular black spots with fringed margins, leading to yellowing and premature leaf drop.",
		symptoms: [
			"Circular black spots",
			"Yellow halos around spots",
			"Premature defoliation",
			"Weakened plant",
		],
		affectedPlants: ["Roses"],
		treatments: [
			{
				name: "Fungicide Treatment",
				description: "Apply rose-specific fungicide",
				type: "chemical",
				steps: ["Remove infected leaves", "Apply fungicide spray", "Repeat every 2 weeks"],
			},
		],
		prevention: [
			"Plant disease-resistant varieties",
			"Water at base of plant",
			"Prune for air circulation",
			"Remove fallen leaves",
		],
		thumbnail: "/images/diseases/black-spot.jpg",
	},
	{
		id: "disease-004",
		name: "Aphid Infestation",
		category: "pest",
		severity: "low",
		description: "Small sap-sucking insects on plants",
		details:
			"Aphids are small, soft-bodied insects that feed on plant sap. They reproduce quickly and can spread viral diseases.",
		symptoms: [
			"Clusters of small insects",
			"Sticky honeydew on leaves",
			"Curled or distorted leaves",
			"Stunted growth",
		],
		affectedPlants: ["Most garden plants"],
		treatments: [
			{
				name: "Insecticidal Soap",
				description: "Spray with insecticidal soap",
				type: "organic",
				steps: ["Mix soap solution", "Spray directly on aphids", "Repeat every few days"],
			},
		],
		prevention: [
			"Encourage beneficial insects",
			"Use companion planting",
			"Spray with water",
			"Keep plants healthy",
		],
		thumbnail: "/images/diseases/aphids.jpg",
	},
	{
		id: "disease-005",
		name: "Bacterial Wilt",
		category: "bacterial",
		severity: "high",
		description: "Rapid wilting caused by bacteria",
		details:
			"Bacterial wilt is a serious disease that causes rapid wilting and death. It's spread by beetles and through infected soil.",
		symptoms: ["Sudden wilting", "No leaf yellowing", "Sticky sap from stems", "Plant death"],
		affectedPlants: ["Cucumber", "Squash", "Melon"],
		treatments: [
			{
				name: "Remove Infected Plants",
				description: "No cure available, remove and destroy",
				type: "cultural",
				steps: ["Remove entire plant", "Destroy (don't compost)", "Sanitize tools"],
			},
		],
		prevention: [
			"Control beetle vectors",
			"Rotate crops",
			"Plant resistant varieties",
			"Use row covers",
		],
		thumbnail: "/images/diseases/bacterial-wilt.jpg",
	},
	{
		id: "disease-006",
		name: "Tomato Mosaic Virus",
		category: "viral",
		severity: "high",
		description: "Viral disease causing mottled leaves",
		details:
			"Tomato mosaic virus causes distinctive mosaic patterns on leaves and can severely reduce yield. It's highly contagious.",
		symptoms: [
			"Mottled light and dark green",
			"Distorted leaves",
			"Stunted growth",
			"Reduced fruit production",
		],
		affectedPlants: ["Tomato", "Pepper"],
		treatments: [
			{
				name: "Remove Infected Plants",
				description: "No cure, prevention is key",
				type: "cultural",
				steps: ["Remove infected plants", "Wash hands thoroughly", "Disinfect tools"],
			},
		],
		prevention: [
			"Plant resistant varieties",
			"Don't smoke near plants",
			"Sanitize tools",
			"Control aphid vectors",
		],
		thumbnail: "/images/diseases/mosaic-virus.jpg",
	},
	{
		id: "disease-007",
		name: "Iron Deficiency",
		category: "nutrient",
		severity: "low",
		description: "Yellowing of young leaves",
		details:
			"Iron deficiency causes interveinal chlorosis, where leaf veins remain green while the tissue between turns yellow.",
		symptoms: [
			"Yellow young leaves",
			"Green veins",
			"Stunted growth",
			"Poor fruit development",
		],
		affectedPlants: ["Azalea", "Blueberry", "Citrus"],
		treatments: [
			{
				name: "Iron Chelate",
				description: "Apply iron supplement",
				type: "chemical",
				steps: ["Test soil pH", "Apply iron chelate", "Adjust soil pH if needed"],
			},
		],
		prevention: [
			"Maintain proper soil pH",
			"Use acidifying fertilizers",
			"Add organic matter",
			"Avoid over-watering",
		],
		thumbnail: "/images/diseases/iron-deficiency.jpg",
	},
	{
		id: "disease-008",
		name: "Frost Damage",
		category: "environmental",
		severity: "medium",
		description: "Damage from freezing temperatures",
		details:
			"Frost damage occurs when plant tissues freeze, causing cell walls to rupture and tissues to die.",
		symptoms: ["Blackened leaves", "Wilted appearance", "Water-soaked spots", "Dead tissue"],
		affectedPlants: ["Tender annuals", "Tropicals"],
		treatments: [
			{
				name: "Prune Damage",
				description: "Remove damaged tissue",
				type: "cultural",
				steps: ["Wait for new growth", "Prune dead tissue", "Fertilize lightly"],
			},
		],
		prevention: [
			"Cover plants before frost",
			"Move containers indoors",
			"Water before cold nights",
			"Choose hardy varieties",
		],
		thumbnail: "/images/diseases/frost-damage.jpg",
	},
];

/**
 * Mock user profile data
 */
export const mockUserProfile: UserProfile = {
	id: "user-001",
	name: "Gardener",
	email: "gardener@greeneye.app",
	joinedDate: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
	stats: {
		totalScans: 24,
		plantsSaved: 12,
		diseasesIdentified: 8,
		lastScanDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
	},
	settings: {
		notifications: {
			enabled: true,
			scanReminders: true,
			careReminders: true,
		},
		language: "en",
		theme: "auto",
		privacy: {
			shareData: false,
			analyticsEnabled: true,
		},
	},
};
