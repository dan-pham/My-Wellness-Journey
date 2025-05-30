import { FaTimes, FaSignOutAlt } from "react-icons/fa";
import NavItem from "./NavItem";
import Button from "./Button";

// Types and Interfaces
interface NavItemType {
	label: string;
	href: string;
}

interface MobileMenuProps {
	isOpen: boolean;
	onClose: () => void;
	navItems: NavItemType[];
	isSelected: (href: string) => boolean;
	isSignedIn: boolean;
	onAuthClick: () => void;
}

interface CloseButtonProps {
	onClose: () => void;
}

interface NavigationProps {
	items: NavItemType[];
	isSelected: (href: string) => boolean;
	onClose: () => void;
}

interface AuthButtonProps {
	isSignedIn: boolean;
	onAuthClick: () => void;
}

// Components
const CloseButton: React.FC<CloseButtonProps> = ({ onClose }) => (
	<div className="flex justify-end mb-8">
		<button
			className="p-2 rounded-lg hover:bg-primary-accent/10"
			onClick={onClose}
			aria-label="Close menu"
		>
			<FaTimes className="w-6 h-6" color="#3A8C96" />
		</button>
	</div>
);

const Navigation: React.FC<NavigationProps> = ({ items, isSelected, onClose }) => (
	<nav className="flex flex-col gap-6" role="navigation" aria-label="Mobile navigation">
		{items.map((item) => (
			<NavItem
				key={item.href}
				label={item.label}
				href={item.href}
				isSelected={isSelected(item.href)}
				className="text-2xl"
				onClick={onClose}
			/>
		))}
	</nav>
);

const AuthButton: React.FC<AuthButtonProps> = ({ isSignedIn, onAuthClick }) => (
	<div className="mt-auto">
		{isSignedIn ? (
			<button
				onClick={onAuthClick}
				className="flex items-center gap-2 w-full px-4 py-3 text-red-600 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition-colors duration-200"
			>
				<FaSignOutAlt className="w-5 h-5" />
				<span className="font-medium">Sign Out</span>
			</button>
		) : (
			<Button text="Get started" onClick={onAuthClick} className="w-full" />
		)}
	</div>
);

// Main Component
const MobileMenu: React.FC<MobileMenuProps> = ({
	isOpen,
	onClose,
	navItems,
	isSelected,
	isSignedIn,
	onAuthClick,
}) => {
	return (
		<div
			className={`md:hidden fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
				isOpen ? "translate-x-0" : "translate-x-full"
			}`}
		>
			<div className="flex flex-col h-full p-6">
				<CloseButton onClose={onClose} />
				<Navigation items={navItems} isSelected={isSelected} onClose={onClose} />
				<AuthButton isSignedIn={isSignedIn} onAuthClick={onAuthClick} />
			</div>
		</div>
	);
};

export default MobileMenu;
