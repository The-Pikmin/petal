import { apiFetch } from "$lib/services/api";
import type { ApiUser, ApiUserSettings } from "$lib/types/api.types";

export interface ProfileUpdatePayload {
	username?: string;
	display_name?: string;
}

export async function getCurrentUserProfile(): Promise<ApiUser> {
	return apiFetch<ApiUser>("/me/");
}

export async function updateUserProfile(payload: ProfileUpdatePayload): Promise<ApiUser> {
	return apiFetch<ApiUser>("/me/profile/", {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
}

export async function updateUserSettings(
	payload: Partial<ApiUserSettings>
): Promise<ApiUserSettings> {
	return apiFetch<ApiUserSettings>("/me/settings/", {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
}

export async function uploadUserAvatar(file: File): Promise<ApiUser> {
	const formData = new FormData();
	formData.append("image", file);
	return apiFetch<ApiUser>("/me/avatar/", {
		method: "POST",
		body: formData,
	});
}

export async function deleteUserAvatar(): Promise<void> {
	return apiFetch<void>("/me/avatar/", {
		method: "DELETE",
	});
}
