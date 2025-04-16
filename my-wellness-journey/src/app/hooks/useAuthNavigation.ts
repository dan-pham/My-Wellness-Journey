"use client";

import { useRouter } from "next/navigation";

export const useAuthNavigation = () => {
	const router = useRouter();

	const navigateToLogin = () => {
		router.push("/login");
	};

	const handleSignOut = () => {
		console.log("Signing out...");
		router.push("/");
	};

	return {
		navigateToLogin,
		handleSignOut,
	};
};
