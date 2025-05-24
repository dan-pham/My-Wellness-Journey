"use client";

import { FaExclamationTriangle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";
import Button from "./Button";

// Types and Interfaces
type ErrorVariant = "error" | "warning" | "info";

interface ErrorProps {
	title?: string;
	message: string;
	variant?: ErrorVariant;
	retryable?: boolean;
	onRetry?: () => void;
	className?: string;
}

// Utility Functions
const getErrorStyles = (
	variant: ErrorVariant
): { bg: string; text: string; icon: React.ReactNode } => {
	const styles = {
		error: {
			bg: "bg-red-50",
			text: "text-red-700",
			icon: <FaTimesCircle className="w-8 h-8 text-red-500" />,
		},
		warning: {
			bg: "bg-yellow-50",
			text: "text-yellow-700",
			icon: <FaExclamationTriangle className="w-8 h-8 text-yellow-500" />,
		},
		info: {
			bg: "bg-blue-50",
			text: "text-blue-700",
			icon: <FaInfoCircle className="w-8 h-8 text-blue-500" />,
		},
	};
	return styles[variant];
};

// Main Component
export const Error: React.FC<ErrorProps> = ({
	title,
	message,
	variant = "error",
	retryable = true,
	onRetry,
	className = "",
}) => {
	const styles = getErrorStyles(variant);
	const defaultTitle = variant.charAt(0).toUpperCase() + variant.slice(1);

	const handleRetry = () => {
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	};

	return (
		<div
			className={`flex items-center justify-center h-64 ${styles.bg} ${styles.text} p-6 rounded-lg ${className}`}
		>
			<div className="text-center">
				<div className="flex justify-center mb-4">{styles.icon}</div>
				<p className="text-lg font-semibold">{title || defaultTitle}</p>
				<p className="mt-2 text-sm opacity-90">{message}</p>
				{retryable && (
					<div className="mt-4">
						<Button text="Try Again" onClick={handleRetry} variant="danger" size="sm" />
					</div>
				)}
			</div>
		</div>
	);
};
