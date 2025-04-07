import React from "react";
import Image from "next/image";

const Footer = () => {
	return (
		<footer className="bg-blue-900 text-white py-6">
			<div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<Image src="/logo.png" alt="Logo" width={60} height={60} priority />
					<span className="text-sm font-medium">My Wellness Journey</span>
				</div>
				<p className="text-sm">© 2025 My Wellness Journey. All rights reserved.</p>
			</div>
		</footer>
	);
};

export default Footer;
