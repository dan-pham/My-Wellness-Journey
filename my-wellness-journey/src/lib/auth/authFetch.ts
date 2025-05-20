import { useAuthStore } from "../../stores/authStore";

/**
 * Utility for making authenticated API requests
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
	// Get token from auth store
	const token = useAuthStore.getState().getToken();

	const headers = new Headers(options.headers || {});

	// Set content type if not already set
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}

	// Add authorization header if token exists
	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	// Create new options object with updated headers
	const updatedOptions = {
		...options,
		headers,
		// Ensure credentials are included in the request to send cookies
		credentials: 'include' as RequestCredentials,
	};

	const response = await fetch(url, updatedOptions);

	// Handle 401 unauthorized responses
	if (response.status === 401) {
		// Clear auth state
		useAuthStore.getState().logout();
	}

	return response;
};

/**
 * Generic error handler for API responses
 */
export const handleApiResponse = async (response: Response) => {
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));

		// Handle 401 Unauthorized by logging out
		if (response.status === 401) {
			useAuthStore.getState().logout();
		}

		throw {
			status: response.status,
			...errorData,
		};
	}

	return response.json();
};
