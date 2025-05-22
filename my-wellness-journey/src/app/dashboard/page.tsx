"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import toast from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ResourceCard from "../components/ResourceCard";
import { fetchWithAuth } from "../../lib/auth/authFetch";
import { Loading } from "../components/Loading";
import AuthProvider from "../components/AuthProvider";
import { useTipOfDayStore } from "../../stores/tipOfTheDayStore";
import { useSavedStore } from "../../stores/savedStore";
import { useResourceHistoryStore } from "../../stores/resourceHistoryStore";
import { EmptyState } from "../components/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { Resource } from "@/types/resource";
import { Tip } from "@/types/tip";
import TipOfTheDay from "../components/TipOfTheDay";
import RecommendedResources from "../components/RecommendedResources";
import { Error } from "../components/Error";

// Define types for our data
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

type ApiError = {
	message: string;
	status?: number;
};

export default function DashboardPage() {
	const router = useRouter();

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [profile, setProfile] = useState<Profile | null>(null);

	const { isAuthenticated } = useAuthStore();

	// Tip of the day state from Zustand store
	const {
		tip: dailyTip,
		dismissed,
		isLoading: tipLoading,
		error: tipError,
		fetchTipOfDay,
		dismissForToday,
		showTip,
		migrateTipIfNeeded,
	} = useTipOfDayStore();

	// Saved items state
	const {
		savedTips,
		savedResources,
		addTip,
		removeTip,
		addResource,
		removeResource,
		savedResourcesData,
		fetchSavedResources,
		fetchSavedTips,
	} = useSavedStore();

	// Recently viewed resources state
	const { history: recentlyViewedResources } = useResourceHistoryStore();

	// State for done tips
	const [doneTips, setDoneTips] = useState<string[]>([]);

	// State to force re-render when savedTips changes
	const [savedTipsKey, setSavedTipsKey] = useState(0);

	// Fetch saved resources and tips when the component mounts or auth state changes
	useEffect(() => {
		if (isAuthenticated) {
			fetchSavedResources();
			fetchSavedTips();
		}
	}, [isAuthenticated, fetchSavedResources, fetchSavedTips]);

	// Update savedTipsKey when savedTips changes to force re-render
	useEffect(() => {
		setSavedTipsKey((prev) => prev + 1);
	}, [savedTips]);

	// Load done tips from localStorage
	useEffect(() => {
		const storedDoneTips = localStorage.getItem("doneTips");
		if (storedDoneTips) {
			setDoneTips(JSON.parse(storedDoneTips));
		}
	}, []);

	// Fetch profile data
	useEffect(() => {
		const fetchProfileData = async () => {
			setIsLoading(true);
			setError("");

			try {
				// Get auth token to ensure we're authenticated
				const token = useAuthStore.getState().getToken();
				if (!token) {
					console.error("No auth token available");
					setError("Authentication error. Please log in again.");
					return;
				}

				// Fetch user profile
				const profileResponse = await fetchWithAuth("/api/user/profile");

				// Handle API errors gracefully
				if (!profileResponse.ok) {
					// If profile doesn't exist yet, show helpful message instead of error
					if (profileResponse.status === 404) {
						console.log("Profile not found, user may be new");
						const currentUser = useAuthStore.getState().user;
						setProfile({
							firstName: currentUser?.email?.split("@")[0] || "User",
							lastName: "",
							conditions: [],
							savedResources: [],
							savedTips: [],
						});
						setIsLoading(false);
						return;
					}

					const errorData: ErrorResponse = await profileResponse.json();
					setError(errorData.error || "Failed to fetch profile");
					return;
				}

				const profileData = await profileResponse.json();
				setProfile(profileData.profile);
			} catch (error) {
				console.error("Error loading dashboard:", error);
				const apiError = error as ApiError;
				setError(apiError?.message || "Failed to load dashboard data");
			} finally {
				setIsLoading(false);
			}
		};

		fetchProfileData();
	}, []);

	// Fetch tip of the day
	useEffect(() => {
		fetchTipOfDay();
		// Try to migrate the tip if needed
		if (dailyTip && ("title" in dailyTip || "content" in dailyTip)) {
			migrateTipIfNeeded();
		}
	}, [fetchTipOfDay, dailyTip, migrateTipIfNeeded]);

	// Prepare the tip with saved and done states
	const preparedTip = dailyTip
		? {
				...dailyTip,
				saved: savedTips.includes(dailyTip.id),
				done: doneTips.includes(dailyTip.id),
		  }
		: null;

	// Handle saving/unsaving a tip
	const handleSaveTip = (tipId: string) => {
		if (!dailyTip) return;

		const isCurrentlySaved = savedTips.includes(tipId);

		try {
			if (isCurrentlySaved) {
				// Call the store function to remove the tip
				removeTip(tipId);
				toast.success("Tip removed from saved", {
					duration: 2000,
					position: "bottom-center",
				});
			} else {
				// Call the store function to add the tip
				addTip(tipId, dailyTip);
				toast.success("Tip saved", {
					duration: 2000,
					position: "bottom-center",
				});
			}

			// Force a re-render
			setSavedTipsKey((prev) => prev + 1);
		} catch (error) {
			console.error("Error toggling save status:", error);
			toast.error("Failed to update saved status");
		}
	};

	// Handle dismissing the tip for today
	const handleDismissTip = () => {
		dismissForToday();
		toast.success("Tip dismissed for today");
	};

	// Handle showing the tip again
	const handleShowTip = () => {
		showTip();
		toast.success("Showing today's tip");
	};

	// Handle marking a tip as done
	const handleMarkDone = (tipId: string) => {
		const updatedDoneTips = [...doneTips, tipId];
		setDoneTips(updatedDoneTips);
		localStorage.setItem("doneTips", JSON.stringify(updatedDoneTips));
		toast.success("Tip marked as done");
	};

	// Handle saving/unsaving a resource
	const handleSaveResource = async (resource: Resource) => {
		const isCurrentlySaved = savedResources.includes(resource.id);

		try {
			if (isCurrentlySaved) {
				removeResource(resource.id);
				toast.success("Resource removed from saved");
			} else {
				addResource(resource.id, resource);
				toast.success("Resource saved");
			}
		} catch (error) {
			console.error("Error toggling resource save status:", error);
			toast.error("Failed to update saved status");
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<Loading />
				<Footer />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<div className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h2 className="text-2xl font-bold text-error mb-4">Something went wrong</h2>
						<p className="text-gray-600">{error}</p>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	// Define greeting based on time of day
	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 18) return "Good afternoon";
		return "Good evening";
	};

	const savedResourcesKey = savedResources.join(",");

	return (
		<AuthProvider requireAuth={true} redirectTo="/login">
			<main className="min-h-screen w-full">
				<Header />
				<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
					{isLoading ? (
						<Loading overlay text="Loading your dashboard..." />
					) : error ? (
						<Error
							title="Failed to load dashboard"
							message={error}
							variant="error"
							retryable={true}
							onRetry={() => window.location.reload()}
						/>
					) : (
						<>
							{/* Greeting Section */}
							<h1 className="text-3xl md:text-4xl font-bold text-primary-heading mb-4">
								{getGreeting()}, {profile?.firstName || "User"}
							</h1>

							{/* Daily Tip Card Section */}
							{tipLoading ? (
								<Loading text="Loading your daily tip..." />
							) : tipError ? (
								<Error
									title="Failed to load tip"
									message={tipError}
									variant="warning"
									retryable={true}
									onRetry={fetchTipOfDay}
								/>
							) : (
								<TipOfTheDay
									key={`tip-of-day-${savedTipsKey}`}
									tip={preparedTip}
									isLoading={tipLoading}
									dismissed={dismissed}
									onDismiss={handleDismissTip}
									onSaveToggle={handleSaveTip}
									onMarkDone={handleMarkDone}
									savedTips={savedTips}
									allowDismiss={true}
								/>
							)}

							{/* Resources Based on Health Profile */}
							<RecommendedResources />

							{/* Recently Viewed Resources */}
							{isAuthenticated && (
								<section className="mb-16">
									<div className="flex items-center justify-between mb-8">
										<h2 className="text-2xl font-semibold text-primary-heading">
											Recently Viewed Resources
										</h2>
										<Link
											href="/resources"
											className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
										>
											View All Resources <FaArrowRight className="w-4 h-4" />
										</Link>
									</div>

									{recentlyViewedResources.length === 0 ? (
										<EmptyState
											title="No Recent Activity"
											message="You haven't viewed any resources yet"
											actionLabel="Explore Resources"
											actionUrl="/resources"
										/>
									) : (
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
											{recentlyViewedResources.slice(0, 3).map((resource) => (
												<ResourceCard
													key={resource.id}
													id={resource.id}
													title={resource.title}
													description={resource.description}
													imageUrl={resource.imageUrl}
													sourceUrl={resource.sourceUrl}
													isSaved={savedResources.includes(resource.id)}
													onSaveToggle={() => handleSaveResource(resource)}
												/>
											))}
										</div>
									)}
								</section>
							)}
						</>
					)}
				</div>
				<Footer />
			</main>
		</AuthProvider>
	);
}
