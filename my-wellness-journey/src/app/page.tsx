"use client";

import { redirect } from "next/navigation";
import React from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import ResourcesSection from "./components/ResourcesSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

const HomePage = () => {
	return (
		<main className="flex flex-col w-full bg-white min-h-[screen]">
			<Header />
			<HeroSection />
			<FeaturesSection />
			<ResourcesSection />
			<CTASection />
			<Footer />
		</main>
	);
};

export default HomePage;
