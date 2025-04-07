import React from "react";

interface ButtonProps {
	text: string;
	icon?: React.ReactNode;
	onClick?: () => void;
	className?: string;
	type?: "button" | "submit" | "reset";
	disabled?: boolean;
}

const Button = ({
	text,
	icon,
	onClick,
	className = "",
	type = "button",
	disabled = false,
}: ButtonProps) => {
	return (
		<button
			onClick={onClick}
			type={type}
			disabled={disabled}
			className={`px-6 py-3.5 text-lg font-medium text-white bg-primary-accent rounded-full shadow-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
		>
			{icon && <span className="ml-2">{icon}</span>}
			{text}
		</button>
	);
};

export default Button;
