"use client";
import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import Button from "./Button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import { useAuthNavigation } from "../hooks/useAuthNavigation";
import PageGradient from "./PageGradient";

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const pathname = usePathname();
	const { navigateToLogin, handleSignOut } = useAuthNavigation();

	const isSignedIn = true;

	// Map routes to labels
	const navItems = isSignedIn
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

	// Handle selection for subpaths
	const isSelected = (href: string) => {
		if (href === "/") {
			return pathname === "/";
		}
		if (href === "/dashboard") {
			return pathname === "/dashboard";
		}
		return pathname.startsWith(href);
	};

	const handleAuthClick = () => {
		if (isSignedIn) {
			handleSignOut();
		} else {
			navigateToLogin();
		}

		setIsMenuOpen(false);
	};

	return (
		<PageGradient type="top">
			<header className="w-full bg-white shadow-sm h-[100px]">
				<div className="mx-auto max-w-[1200px] h-full flex justify-between items-center px-4 md:px-8">
					<Link href={isSignedIn ? "/dashboard" : "/"} className="flex items-center gap-2">
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
		</PageGradient>
	);
};

export default Header;
