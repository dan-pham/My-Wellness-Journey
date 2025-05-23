"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/authStore";
import { useAuthNavigation } from "./useAuthNavigation";
import { fetchWithAuth } from "../../lib/auth/authFetch";
import toast from "react-hot-toast";

interface HealthCondition {
	id: string;
	name: string;
}

interface UserProfile {
	firstName: string;
	lastName: string;
	dateOfBirth?: string;
	gender?: "" | "male" | "female" | "non-binary" | "prefer-not-to-say";
	conditions?: HealthCondition[];
	user?: {
		email: string;
	};
}

interface EmailUpdateData {
	currentEmail: string;
	newEmail: string;
	confirmEmail: string;
}

interface PasswordUpdateData {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

export const useProfile = () => {
	const { user } = useAuthStore();
	const router = useRouter();
	const { handleSignOut } = useAuthNavigation();

	const [activeTab, setActiveTab] = useState("health");
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [profile, setProfile] = useState<UserProfile | null>(null);

	const fetchUserProfile = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetchWithAuth("/api/user/profile");

			if (!response.ok) {
				throw new Error("Failed to fetch profile");
			}

			const data = await response.json();
			setProfile({
				...data.profile,
				user: {
					email: user?.email || "",
				},
			});
		} catch (err) {
			console.error("Error fetching profile:", err);
			setError("Failed to load profile data. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchUserProfile();
	}, [user?.email]);

	const handleSaveProfile = async (profileData: Partial<UserProfile>) => {
		setIsSaving(true);

		try {
			const { dateOfBirth } = profileData;

			if (dateOfBirth) {
				const dob = new Date(dateOfBirth);
				const now = new Date();

				// Check if DOB is in the future
				if (dob > now) {
					throw new Error("Date of birth cannot be in the future.");
				}

				// Check if DOB is more than 120 years ago
				const earliestValidDate = new Date();
				earliestValidDate.setFullYear(earliestValidDate.getFullYear() - 120);

				if (dob < earliestValidDate) {
					throw new Error("Date of birth must be within the last 120 years.");
				}
			}

			const payload = {
				firstName: profileData.firstName,
				lastName: profileData.lastName,
				dateOfBirth: profileData.dateOfBirth,
				gender: profileData.gender || "",
			};

			const response = await fetchWithAuth("/api/user/profile", {
				method: "PUT",
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error("handleSaveProfile - Error response:", errorData);
				throw new Error(errorData.error || "Failed to update profile");
			}

			const data = await response.json();

			setProfile((prev) => ({
				...prev!,
				...data.profile,
				user: prev?.user, // Preserve user data
			}));
			toast.success("Profile updated successfully");
		} catch (err) {
			console.error("handleSaveProfile - Error:", err);

			const errorMessage =
				err instanceof Error ? err.message : "Failed to update profile. Please try again.";

			toast.error(errorMessage);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSaveConditions = async (conditions: string[]) => {
		setIsSaving(true);

		try {
			const formattedConditions = conditions.map((name) => ({
				id: name.toLowerCase().replace(/\s+/g, "-"),
				name,
			}));

			const payload = {
				conditions: formattedConditions,
			};

			const response = await fetchWithAuth("/api/user/profile", {
				method: "PUT",
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error("handleSaveConditions - Error response:", errorData);
				throw new Error(errorData.error || "Failed to update conditions");
			}

			const data = await response.json();

			setProfile((prev) => ({
				...prev!,
				...data.profile,
				user: prev?.user, // Preserve user data
			}));
			toast.success("Health conditions updated successfully");
		} catch (err) {
			console.error("handleSaveConditions - Error:", err);
			toast.error("Failed to update health conditions. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleEmailUpdate = async (emailData: EmailUpdateData) => {
		if (emailData.newEmail !== emailData.confirmEmail) {
			toast.error("New email addresses do not match");
			return;
		}

		setIsUpdatingEmail(true);

		try {
			const response = await fetchWithAuth("/api/auth/email", {
				method: "PUT",
				body: JSON.stringify({
					currentEmail: emailData.currentEmail,
					newEmail: emailData.newEmail,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update email");
			}

			setProfile((prev) =>
				prev
					? {
							...prev,
							user: {
								...prev.user,
								email: emailData.newEmail,
							},
					  }
					: null
			);

			toast.success("Email update successful.");
		} catch (err) {
			console.error("Error updating email:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to update email. Please try again.";
			toast.error(errorMessage);
		} finally {
			setIsUpdatingEmail(false);
		}
	};

	const handlePasswordChange = async (passwordData: PasswordUpdateData) => {
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		setIsSaving(true);

		try {
			const response = await fetchWithAuth("/api/auth/password", {
				method: "PUT",
				body: JSON.stringify({
					currentPassword: passwordData.currentPassword,
					newPassword: passwordData.newPassword,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update password");
			}

			toast.success("Password updated successfully");
		} catch (err) {
			console.error("Error updating password:", err);
			toast.error("Failed to update password. Please check your current password and try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteAccount = async (password: string) => {
		setIsDeletingAccount(true);

		try {
			const response = await fetchWithAuth("/api/user/delete", {
				method: "DELETE",
				body: JSON.stringify({ password }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete account");
			}

			toast.success("Account deleted successfully");
			handleSignOut();
			router.push("/");
		} catch (err) {
			console.error("Delete account error:", err);
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred while deleting your account";
			toast.error(errorMessage);
		} finally {
			setIsDeletingAccount(false);
		}
	};

	return {
		profile,
		activeTab,
		setActiveTab,
		isLoading,
		isSaving,
		isUpdatingEmail,
		isDeletingAccount,
		error,
		handleSaveProfile,
		handleSaveConditions,
		handleEmailUpdate,
		handlePasswordChange,
		handleDeleteAccount,
		handleSignOut,
	};
};
