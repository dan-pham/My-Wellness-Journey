"use client";
import React from "react";
import Button from "./Button";
import Image from "next/image";
import NavItem from "./NavItem";
import { usePathname } from "next/navigation";

const Header = () => {
	const pathname = usePathname();

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
			console.log("Signing out...");
			// signOutUser();
		} else {
			console.log("Redirecting to sign in...");
			// router.push("/signin");
		}
	};

	return (
		<header className="flex justify-between items-center px-20 w-full bg-white shadow-sm h-[100px] max-md:px-10 max-sm:px-5">
			<Image src="/logo.png" alt="Logo" width={60} height={60} priority />
			<nav
				className="flex gap-10 items-center max-md:hidden"
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
			<Button text={isSignedIn ? "Sign out" : "Get started"} onClick={handleAuthClick} />
		</header>
	);
};

export default Header;
