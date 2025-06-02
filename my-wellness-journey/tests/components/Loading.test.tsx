import React from "react";
import { render, screen } from "@testing-library/react";
import { Loading } from "@/app/components/Loading";

describe("Loading Component", () => {
	it("renders a loading spinner by default", () => {
		render(<Loading />);

		// Check if the spinner container is in the document
		const spinnerContainer = screen.getByTestId("loading-spinner");
		expect(spinnerContainer).toBeInTheDocument();

		// Check if it has the spinner with correct classes
		const spinner = spinnerContainer.querySelector("div");
		expect(spinner).toHaveClass("animate-spin");
		expect(spinner).toHaveClass("rounded-full");
		expect(spinner).toHaveClass("border-2");
		expect(spinner).toHaveClass("border-gray-200");
		expect(spinner).toHaveClass("border-t-primary-accent");
	});

	it("renders dots variant correctly", () => {
		render(<Loading variant="dots" />);

		// Check if the dots container is in the document
		const dotsContainer = screen.getByTestId("loading-dots");
		expect(dotsContainer).toBeInTheDocument();

		// Check if it has three bouncing dots
		const dots = dotsContainer.querySelectorAll("div");
		expect(dots).toHaveLength(3);
		dots.forEach((dot) => {
			expect(dot).toHaveClass("animate-bounce");
			expect(dot).toHaveClass("bg-primary-accent");
			expect(dot).toHaveClass("rounded-full");
		});
	});

	it("renders pulse variant correctly", () => {
		render(<Loading variant="pulse" />);

		// Check if the pulse container is in the document
		const pulseContainer = screen.getByTestId("loading-pulse");
		expect(pulseContainer).toBeInTheDocument();
		expect(pulseContainer).toHaveClass("animate-pulse");
		expect(pulseContainer).toHaveClass("bg-primary-accent/20");
		expect(pulseContainer).toHaveClass("rounded-full");
	});

	it("renders with custom size", () => {
		render(<Loading size="lg" />);
		const spinnerContainer = screen.getByTestId("loading-spinner");
		const spinner = spinnerContainer.querySelector("div");
		expect(spinner).toHaveClass("h-16");
		expect(spinner).toHaveClass("w-16");
		expect(spinner).toHaveClass("border-3");
	});

	it("renders with overlay", () => {
		render(<Loading overlay />);
		const overlayContainer = screen.getByTestId("loading-overlay");
		expect(overlayContainer).toHaveClass("fixed");
		expect(overlayContainer).toHaveClass("inset-0");
		expect(overlayContainer).toHaveClass("bg-white/80");
		expect(overlayContainer).toHaveClass("backdrop-blur-sm");
	});

	it("renders with custom text", () => {
		const loadingText = "Loading your content...";
		render(<Loading text={loadingText} />);
		const textElement = screen.getByText(loadingText);
		expect(textElement).toBeInTheDocument();
		expect(textElement).toHaveClass("text-primary-subheading");
		expect(textElement).toHaveClass("animate-pulse");
	});
});
