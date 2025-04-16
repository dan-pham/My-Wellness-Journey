"use client";
import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import Button from "./Button";
import Image from "next/image";
import { usePathname } from "next/navigation";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import { useAuthNavigation } from "../hooks/useAuthNavigation";

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const pathname = usePathname();
	const { navigateToLogin, handleSignOut } = useAuthNavigation();

	// Map routes to labels
	const navItems = [
		{ label: "Home", href: "/" },
		{ label: "Resources", href: "/resources" },
		{ label: "Tips", href: "/tips" },
	];

	// Handle selection for subpaths
	const isSelected = (href: string) => {
		return href === "/" ? pathname === "/" : pathname.startsWith(href);
	};

	// Handle dynamic sign in/sign out button
	const isSignedIn = false;

	const handleAuthClick = () => {
		if (isSignedIn) {
			handleSignOut();
		} else {
			navigateToLogin();
		}

		setIsMenuOpen(false);
	};

	return (
		<header className="w-full bg-white shadow-sm h-[100px]">
			<div className="mx-auto max-w-[1200px] h-full flex justify-between items-center px-4 md:px-8">
				<Image src="/logo.png" alt="Logo" width={60} height={60} priority />

				<DesktopNav navItems={navItems} isSelected={isSelected} />

				<div className="flex items-center gap-4">
					<div className="hidden md:block">
						<Button text={isSignedIn ? "Sign out" : "Get started"} onClick={handleAuthClick} />
					</div>

					<button
						className="md:hidden p-2 rounded-md hover:bg-primary-accent/10"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						aria-label="Toggle menu"
					>
						<FaBars className="w-6 h-6" color="#3A8C96" />
					</button>
				</div>

				<MobileMenu
					isOpen={isMenuOpen}
					onClose={() => setIsMenuOpen(false)}
					navItems={navItems}
					isSelected={isSelected}
					isSignedIn={isSignedIn}
					onAuthClick={handleAuthClick}
				/>
			</div>
		</header>
	);
};

export default Header;
