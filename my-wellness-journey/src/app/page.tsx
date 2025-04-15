"use client";

import { redirect } from "next/navigation";
import React from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import ResourcesSection from "./components/ResourcesSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import PageGradient from "./components/PageGradient";

const HomePage = () => {
	return (
		<main className="flex flex-col w-full min-h-[screen]">
			<Header />

			<PageGradient type="top">
				<HeroSection />
			</PageGradient>

			<FeaturesSection />
			<ResourcesSection />

			<PageGradient type="bottom">
				<CTASection />
			</PageGradient>

			<Footer />
		</main>
	);
};

export default HomePage;
