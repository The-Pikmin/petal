import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import type { CapturedPhoto } from '$lib/types';

/**
 * Service for handling camera operations
 */
export class CameraService {
    /**
     * Checks if running on a native platform (iOS/Android)
     * @returns true if native, false if web
     */
    static isNativePlatform(): boolean {
        return Capacitor.isNativePlatform();
    }
    /**
     * Captures a photo using the device camera
     * @returns Promise with the captured photo data
     * @throws Error if camera access is denied or capture fails
     */
    static async capturePhoto(): Promise<CapturedPhoto> {
        try {
            const photo = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera
            });

            if (!photo.base64String) {
                throw new Error('Failed to capture photo: No image data received');
            }

            return {
                base64: photo.base64String,
                format: photo.format || 'jpeg',
                timestamp: Date.now()
            };
        } catch (error) {
            if (error instanceof Error) {
                // User cancelled or denied permission
                if (error.message.includes('cancelled') || error.message.includes('denied')) {
                    throw new Error('Camera access was cancelled or denied');
                }
                throw error;
            }
            throw new Error('An unexpected error occurred while capturing photo');
        }
    }

    /**
     * Picks a photo from the device gallery
     * @returns Promise with the selected photo data
     * @throws Error if selection is cancelled or fails
     */
    static async pickFromGallery(): Promise<CapturedPhoto> {
        try {
            const photo = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Photos
            });

            if (!photo.base64String) {
                throw new Error('Failed to select photo: No image data received');
            }

            return {
                base64: photo.base64String,
                format: photo.format || 'jpeg',
                timestamp: Date.now()
            };
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('cancelled')) {
                    throw new Error('Photo selection was cancelled');
                }
                throw error;
            }
            throw new Error('An unexpected error occurred while selecting photo');
        }
    }

    /**
     * Checks if camera is available on the device
     * @returns Promise<boolean> indicating camera availability
     */
    static async checkCameraAvailability(): Promise<boolean> {
        try {
            // Try to check permissions (available in newer Capacitor versions)
            const permissions = await Camera.checkPermissions();
            return permissions.camera !== 'denied';
        } catch {
            // If checkPermissions is not available, assume camera is available
            return true;
        }
    }

    /**
     * Requests camera permissions
     * @returns Promise<boolean> indicating if permissions were granted
     */
    static async requestPermissions(): Promise<boolean> {
        try {
            const permissions = await Camera.requestPermissions();
            return permissions.camera === 'granted';
        } catch {
            // If requestPermissions fails, return false
            return false;
        }
    }
}
