"use client";

// Types and Interfaces
type LoadingSize = "sm" | "md" | "lg";
type LoadingVariant = "spinner" | "dots" | "pulse";

interface LoadingProps {
	size?: LoadingSize;
	variant?: LoadingVariant;
	overlay?: boolean;
	text?: string;
	className?: string;
}

// Utility Functions
const getSpinnerSize = (size: LoadingSize): string => {
	const sizes = {
		sm: "h-6 w-6",
		md: "h-12 w-12",
		lg: "h-16 w-16",
	};
	return sizes[size];
};

const getDotSize = (size: LoadingSize): string => {
	const sizes = {
		sm: "h-1.5 w-1.5",
		md: "h-2.5 w-2.5",
		lg: "h-3 w-3",
	};
	return sizes[size];
};

// Components
const Spinner: React.FC<{ size: LoadingSize }> = ({ size }) => (
	<div data-testid="loading-spinner" className="flex items-center justify-center">
		<div
			className={`animate-spin rounded-full ${
				size === "lg" ? "border-3" : "border-2"
			} border-primary-accent/20 ${getSpinnerSize(size)}`}
		/>
	</div>
);

const Dots: React.FC<{ size: LoadingSize }> = ({ size }) => (
	<div data-testid="loading-dots" className="flex space-x-1">
		{[0, 1, 2].map((i) => (
			<div
				key={i}
				className={`${getDotSize(size)} bg-primary-accent rounded-full animate-bounce`}
				style={{ animationDelay: `${i * 0.15}s` }}
			/>
		))}
	</div>
);

const Pulse: React.FC<{ size: LoadingSize }> = ({ size }) => (
	<div
		data-testid="loading-pulse"
		className={`${getSpinnerSize(size)} rounded-full bg-primary-accent/20 animate-pulse`}
	/>
);

// Main Component
export const Loading: React.FC<LoadingProps> = ({
	size = "md",
	variant = "spinner",
	overlay = false,
	text,
	className = "",
}) => {
	const LoadingComponent = {
		spinner: Spinner,
		dots: Dots,
		pulse: Pulse,
	}[variant];

	const content = (
		<div
			className={`flex flex-col items-center justify-center gap-4 ${
				overlay ? "h-full" : "h-64"
			} ${className}`}
		>
			<LoadingComponent size={size} />
			{text && <p className="text-primary-subheading animate-pulse">{text}</p>}
		</div>
	);

	if (overlay) {
		return (
			<div data-testid="loading-overlay" className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
				{content}
			</div>
		);
	}

	return content;
};
