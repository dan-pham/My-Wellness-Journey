import React from "react";
import Image from "next/image";

const Footer = () => {
	return (
		<footer className="w-full bg-primary-heading text-white">
			<div className="w-full bg-primary-heading/90">
				<div className="mx-auto max-w-[1200px] px-4 md:px-8 py-12">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
						<div className="flex flex-col items-center md:items-start space-y-4">
							<div className="flex items-center space-x-3">
								<Image
									src="/logo.png"
									alt="Logo"
									width={40}
									height={40}
									priority
									className="rounded-full"
								/>
								<span className="text-lg font-medium">My Wellness Journey</span>
							</div>
							<p className="text-sm text-white/80 text-center md:text-left">
								Your trusted companion in health and wellness
							</p>
						</div>

						<div className="flex flex-col items-center space-y-2 w-full md:w-auto">
							<h3 className="text-lg font-semibold mb-4">Quick Links</h3>
							<a
								href="/"
								className="text-white/80 hover:text-white hover:transform hover:scale-105 hover:font-semibold transition-colors duration-200 flex items-center gap-2 group"
							>
								Home
							</a>
							<a
								href="/resources"
								className="text-white/80 hover:text-white hover:transform hover:scale-105 hover:font-semibold transition-colors duration-200 flex items-center gap-2 group"
							>
								Resources
							</a>
							<a
								href="/tips"
								className="text-white/80 hover:text-white hover:transform hover:scale-105 hover:font-semibold transition-colors duration-200 flex items-center gap-2 group"
							>
								Tips
							</a>
						</div>

						<div className="flex flex-col items-center md:items-end space-y-2 md:justify-end">
							<p className="text-white/80">© 2025 My Wellness Journey</p>
							<p className="text-white/80">All rights reserved</p>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
