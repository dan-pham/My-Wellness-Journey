import { useAuthStore } from "../../stores/authStore";

export const checkAuthStatus = async () => {
	try {
		// Check if we have a token in storage or state
		const token = useAuthStore.getState().getToken();

		if (!token) {
			return {
				isAuthenticated: false,
				user: null,
			};
		}

		// Make the request to the dedicated auth check endpoint
		const response = await fetch("/api/auth/check", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (response.ok) {
			const data = await response.json();

			return {
				isAuthenticated: data.isAuthenticated,
				user: data.user,
			};
		}

		return {
			isAuthenticated: false,
			user: null,
		};
	} catch (error) {
		console.error("Auth check error:", error);
		return {
			isAuthenticated: false,
			user: null,
		};
	}
};
