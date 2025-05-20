"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/Button";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuthNavigation } from "../hooks/useAuthNavigation";
import AuthProvider from "../components/AuthProvider";
import { fetchWithAuth } from "../../lib/auth/authFetch";
import toast from "react-hot-toast";
import { Loading } from "../components/Loading";
import { useAuthStore } from "../../stores/authStore";

import HealthConditionsTab from "../components/profile/HealthConditionsTab";
import PersonalInfoTab from "../components/profile/PersonalInfoTab";
import AccountTab from "../components/profile/AccountTab";

export default function ProfilePage() {
	const { user } = useAuthStore();
	const router = useRouter();
	const { handleSignOut } = useAuthNavigation();

	const [activeTab, setActiveTab] = useState("health");
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// User profile state
	const [profile, setProfile] = useState<{
		firstName: string;
		lastName: string;
		dateOfBirth?: string;
		gender?: string;
		conditions?: Array<{ id: string; name: string }>;
		user?: {
			email: string;
		};
	} | null>(null);

	// Fetch user profile on component mount
	useEffect(() => {
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

		fetchUserProfile();
	}, [user?.email]);

	// Save profile changes
	const handleSaveProfile = async (profileData: any) => {
		setIsSaving(true);

		try {
			const response = await fetchWithAuth("/api/user/profile", {
				method: "PUT",
				body: JSON.stringify(profileData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update profile");
			}

			const data = await response.json();
			setProfile(data.profile);

			toast.success("Profile updated successfully");
		} catch (err) {
			console.error("Error updating profile:", err);
			toast.error("Failed to update profile. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	// Handle saving health conditions
	const handleSaveConditions = async (conditions: string[]) => {
		setIsSaving(true);

		try {
			// Convert conditions to expected format
			const formattedConditions = conditions.map((name) => ({
				id: name.toLowerCase().replace(/\s+/g, "-"),
				name,
			}));

			const payload = {
				...(profile || {}),
				conditions: formattedConditions,
			};

			const response = await fetchWithAuth("/api/user/profile", {
				method: "PUT",
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update conditions");
			}

			const data = await response.json();
			setProfile(data.profile);

			toast.success("Health conditions updated successfully");
		} catch (err) {
			console.error("Error updating conditions:", err);
			toast.error("Failed to update health conditions. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	// Handle email update
	const handleEmailUpdate = async (emailData: {
		currentEmail: string;
		newEmail: string;
		confirmEmail: string;
	}) => {
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

	// Handle password change
	const handlePasswordChange = async (passwordData: {
		currentPassword: string;
		newPassword: string;
		confirmPassword: string;
	}) => {
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
				body: JSON.stringify({
					password: password,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete account");
			}

			toast.success("Account deleted successfully");
			// Logout and redirect to homepage
			handleSignOut();
			router.push("/");
		} catch (err) {
			console.error("Delete account error:", err);
			const errorMessage = err instanceof Error 
				? err.message 
				: "An error occurred while deleting your account";
			toast.error(errorMessage);
		} finally {
			setIsDeletingAccount(false);
		}
	};

	if (isLoading) {
		return (
			<AuthProvider requireAuth={true} redirectTo="/login">
				<main className="min-h-screen w-full">
					<Header />
					<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12 flex justify-center items-center">
						<Loading />
					</div>
					<Footer />
				</main>
			</AuthProvider>
		);
	}

	if (error) {
		return (
			<AuthProvider requireAuth={true} redirectTo="/login">
				<main className="min-h-screen w-full">
					<Header />
					<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
						<div className="text-center">
							<h2 className="text-2xl font-semibold text-red-500 mb-4">Error</h2>
							<p className="text-gray-700 mb-6">{error}</p>
							<Button text="Try Again" onClick={() => window.location.reload()} />
						</div>
					</div>
					<Footer />
				</main>
			</AuthProvider>
		);
	}

	return (
		<AuthProvider requireAuth={true} redirectTo="/login">
			<main className="min-h-screen w-full">
				<Header />
				<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
					{/* Page Header */}
					<div className="mb-8">
						<h1 className="text-3xl md:text-4xl font-bold text-primary-heading mb-2">
							My Health Profile
						</h1>
						<p className="text-primary-subheading">Manage your conditions and account</p>
					</div>

					{/* Profile Tabs */}
					<div className="border-b border-gray-200 mb-8">
						<nav className="flex gap-8">
							{["health", "personal", "account"].map((tab) => (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={`pb-4 px-1 font-medium transition-colors duration-200 relative
										${
											activeTab === tab
												? "text-primary-accent"
												: "text-primary-subheading hover:text-primary-heading"
										}`}
								>
									{tab === "health" && "Health Conditions"}
									{tab === "personal" && "Personal Information"}
									{tab === "account" && "Account"}
									{activeTab === tab && (
										<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-accent" />
									)}
								</button>
							))}
						</nav>
					</div>

					{/* Content */}
					<div className="max-w-2xl mx-auto">
						{activeTab === "health" && profile && (
							<HealthConditionsTab
								initialConditions={profile.conditions || []}
								onSave={handleSaveConditions}
								isSaving={isSaving}
							/>
						)}

						{activeTab === "personal" && profile && (
							<PersonalInfoTab
								initialProfile={{
									firstName: profile.firstName,
									lastName: profile.lastName,
									dateOfBirth: profile.dateOfBirth,
									gender: profile.gender,
								}}
								onSave={handleSaveProfile}
								isSaving={isSaving}
							/>
						)}

						{activeTab === "account" && profile && (
							<AccountTab
								userEmail={profile.user?.email || ""}
								onUpdateEmail={handleEmailUpdate}
								onUpdatePassword={handlePasswordChange}
								onSignOut={handleSignOut}
								onDeleteAccount={handleDeleteAccount}
								isUpdatingEmail={isUpdatingEmail}
								isUpdatingPassword={isSaving}
								isDeletingAccount={isDeletingAccount}
							/>
						)}
					</div>
				</div>
				<Footer />
			</main>
		</AuthProvider>
	);
}
