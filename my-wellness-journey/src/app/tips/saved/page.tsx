"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaSort } from "react-icons/fa";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import TipCard from "../../components/TipCard";
import { Loading } from "../../components/Loading";
import { Error } from "../../components/Error";
import { EmptyState } from "../../components/EmptyState";
import { useAuthStore } from "../../../stores/authStore";
import { useSavedStore } from "../../../stores/savedStore";
import AuthProvider from "../../components/AuthProvider";
import { useTipManagement } from "@/app/tips/hooks/useTipManagement";
import { TipSearch } from "@/app/tips/components/TipSearch";

// Types
interface SortControlsProps {
	sortOption: string;
	setSortOption: (option: "recent" | "oldest" | "title") => void;
}

interface ContentAreaProps {
	loading: boolean;
	error: string | null;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	filteredAndSortedTips: any[];
	handleSaveToggle: (tipId: string) => void;
	router: any;
}

// Components
const BackButton = ({ onClick }: { onClick: () => void }) => (
	<button
		onClick={onClick}
		className="flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors"
		aria-label="Go back"
	>
		<FaChevronLeft /> Back
	</button>
);

const PageTitle = () => (
	<h1 className="text-3xl font-bold text-primary-heading" data-testid="page-title">
		My Saved Tips
	</h1>
);

const SortControls = ({ sortOption, setSortOption }: SortControlsProps) => (
	<div className="flex items-center gap-2">
		<FaSort className="text-gray-400" />
		<select
			value={sortOption}
			onChange={(e) => setSortOption(e.target.value as "recent" | "oldest" | "title")}
			className="border-none bg-transparent focus:outline-none text-primary-subheading"
			aria-label="Sort tips"
		>
			<option value="recent">Most Recent</option>
			<option value="oldest">Oldest</option>
			<option value="title">Title (A-Z)</option>
		</select>
	</div>
);

const ContentArea = ({
	loading,
	error,
	searchQuery,
	setSearchQuery,
	filteredAndSortedTips,
	handleSaveToggle,
	router,
}: ContentAreaProps) => {
	if (loading) return <Loading />;
	if (error) return <Error message={error} />;

	if (filteredAndSortedTips.length === 0) {
		return (
			<EmptyState
				title="No Results"
				message={
					searchQuery ? "No tips match your search or filter." : "You haven't saved any tips yet."
				}
				actionText={searchQuery ? "Clear Filters" : "Explore Tips"}
				actionFn={() => {
					if (searchQuery) {
						setSearchQuery("");
					} else {
						router.push("/tips");
					}
				}}
			/>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{filteredAndSortedTips.map((tip) => (
				<TipCard key={tip.id} tip={tip} onSaveToggle={handleSaveToggle} />
			))}
		</div>
	);
};

const PageLayout = ({ children }: { children: React.ReactNode }) => (
	<main className="min-h-screen w-full">
		<Header />
		<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">{children}</div>
		<Footer />
	</main>
);

export default function SavedTipsPage() {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();
	const { savedTipsData, fetchSavedTips, removeTip, loading, error } = useSavedStore();

	// Load saved tips on mount only
	useEffect(() => {
		fetchSavedTips().catch((err) => {
			console.error("Error fetching saved tips:", err);
		});
	}, [fetchSavedTips]);

	const {
		tips: filteredAndSortedTips,
		searchQuery,
		setSearchQuery,
		sortOption,
		setSortOption,
		handleSearch,
		handleSaveToggle,
	} = useTipManagement({
		initialTips: savedTipsData,
		onSaveToggle: (tipId) => {
			removeTip(tipId);
		},
	});

	return (
		<AuthProvider>
			<PageLayout>
				{/* Header Section */}
				<div className="flex items-center gap-4 mb-8">
					<BackButton onClick={() => router.back()} />
					<PageTitle />
				</div>

				{/* Controls Section */}
				<div className="mb-8">
					<TipSearch
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
						onSearch={handleSearch}
						placeholder="Search in your saved tips..."
					/>
					<SortControls sortOption={sortOption} setSortOption={setSortOption} />
				</div>

				{/* Content Section */}
				<div className="min-h-[300px]">
					<ContentArea
						loading={loading}
						error={error}
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
						filteredAndSortedTips={filteredAndSortedTips}
						handleSaveToggle={handleSaveToggle}
						router={router}
					/>
				</div>
			</PageLayout>
		</AuthProvider>
	);
}
