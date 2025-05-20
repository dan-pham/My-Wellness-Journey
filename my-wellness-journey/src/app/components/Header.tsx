"use client";
import { FaBars, FaUserCircle } from "react-icons/fa";
import Button from "./Button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import { useAuthNavigation } from "../hooks/useAuthNavigation";
import PageGradient from "./PageGradient";
import { useUIStore } from "../../stores/uiStore";
import { useAuthStore } from "../../stores/authStore";

// Types and Interfaces
interface NavItem {
	label: string;
	href: string;
}

interface LogoProps {
	isAuthenticated: boolean;
}

interface AuthButtonsProps {
	isAuthenticated: boolean;
	onAuthClick: () => void;
}

// Components
const Logo: React.FC<LogoProps> = ({ isAuthenticated }) => (
	<Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
		<Image
			src="/logo.png"
			alt="My Wellness Journey Logo"
			width={60}
			height={60}
			className="rounded-full"
			priority
		/>
		<p className="text-xl font-bold text-primary-accent">My Wellness Journey</p>
	</Link>
);

const AuthButtons: React.FC<AuthButtonsProps> = ({ isAuthenticated, onAuthClick }) => (
	<div className="hidden md:flex items-center gap-8">
		{!isAuthenticated && <Button text="Get started" onClick={onAuthClick} />}
		{isAuthenticated && (
			<Link
				href="/profile"
				className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary-accent/10 transition-colors duration-200"
				aria-label="My Profile"
			>
				<FaUserCircle className="w-6 h-6 text-primary-accent" />
				<span className="text-primary-accent font-medium">My Profile</span>
			</Link>
		)}
	</div>
);

// Utility Functions
const getNavItems = (isAuthenticated: boolean): NavItem[] =>
	isAuthenticated
		? [
				{ label: "Dashboard", href: "/dashboard" },
				{ label: "Resources", href: "/resources" },
				{ label: "Tips", href: "/tips" },
		  ]
		: [
				{ label: "Home", href: "/" },
				{ label: "Resources", href: "/resources" },
				{ label: "Tips", href: "/tips" },
		  ];

const isSelected = (pathname: string, href: string): boolean => {
	if (href === "/") return pathname === "/";
	if (href === "/dashboard") return pathname === "/dashboard";
	if (href === "/profile") return pathname === "/profile";
	return pathname.startsWith(href);
};

// Main Component
const Header: React.FC = () => {
	const pathname = usePathname();
	const { navigateToLogin } = useAuthNavigation();
	const { isAuthenticated } = useAuthStore();
	const { isMobileMenuOpen, toggleMobileMenu } = useUIStore();

	const navItems = getNavItems(isAuthenticated);

	return (
		<PageGradient type="top">
			<header className="w-full bg-white shadow-sm h-[100px]">
				<div className="mx-auto max-w-[1200px] h-full flex justify-between items-center px-4 md:px-8">
					<Logo isAuthenticated={isAuthenticated} />
					<DesktopNav navItems={navItems} isSelected={(href) => isSelected(pathname, href)} />

					<div className="flex items-center gap-4">
						<AuthButtons isAuthenticated={isAuthenticated} onAuthClick={navigateToLogin} />
						<button
							className="md:hidden p-2 rounded-md hover:bg-primary-accent/10"
							onClick={toggleMobileMenu}
							aria-label="Toggle menu"
						>
							<FaBars className="w-6 h-6" color="#3A8C96" />
						</button>
					</div>

					<MobileMenu
						isOpen={isMobileMenuOpen}
						onClose={toggleMobileMenu}
						navItems={
							isAuthenticated ? [...navItems, { label: "My Profile", href: "/profile" }] : navItems
						}
						isSelected={(href) => isSelected(pathname, href)}
						isSignedIn={isAuthenticated}
						onAuthClick={navigateToLogin}
					/>
				</div>
			</header>
		</PageGradient>
	);
};

export default Header;
