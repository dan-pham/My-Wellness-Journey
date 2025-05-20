import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth/authFetch";

interface Profile {
	firstName: string;
	lastName: string;
	dateOfBirth?: string;
	gender?: string;
	conditions?: Array<{ id: string; name: string }>;
	savedResources?: Array<{ id: string; savedAt: string }>;
	savedTips?: Array<{ id: string; savedAt: string }>;
}

interface ErrorResponse {
	error: string;
	errors?: { [key: string]: string[] };
}

class ProfileError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ProfileError";
	}
}

export const useProfile = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);

	const fetchProfile = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetchWithAuth("/api/user/profile");

			if (!response.ok) {
				const errorData: ErrorResponse = await response.json();
				const errorMessage =
					errorData.error ||
					(errorData.errors
						? Object.values(errorData.errors).flat().join(", ")
						: "Failed to fetch profile");
				setError(errorMessage);
				return;
			}

			const data = await response.json();
			setProfile(data.profile);
		} catch (err) {
			console.error("Error loading profile:", err);
			setError(err instanceof Error ? err.message : "Failed to load profile data");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchProfile();
	}, []);

	return {
		profile,
		isLoading,
		error,
		refetchProfile: fetchProfile,
	};
};
