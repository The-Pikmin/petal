import { supabase } from "./supabase";
import { PUBLIC_API_URL } from "$env/static/public";
import type { ApiError } from "$lib/types/api.types";

const API_URL = PUBLIC_API_URL || "https://stamen.onrender.com/api";

interface FetchOptions extends RequestInit {
	skipAuth?: boolean;
}

export class ApiRequestError extends Error {
	status: number;
	body: ApiError;

	constructor(message: string, status: number, body: ApiError = {}) {
		super(message);
		this.name = "ApiRequestError";
		this.status = status;
		this.body = body;
	}
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
	const { skipAuth = false, headers: customHeaders, ...rest } = options;

	const headers = new Headers(customHeaders as HeadersInit);

	if (!headers.has("Content-Type") && !(rest.body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}

	if (!skipAuth) {
		let {
			data: { session },
		} = await supabase.auth.getSession();

		// Proactively refresh if token expires within 60s
		if (session?.expires_at && session.expires_at * 1000 - Date.now() < 60_000) {
			const { data } = await supabase.auth.refreshSession();
			session = data.session;
		}

		if (session?.access_token) {
			headers.set("Authorization", `Bearer ${session.access_token}`);
		}
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 30_000);

	let response: Response;
	try {
		response = await fetch(`${API_URL}${endpoint}`, {
			...rest,
			headers,
			signal: controller.signal,
		});
	} catch (err) {
		clearTimeout(timeoutId);
		if (err instanceof DOMException && err.name === "AbortError") {
			throw new ApiRequestError("Request timed out. Please try again.", 0);
		}
		throw new ApiRequestError("Network error. Check your connection and try again.", 0);
	}
	clearTimeout(timeoutId);

	// Retry once on 401 after forcing a token refresh
	if (response.status === 401 && !skipAuth) {
		const { data } = await supabase.auth.refreshSession();
		if (data.session?.access_token) {
			headers.set("Authorization", `Bearer ${data.session.access_token}`);
			response = await fetch(`${API_URL}${endpoint}`, { ...rest, headers });
		}
	}

	if (!response.ok) {
		const errorBody = (await response.json().catch(() => ({}))) as ApiError;
		throw new ApiRequestError(
			errorBody.error || errorBody.detail || `Request failed: ${response.status}`,
			response.status,
			errorBody
		);
	}

	if (response.status === 204 || response.headers.get("content-length") === "0") {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}
