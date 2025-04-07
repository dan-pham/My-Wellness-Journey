import React from "react";

type NavItemProps = {
	label: string;
	href: string;
	isSelected?: boolean;
};

const NavItem: React.FC<NavItemProps> = ({ label, href, isSelected = false }) => {
	return (
		<a
			href={href}
			aria-current={isSelected ? "page" : undefined}
			className={`relative text-lg font-medium transition-all duration-200 ${
				isSelected
					? "text-primary-heading font-bold cursor-default"
					: "text-primary-heading hover:font-bold cursor-pointer"
			}`}
		>
			{label}
			{isSelected && (
				<div className="absolute bottom-[-5px] w-full h-0.5 rounded-sm bg-primary-accent" />
			)}
		</a>
	);
};

export default NavItem;
