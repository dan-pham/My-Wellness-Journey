import React from "react";
import Link from "next/link";

// Types and Interfaces
interface NavItemProps {
	label: string;
	href: string;
	isSelected: boolean;
	className?: string;
	onClick?: () => void;
}

interface UnderlineProps {
	isSelected: boolean;
}

interface HighlightProps {
	isSelected: boolean;
}

// Components
const Underline: React.FC<UnderlineProps> = ({ isSelected }) => (
	<div className="hidden md:block">
		{isSelected && (
			<div className="absolute bottom-[-2px] -left-1 w-[calc(100%+8px)] h-1 rounded-sm bg-primary-accent" />
		)}
	</div>
);

const Highlight: React.FC<HighlightProps> = ({ isSelected }) => (
	<div className="md:hidden">
		{isSelected && <div className="absolute inset-0 bg-primary-accent/10 rounded-full" />}
	</div>
);

// Utility Functions
const getNavItemStyles = (isSelected: boolean, className: string = ""): string => {
	const baseStyles = "text-xl transition-colors duration-200 py-3 px-4 block";
	const selectedStyles = isSelected
		? "text-primary-accent font-semibold"
		: "text-gray-600 hover:text-primary-accent";
	return `${className} ${selectedStyles} ${baseStyles}`;
};

// Main Component
const NavItem: React.FC<NavItemProps> = ({ label, href, isSelected, className = "", onClick }) => {
	return (
		<div className="relative group">
			<Link href={href} className={getNavItemStyles(isSelected, className)} onClick={onClick}>
				{label}
				<Underline isSelected={isSelected} />
				<Highlight isSelected={isSelected} />
			</Link>
		</div>
	);
};

export default NavItem;
