"use client";

import { useState, useEffect, useRef } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import Button from "../Button";
import { levenshteinDistance } from "@/utils/stringUtils";
import { useRecommendedResourcesStore } from "@/stores/recommendedResourcesStore";

// Types and Interfaces
interface HealthCondition {
	id: string;
	name: string;
}

interface HealthConditionsTabProps {
	initialConditions: HealthCondition[];
	onSave: (conditions: string[]) => Promise<void>;
	isSaving: boolean;
}

interface ConditionInputProps {
	value: string;
	onChange: (value: string) => void;
	onAdd: () => void;
	suggestions: string[];
	showSuggestions: boolean;
	onSuggestionClick: (suggestion: string) => void;
	suggestionsRef: React.RefObject<HTMLDivElement>;
}

interface ConditionTagProps {
	condition: string;
	onRemove: (condition: string) => void;
}

interface CommonConditionButtonProps {
	condition: string;
	onClick: () => void;
}

// Constants
const COMMON_CONDITIONS = [
	"Hypertension",
	"Type 2 Diabetes",
	"Osteoarthritis",
	"Chronic Obstructive Pulmonary Disease (COPD)",
	"Sleep Apnea",
	"Depression",
	"Gastroesophageal Reflux Disease (GERD)",
	"Obesity",
	"Asthma",
	"Heart Disease",
	"High Cholesterol",
	"Arthritis",
	"Allergies",
	"Hypothyroidism",
	"Anxiety",
	"Chronic Kidney Disease",
	"Irritable Bowel Syndrome (IBS)",
	"Migraine",
	"Osteoporosis",
	"Fibromyalgia",
] as const;

// Components
const ConditionInput: React.FC<ConditionInputProps> = ({
	value,
	onChange,
	onAdd,
	suggestions,
	showSuggestions,
	onSuggestionClick,
	suggestionsRef,
}) => (
	<div className="relative">
		<div className="flex gap-2 mb-2">
			<input
				type="text"
				placeholder="Add a condition"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => value.length >= 3 && showSuggestions}
				className="flex-1 px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
			/>
			<Button text="Add" onClick={onAdd} className="!px-6" />
		</div>

		{showSuggestions && (
			<div
				ref={suggestionsRef}
				className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto"
			>
				{suggestions.length > 0 ? (
					<ul>
						{suggestions.map((suggestion, index) => (
							<li
								key={index}
								onClick={() => onSuggestionClick(suggestion)}
								className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary-heading"
							>
								{suggestion}
							</li>
						))}
					</ul>
				) : (
					<div className="px-4 py-2 text-gray-500">No suggestions</div>
				)}
			</div>
		)}
	</div>
);

const ConditionTag: React.FC<ConditionTagProps> = ({ condition, onRemove }) => (
	<div className="flex items-center gap-2 px-3 py-1.5 bg-primary-accent/10 text-primary-accent rounded-full text-sm">
		{condition}
		<button
			onClick={() => onRemove(condition)}
			className="hover:text-primary-heading transition-colors duration-200"
		>
			<FaTimes className="w-3 h-3" />
		</button>
	</div>
);

const CommonConditionButton: React.FC<CommonConditionButtonProps> = ({ condition, onClick }) => (
	<button
		onClick={onClick}
		className="flex items-center gap-1 px-3 py-1.5 border border-primary-accent/30 text-primary-accent rounded-full text-sm hover:bg-primary-accent/10 transition-all duration-200 truncate"
		title={condition}
	>
		<FaPlus className="w-3 h-3 flex-shrink-0" />
		<span className="truncate">{condition}</span>
	</button>
);

// Main Component
export default function HealthConditionsTab({
	initialConditions,
	onSave,
	isSaving,
}: HealthConditionsTabProps) {
	const [conditions, setConditions] = useState<string[]>(
		initialConditions.map((c) => c.name) || []
	);
	const [newCondition, setNewCondition] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const { forceRefresh } = useRecommendedResourcesStore();

	// Handle clicks outside suggestions
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Update conditions when initialConditions change
	useEffect(() => {
		setConditions(initialConditions.map((c) => c.name) || []);
	}, [initialConditions]);

	// Spellcheck and suggest corrections
	useEffect(() => {
		if (newCondition.trim().length < 2) {
			setSuggestions([]);
			setShowSuggestions(false);
			return;
		}

		const prefixMatches = COMMON_CONDITIONS.filter(
			(condition) =>
				condition.toLowerCase().includes(newCondition.toLowerCase()) &&
				!conditions.some((c) => c.toLowerCase() === condition.toLowerCase())
		);

		const spellingMatches = COMMON_CONDITIONS.filter((condition) => {
			if (
				condition.toLowerCase() === newCondition.toLowerCase() ||
				conditions.some((c) => c.toLowerCase() === condition.toLowerCase()) ||
				prefixMatches.includes(condition)
			) {
				return false;
			}

			const distance = levenshteinDistance(newCondition.toLowerCase(), condition.toLowerCase());
			return distance <= Math.max(2, Math.floor(condition.length / 5));
		});

		const allSuggestions = [...prefixMatches, ...spellingMatches].slice(0, 5);
		setSuggestions(allSuggestions);
		setShowSuggestions(allSuggestions.length > 0);
	}, [newCondition, conditions]);

	const handleAddCondition = () => {
		if (newCondition && !conditions.some((c) => c.toLowerCase() === newCondition.toLowerCase())) {
			setConditions([...conditions, newCondition]);
			setNewCondition("");
			setShowSuggestions(false);
		}
	};

	const handleRemoveCondition = (condition: string) => {
		setConditions(conditions.filter((c) => c !== condition));
	};

	const handleSuggestionClick = (suggestion: string) => {
		setNewCondition(suggestion);
		setShowSuggestions(false);
	};

	const handleSaveConditions = async () => {
		await onSave(conditions);
		// Force a refresh of recommended resources
		forceRefresh();
	};

	return (
		<div className="space-y-8">
			<div>
				<h3 className="text-xl font-semibold text-primary-heading mb-4">My Conditions</h3>

				<ConditionInput
					value={newCondition}
					onChange={setNewCondition}
					onAdd={handleAddCondition}
					suggestions={suggestions}
					showSuggestions={showSuggestions}
					onSuggestionClick={handleSuggestionClick}
					suggestionsRef={suggestionsRef}
				/>

				<div className="flex flex-wrap gap-2 mb-8 min-h-[40px]">
					{conditions.map((condition) => (
						<ConditionTag key={condition} condition={condition} onRemove={handleRemoveCondition} />
					))}
				</div>
			</div>

			<div>
				<h3 className="text-xl font-semibold text-primary-heading mb-4">Common Conditions</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-2 min-h-[120px]">
					{COMMON_CONDITIONS.map(
						(condition) =>
							!conditions.some((c) => c.toLowerCase() === condition.toLowerCase()) && (
								<CommonConditionButton
									key={condition}
									condition={condition}
									onClick={() => setConditions([...conditions, condition])}
								/>
							)
					)}
				</div>
			</div>

			<div className="flex justify-end">
				<Button
					text={isSaving ? "Saving..." : "Save Changes"}
					onClick={handleSaveConditions}
					disabled={isSaving}
				/>
			</div>
		</div>
	);
}
