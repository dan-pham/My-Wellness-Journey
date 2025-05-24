"use client";

import Button from "../components/Button";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthProvider from "../components/AuthProvider";
import { Loading } from "../components/Loading";
import HealthConditionsTab from "../components/profile/HealthConditionsTab";
import PersonalInfoTab from "../components/profile/PersonalInfoTab";
import AccountTab from "../components/profile/AccountTab";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileTabs } from "../components/profile/ProfileTabs";
import { useProfile } from "../hooks/useProfile";

export default function ProfilePage() {
	const {
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
	} = useProfile();

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
					<ProfileHeader />

					{/* Profile Tabs */}
					<ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

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
