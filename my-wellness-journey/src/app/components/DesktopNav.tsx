import NavItem from "./NavItem";

interface DesktopNavProps {
	navItems: { label: string; href: string }[];
	isSelected: (href: string) => boolean;
}

const DesktopNav = ({ navItems, isSelected }: DesktopNavProps) => {
	return (
		<nav
			className="hidden md:flex gap-6 md:gap-10 items-center"
			role="navigation"
			aria-label="Main navigation"
		>
			{navItems.map((item) => (
				<NavItem
					key={item.href}
					label={item.label}
					href={item.href}
					isSelected={isSelected(item.href)}
				/>
			))}
		</nav>
	);
};

export default DesktopNav;
