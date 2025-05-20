import React, { useEffect } from "react";
import { FaTimes, FaLightbulb, FaRedo } from "react-icons/fa";
import TipCard from "./TipCard";
import { Loading } from "./Loading";
import { Tip } from "@/types/tip";
import { useTipOfDayStore } from "@/stores/tipOfTheDayStore";
import { useSavedStore } from "@/stores/savedStore";

// Types and Interfaces
interface TipOfTheDayProps {
	tip: Tip | null;
	isLoading: boolean;
	dismissed: boolean;
	onDismiss?: () => void;
	onReset?: () => void;
	onSaveToggle: (tipId: string) => void;
	onMarkDone?: (tipId: string) => void;
	savedTips: string[];
	allowDismiss?: boolean;
}

interface LoadingStateProps {
	message?: string;
}

interface DismissedStateProps {
	onReset: () => void;
}

interface ResetStateProps {
	onReset: () => void;
}

interface HeaderProps {
	allowDismiss: boolean;
	onDismiss?: () => void;
	onReset: () => void;
}

// Components
const LoadingState: React.FC<LoadingStateProps> = ({ message = "Loading your daily tip..." }) => (
	<div className="mb-12 max-w-2xl mx-auto text-center">
		<Loading />
		<p className="mt-4 text-primary-subheading">{message}</p>
	</div>
);

const DismissedState: React.FC<DismissedStateProps> = ({ onReset }) => (
	<div className="mb-12 p-6 max-w-2xl mx-auto bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
			<div className="flex items-center">
				<FaLightbulb className="text-primary-heading mr-3 h-5 w-5" />
				<p className="text-primary-subheading">Your daily wellness tip is hidden</p>
			</div>
			<div className="flex space-x-3">
				<button
					onClick={onReset}
					className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 transition-colors flex items-center"
				>
					<FaLightbulb className="mr-2 h-4 w-4" />
					Show Today's Tip
				</button>
			</div>
		</div>
	</div>
);

const ResetState: React.FC<ResetStateProps> = ({ onReset }) => (
	<div className="mb-12 p-6 max-w-2xl mx-auto bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm">
		<div className="flex flex-col items-center justify-center gap-4 text-center">
			<FaLightbulb className="text-yellow-500 h-8 w-8" />
			<p className="text-primary-body">
				Your tip of the day is using an old format and needs to be reset.
			</p>
			<button
				onClick={onReset}
				className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 transition-colors flex items-center"
			>
				<FaRedo className="mr-2 h-4 w-4" />
				Reset Tip of the Day
			</button>
		</div>
	</div>
);

const Header: React.FC<HeaderProps> = ({ allowDismiss, onDismiss, onReset }) => (
	<div className="flex justify-between items-center mb-4">
		<div className="flex items-center">
			<FaLightbulb className="text-primary-accent mr-2 h-4 w-4" />
			<h2 className="text-lg font-medium text-primary-heading">Today's Wellness Tip</h2>
		</div>
		{allowDismiss && (
			<div className="flex space-x-3">
				{onDismiss && (
					<button
						onClick={onDismiss}
						className="flex items-center text-primary-subheading hover:text-primary-accent transition-colors duration-200 text-sm"
					>
						<FaTimes className="mr-1 h-3 w-3" />
						Dismiss for today
					</button>
				)}
				<button
					onClick={onReset}
					className="flex items-center text-primary-subheading hover:text-red-500 transition-colors duration-200 text-sm"
				>
					<FaRedo className="mr-1 h-3 w-3" />
					Reset tip
				</button>
			</div>
		)}
	</div>
);

// Main Component
const TipOfTheDay: React.FC<TipOfTheDayProps> = ({
	tip,
	isLoading,
	dismissed,
	onDismiss,
	onReset,
	onSaveToggle,
	onMarkDone,
	savedTips,
	allowDismiss = false,
}) => {
	const { migrateTipIfNeeded, resetStore } = useTipOfDayStore();
	const { savedTips: currentSavedTips } = useSavedStore();

	useEffect(() => {
		if (tip && ("title" in tip || "content" in tip)) {
			migrateTipIfNeeded();
		}
	}, [tip, migrateTipIfNeeded]);

	const handleCompleteReset = () => {
		resetStore();
		onReset?.();
	};

	if (isLoading && !dismissed) {
		return <LoadingState />;
	}

	if (dismissed && onReset) {
		return <DismissedState onReset={onReset} />;
	}

	const hasOldFormat = tip && ("title" in tip || "content" in tip);
	if (hasOldFormat) {
		return <ResetState onReset={handleCompleteReset} />;
	}

	if (!tip) return null;

	const preparedTip = {
		...tip,
		saved: currentSavedTips.includes(tip.id) || tip.saved || false,
	};

	return (
		<section className="mb-12">
			<Header allowDismiss={allowDismiss} onDismiss={onDismiss} onReset={handleCompleteReset} />
			<div className="max-w-2xl mx-auto">
				<TipCard tip={preparedTip} onSaveToggle={onSaveToggle} onMarkDone={onMarkDone} />
			</div>
		</section>
	);
};

export default TipOfTheDay;
