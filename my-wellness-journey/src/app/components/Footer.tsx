import React from "react";
import Image from "next/image";
import Link from "next/link";
import PageGradient from "./PageGradient";

// Types and Interfaces
interface FooterLink {
	href: string;
	label: string;
}

interface LogoSectionProps {
	logoSrc: string;
	title: string;
	subtitle: string;
}

interface QuickLinksProps {
	links: FooterLink[];
}

interface CopyrightProps {
	year: number;
	companyName: string;
}

// Data
const quickLinks: FooterLink[] = [
	{ href: "/", label: "Home" },
	{ href: "/resources", label: "Resources" },
	{ href: "/tips", label: "Tips" },
];

// Components
const LogoSection: React.FC<LogoSectionProps> = ({ logoSrc, title, subtitle }) => (
	<div className="flex flex-col items-center md:items-start space-y-4">
		<div className="flex items-center space-x-3">
			<Image src={logoSrc} alt="Logo" width={40} height={40} priority className="rounded-full" />
			<span className="text-lg font-medium">{title}</span>
		</div>
		<p className="text-sm text-white/80 text-center md:text-left">{subtitle}</p>
	</div>
);

const QuickLinks: React.FC<QuickLinksProps> = ({ links }) => (
	<div className="flex flex-col items-center space-y-2 w-full md:w-auto">
		<h3 className="text-lg font-semibold mb-4">Quick Links</h3>
		{links.map((link) => (
			<Link
				key={link.href}
				href={link.href}
				className="text-white/80 hover:text-white hover:transform hover:scale-105 hover:font-semibold transition-colors duration-200 flex items-center gap-2 group"
			>
				{link.label}
			</Link>
		))}
	</div>
);

const Copyright: React.FC<CopyrightProps> = ({ year, companyName }) => (
	<div className="flex flex-col items-center md:items-end space-y-2 md:justify-end">
		<p className="text-white/80">
			© {year} {companyName}
		</p>
		<p className="text-white/80">All rights reserved</p>
	</div>
);

// Main Component
const Footer: React.FC = () => {
	return (
		<PageGradient type="bottom">
			<footer className="w-full bg-primary-heading text-white">
				<div className="w-full bg-primary-heading/90">
					<div className="mx-auto max-w-[1200px] px-4 md:px-8 py-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
							<LogoSection
								logoSrc="/logo.png"
								title="My Wellness Journey"
								subtitle="Your trusted companion in health and wellness"
							/>
							<QuickLinks links={quickLinks} />
							<Copyright year={2025} companyName="My Wellness Journey" />
						</div>
					</div>
				</div>
			</footer>
		</PageGradient>
	);
};

export default Footer;
