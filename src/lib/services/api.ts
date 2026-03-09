import { supabase } from './supabase';

const API_URL = import.meta.env.PUBLIC_API_URL || 'https://stamen.onrender.com/api';

interface FetchOptions extends RequestInit {
	skipAuth?: boolean;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
	const { skipAuth = false, headers: customHeaders, ...rest } = options;

	const headers = new Headers(customHeaders as HeadersInit);

	if (!headers.has('Content-Type') && !(rest.body instanceof FormData)) {
		headers.set('Content-Type', 'application/json');
	}

	if (!skipAuth) {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (session?.access_token) {
			headers.set('Authorization', `Bearer ${session.access_token}`);
		}
	}

	const response = await fetch(`${API_URL}${endpoint}`, {
		...rest,
		headers
	});

	if (!response.ok) {
		const errorBody = await response.json().catch(() => ({}));
		const error = new Error(
			errorBody.error || errorBody.detail || `Request failed: ${response.status}`
		);
		(error as any).status = response.status;
		(error as any).body = errorBody;
		throw error;
	}

	return response.json() as Promise<T>;
}
