import React from "react";
import Link from "next/link";

type NavItemProps = {
	label: string;
	href: string;
	isSelected: boolean;
	className?: string;
	onClick?: () => void;
};

const NavItem = ({ label, href, isSelected, className = "", onClick }: NavItemProps) => {
	return (
		<div className="relative group">
			<Link
				href={href}
				className={`${className} ${
					isSelected
						? "text-xl text-primary-accent font-semibold"
						: "text-xl text-gray-600 hover:text-primary-accent"
				} transition-colors duration-200 py-3 px-4 block`}
				onClick={onClick}
			>
				{label}

				{/* Desktop underline */}
				<div className="hidden md:block">
					{isSelected && (
						<div className="absolute bottom-[-2px] -left-1 w-[calc(100%+8px)] h-1 rounded-sm bg-primary-accent" />
					)}
				</div>

				{/* Mobile highlight */}
				<div className="md:hidden">
					{isSelected && <div className="absolute inset-0 bg-primary-accent/10 rounded-full" />}
				</div>
			</Link>
		</div>
	);
};

export default NavItem;
