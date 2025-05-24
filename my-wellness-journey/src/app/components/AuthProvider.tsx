"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/authStore";
import { Loading } from "./Loading";

interface AuthProviderProps {
	children: ReactNode;
	requireAuth?: boolean;
	redirectTo?: string;
}

export default function AuthProvider({
	children,
	requireAuth = false,
	redirectTo = "/login",
}: AuthProviderProps) {
	const router = useRouter();
	const [isChecking, setIsChecking] = useState(true);
	const { isAuthenticated, loading } = useAuthStore();

	useEffect(() => {
		// Wait for auth store to initialize
		if (!loading) {
			if (requireAuth && !isAuthenticated) {
				router.push(redirectTo);
			}
			setIsChecking(false);
		}
	}, [isAuthenticated, loading, requireAuth, redirectTo, router]);

	// Show loading state while checking authentication
	if (loading || isChecking) {
		return <Loading />;
	}

	// Only render protected content if authenticated or not required
	if (requireAuth && !isAuthenticated) {
		return null;
	}

	return <>{children}</>;
}
