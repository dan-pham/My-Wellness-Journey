"use client";

import { useEffect, useState } from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import ResourcesSection from "./components/ResourcesSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

import AuthProvider from "./components/AuthProvider";
import { useHealthStore } from "../stores/healthStore";
import { MyHealthFinder } from "../lib/api/myhealthfinder";
import { Loading } from "./components/Loading";
import ErrorBoundary from "./components/ErrorBoundary";

const HomePage = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [featuredResources, setFeaturedResources] = useState<MyHealthFinder[]>([]);
	const { fetchResources, resources, resourcesLoading, resourcesError } = useHealthStore();

	useEffect(() => {
		const loadResources = async () => {
			setIsLoading(true);
			try {
				await fetchResources("health", 3);
			} catch (error) {
				console.error("Error fetching resources:", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadResources();
	}, [fetchResources]);

	useEffect(() => {
		if (resources.length > 0) {
			setFeaturedResources(resources.slice(0, 3));
		}
	}, [resources]);

	return (
		<ErrorBoundary>
			<AuthProvider>
				<main className="flex flex-col w-full min-h-[screen]">
					<Header />
					<HeroSection />
					<FeaturesSection />
					{resourcesLoading ? <Loading /> : <ResourcesSection resources={featuredResources} />}
					<CTASection />
					<Footer />
				</main>
			</AuthProvider>
		</ErrorBoundary>
	);
};

export default HomePage;
