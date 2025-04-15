import { FaTimes } from "react-icons/fa";
import NavItem from "./NavItem";
import Button from "./Button";

interface MobileMenuProps {
	isOpen: boolean;
	onClose: () => void;
	navItems: { label: string; href: string }[];
	isSelected: (href: string) => boolean;
	isSignedIn: boolean;
	onAuthClick: () => void;
}

const MobileMenu = ({
	isOpen,
	onClose,
	navItems,
	isSelected,
	isSignedIn,
	onAuthClick,
}: MobileMenuProps) => {
	return (
		<div
			className={`md:hidden fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
				isOpen ? "translate-x-0" : "translate-x-full"
			}`}
		>
			<div className="flex flex-col h-full p-6">
				<div className="flex justify-end mb-8">
					<button
						className="p-2 rounded-lg hover:bg-primary-accent/10"
						onClick={onClose}
						aria-label="Close menu"
					>
						<FaTimes className="w-6 h-6" color="#3A8C96" />
					</button>
				</div>
				<nav className="flex flex-col gap-6" role="navigation" aria-label="Mobile navigation">
					{navItems.map((item) => (
						<NavItem
							key={item.href}
							label={item.label}
							href={item.href}
							isSelected={isSelected(item.href)}
							className="text-2xl"
						/>
					))}
				</nav>
				<div className="mt-auto">
					<Button
						text={isSignedIn ? "Sign out" : "Get started"}
						onClick={onAuthClick}
						className="w-full"
					/>
				</div>
			</div>
		</div>
	);
};

export default MobileMenu;
