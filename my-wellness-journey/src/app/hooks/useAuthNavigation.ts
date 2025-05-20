"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";

export const useAuthNavigation = () => {
	const router = useRouter();
	const { logout } = useAuthStore();

	const navigateToLogin = () => {
		router.push("/login");
	};

	const handleSignOut = async () => {
		try {
			// Call the logout API
			const response = await fetch("/api/auth/logout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${useAuthStore.getState().getToken()}`,
				},
			});

			if (!response.ok) {
				throw new Error("Logout API call failed");
			}

			// Clear client-side auth state regardless of API response
			logout();

			// Show success message
			toast.success("Successfully logged out");

			// Redirect to home page
			router.push("/");
		} catch (error) {
			console.error("Logout error:", error);

			// Show error message, but still logout on client side
			toast.error("Error during logout process");

			// Still logout on client side even if API call fails
			logout();
			router.push("/");
		}
	};

	return {
		navigateToLogin,
		handleSignOut,
	};
};
