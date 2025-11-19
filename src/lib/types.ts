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
    severity: 'low' | 'medium' | 'high' | 'critical';
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
    type: 'organic' | 'chemical' | 'cultural' | 'biological';
    /** Steps to apply treatment */
    steps: string[];
}
