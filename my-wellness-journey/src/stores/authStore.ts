import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "../types/user";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	error: string | null;
	token: string | null;
	login: (user: User, token?: string) => void;
	logout: () => void;
	setError: (error: string | null) => void;
	setLoading: (loading: boolean) => void;
	getToken: () => string | null;
}

// Helper function to get token from storage
const getStoredToken = (): string | null => {
	if (typeof window === "undefined") return null;

	return localStorage.getItem("token") || sessionStorage.getItem("token");
};

// Helper to check if a token is valid (not expired)
const isTokenValid = (token: string): boolean => {
	try {
		// Decode JWT payload without verification
		const payload = JSON.parse(atob(token.split(".")[1]));

		// Check if token is expired
		const expiryTime = payload.exp * 1000; // Convert to milliseconds
		return Date.now() < expiryTime;
	} catch (error) {
		return false;
	}
};

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			isAuthenticated: false,
			loading: true,
			error: null,
			token: null,

			login: (user: User, token?: string) => {
				if (token) {
					// Store token in state
					set({ token });

					// Also ensure it's stored in localStorage
					if (typeof window !== "undefined") {
						localStorage.setItem("token", token);
					}
				}
				set({ user, isAuthenticated: true, error: null });
			},

			logout: () => {
				// Clear tokens from storage
				if (typeof window !== "undefined") {
					localStorage.removeItem("token");
					sessionStorage.removeItem("token");
				}
				set({ user: null, isAuthenticated: false, token: null });
			},

			setError: (error) => set({ error }),

			setLoading: (loading) => set({ loading }),

			// Function to get current token
			getToken: () => {
				// First check state
				const stateToken = get().token;
				if (stateToken) return stateToken;

				// Then check storage
				const storedToken = getStoredToken();
				if (storedToken && isTokenValid(storedToken)) {
					// Update state with token from storage
					set({ token: storedToken });
					return storedToken;
				}

				// If token is invalid or not found, ensure user is logged out
				if (get().isAuthenticated) {
					get().logout();
				}

				return null;
			},
		}),
		{
			name: "auth-storage", // unique name for localStorage key
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				user: state.user,
				isAuthenticated: state.isAuthenticated,
				token: state.token,
			}),
		}
	)
);

// Initialize auth state from stored token on app load
if (typeof window !== "undefined") {
	const storedToken = getStoredToken();
	if (storedToken && isTokenValid(storedToken)) {
		// Fetch user data with the token
		fetch("/api/user/profile", {
			headers: {
				Authorization: `Bearer ${storedToken}`,
			},
		})
			.then((res) => {
				if (res.ok) return res.json();
				return null;
			})
			.then((data) => {
				if (data.success && data.user) {
					useAuthStore.getState().login(data.user, storedToken);
				}
			})
			.catch(() => {
				// If token validation fails, logout
				useAuthStore.getState().logout();
			})
			.finally(() => {
				// Set loading to false
				useAuthStore.getState().setLoading(false);
			});
	} else {
		// No valid token, ensure logged out and set loading to false
		useAuthStore.getState().logout();
		useAuthStore.getState().setLoading(false);
	}
}
