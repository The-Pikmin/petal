import type { Plant, Tip, DiseaseLibraryEntry, ScanRecord } from "../types";

export const mockMyPlants: Plant[] = [
    {
        id: "1",
        name: "Monstera Deliciosa",
        species: "Monstera deliciosa",
        image: "/images/plants/monstera.png",
        healthStatus: "healthy",
        lastWatered: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
        nextWatering: Date.now() + 1000 * 60 * 60 * 24 * 5, // in 5 days
    },
    {
        id: "2",
        name: "Snake Plant",
        species: "Sansevieria trifasciata",
        image: "/images/plants/snake-plant.png",
        healthStatus: "needs-water",
        lastWatered: Date.now() - 1000 * 60 * 60 * 24 * 14, // 14 days ago
        nextWatering: Date.now() - 1000 * 60 * 60 * 24 * 1, // yesterday
    },
    {
        id: "3",
        name: "Fiddle Leaf Fig",
        species: "Ficus lyrata",
        image: "/images/plants/fern.png", // Placeholder
        healthStatus: "warning",
        lastWatered: Date.now() - 1000 * 60 * 60 * 24 * 5,
        nextWatering: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
];

export const mockDailyTip: Tip = {
    id: "tip-101",
    title: "Watering Wisdom",
    content:
        "Most houseplants prefer to dry out slightly between waterings. Stick your finger about an inch into the soil; if it feels dry, it's time to water.",
    category: "care",
};

export const mockCommonDiseases: DiseaseLibraryEntry[] = [
    {
        id: "d1",
        name: "Root Rot",
        category: "fungal",
        severity: "high",
        description: "Decay of roots caused by overwatering.",
        details: "Root rot is a condition found in both indoor and outdoor plants...",
        symptoms: ["Yellowing leaves", "Mushy stems", "Stunted growth"],
        affectedPlants: ["Most potted plants"],
        treatments: [],
        prevention: ["Avoid overwatering", "Ensure good drainage"],
        thumbnail: "/images/diseases/root-rot.jpg", // Placeholder
    },
    {
        id: "d2",
        name: "Spider Mites",
        category: "pest",
        severity: "medium",
        description: "Tiny pests that suck sap from leaves.",
        details: "Spider mites are tiny reddish-brown arachnids...",
        symptoms: ["Webbing on leaves", "Tiny yellow spots"],
        affectedPlants: ["Many houseplants"],
        treatments: [],
        prevention: ["Increase humidity", "Wipe leaves regularly"],
        thumbnail: "/images/diseases/spider-mites.jpg", // Placeholder
    },
];
