import React from "react";

type NavItemProps = {
	label: string;
	href: string;
	isSelected: boolean;
	className?: string;
};

const NavItem = ({ label, href, isSelected, className = "" }: NavItemProps) => {
	return (
		<div className="relative group">
			<a
				href={href}
				className={`${className} ${
					isSelected
						? "text-xl text-primary-accent font-semibold"
						: "text-xl text-gray-600 hover:text-primary-accent"
				} transition-colors duration-200 py-3 px-4 block`}
			>
				{label}

				{/* Desktop underline */}
				<div className="hidden md:block">
					{isSelected && (
						<div className="absolute bottom-[-5px] -left-2 w-[calc(100%+16px)] h-1 rounded-sm bg-primary-accent" />
					)}
				</div>

				{/* Mobile highlight */}
				<div className="md:hidden">
					{isSelected && <div className="absolute inset-0 bg-primary-accent/10 rounded-full" />}
				</div>
			</a>
		</div>
	);
};

export default NavItem;
