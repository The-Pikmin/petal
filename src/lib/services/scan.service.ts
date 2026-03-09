import { apiFetch } from '$lib/services/api';
import type { ImageUploadResponse, PredictResponse, PlantIDResult } from '$lib/types/api.types';
import type { CapturedPhoto } from '$lib/types';

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
    formData.append('image', file);

    const uploadResponse = await apiFetch<ImageUploadResponse>('/images/upload/', {
        method: 'POST',
        body: formData,
    });

    const predictResponse = await apiFetch<PredictResponse>('/predict/', {
        method: 'POST',
        body: JSON.stringify({ image_url: uploadResponse.url }),
    });

    return {
        imageUrl: uploadResponse.url,
        predictions: predictResponse.predictions,
        timestamp: Date.now(),
    };
}
