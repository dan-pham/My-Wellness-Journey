import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroSection from "@/app/components/HeroSection";

// Mock the necessary components and hooks
jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ src, alt, className, priority }: any) => (
		<img src={src} alt={alt} className={className} data-priority={priority} />
	),
}));

jest.mock("@/app/components/Button", () => {
	return function MockButton({ text, onClick }: any) {
		return <button onClick={onClick}>{text}</button>;
	};
});

jest.mock("@/app/hooks/useAuthNavigation", () => ({
	useAuthNavigation: () => ({
		navigateToLogin: jest.fn(),
	}),
}));

describe("HeroSection Component", () => {
	it("renders the main heading correctly", () => {
		render(<HeroSection />);

		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent(
			"Take control of your health journey with personalized wellness resources"
		);
	});

	it("renders the subheading correctly", () => {
		render(<HeroSection />);

		const subheading = screen.getByText(
			"Trusted information tailored to your chronic condition needs"
		);
		expect(subheading).toBeInTheDocument();
	});

	it('renders the "Get Started Today" button', () => {
		render(<HeroSection />);

		const button = screen.getByText("Get Started Today");
		expect(button).toBeInTheDocument();
	});

	it("calls navigateToLogin when the button is clicked", () => {
		const mockNavigateToLogin = jest.fn();
		jest
			.spyOn(require("@/app/hooks/useAuthNavigation"), "useAuthNavigation")
			.mockImplementation(() => ({
				navigateToLogin: mockNavigateToLogin,
			}));

		render(<HeroSection />);

		const button = screen.getByText("Get Started Today");
		fireEvent.click(button);

		expect(mockNavigateToLogin).toHaveBeenCalledTimes(1);
	});

	it("renders the hero image with correct attributes", () => {
		render(<HeroSection />);

		const image = screen.getByAltText("A man hugging a woman in a garden");
		expect(image).toBeInTheDocument();
		expect(image).toHaveAttribute("data-priority", "true");
		expect(image).toHaveClass("rounded-lg");
		expect(image).toHaveClass("object-cover");
	});

	it("has the correct responsive layout classes", () => {
		render(<HeroSection />);

		const section = screen.getByTestId("hero-section");
		expect(section).toHaveClass("w-full");

		const container = section.firstChild;
		expect(container).toHaveClass("flex-col");
		expect(container).toHaveClass("md:flex-row");
	});
});
