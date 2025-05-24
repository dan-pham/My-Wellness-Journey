import React from "react";

// Types and Interfaces
type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
	text: string;
	icon?: React.ReactNode;
	onClick?: ((e?: React.MouseEvent<HTMLButtonElement>) => void) | (() => void);
	className?: string;
	type?: "button" | "submit" | "reset";
	disabled?: boolean;
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
}

// Utility Functions
const getButtonStyles = (
	variant: ButtonVariant = "primary",
	size: ButtonSize = "md",
	fullWidth = false,
	className = ""
): string => {
	const baseStyles =
		"font-medium rounded-full shadow-sm transition-all duration-200 flex items-center justify-center gap-2";
	const hoverStyles =
		"hover:transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:scale-100";

	const variantStyles = {
		primary: "text-white bg-primary-accent hover:bg-primary-accent/90",
		secondary: "text-primary-accent bg-primary-accent/10 hover:bg-primary-accent/20",
		outline:
			"text-primary-accent border-2 border-primary-accent bg-transparent hover:bg-primary-accent/10",
		danger: "text-white bg-red-500 hover:bg-red-600",
	};

	const sizeStyles = {
		sm: "px-4 py-2 text-sm",
		md: "px-6 py-3.5 text-base",
		lg: "px-8 py-4 text-lg",
	};

	const widthStyle = fullWidth ? "w-full" : "";

	return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${hoverStyles} ${widthStyle} ${className}`;
};

// Main Component
const Button: React.FC<ButtonProps> = ({
	text,
	icon,
	onClick,
	className = "",
	type = "button",
	disabled = false,
	variant = "primary",
	size = "md",
	fullWidth = false,
}) => {
	return (
		<button
			onClick={onClick}
			type={type}
			disabled={disabled}
			className={getButtonStyles(variant, size, fullWidth, className)}
		>
			{icon}
			<span>{text}</span>
		</button>
	);
};

export default Button;
