"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";

const LOGOUT_API_ENDPOINT = "/api/auth/logout";

export const useAuthNavigation = () => {
	const router = useRouter();
	const { logout } = useAuthStore();

	const getAuthHeaders = () => ({
		"Content-Type": "application/json",
		Authorization: `Bearer ${useAuthStore.getState().getToken()}`,
	});

	const callLogoutAPI = async () => {
		const response = await fetch(LOGOUT_API_ENDPOINT, {
			method: "POST",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error("Logout API call failed");
		}
	};

	const handleLogoutError = (error: unknown) => {
		console.error("Logout error:", error);
		toast.error("Error during logout process");
		// Still perform client-side logout even if API call fails
		performClientSideLogout();
	};

	const performClientSideLogout = () => {
		logout();
		router.push("/");
	};

	const navigateToLogin = () => {
		router.push("/login");
	};

	const handleSignOut = async () => {
		try {
			await callLogoutAPI();
			performClientSideLogout();
			toast.success("Successfully logged out");
		} catch (error) {
			handleLogoutError(error);
		}
	};

	return {
		navigateToLogin,
		handleSignOut,
	};
};
