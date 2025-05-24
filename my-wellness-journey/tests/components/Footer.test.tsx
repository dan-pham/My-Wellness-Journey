import React from "react";
import { render, screen } from "@testing-library/react";
import Footer from "@/app/components/Footer";

// Mock Next.js Image component
jest.mock("next/image", () => ({
	__esModule: true,
	default: function MockImage(props: any) {
		const { priority, ...rest } = props;
		return <img {...rest} data-testid="logo-image" />;
	},
}));

// Mock the PageGradient component
jest.mock("@/app/components/PageGradient", () => {
	return function MockPageGradient({ children }: { children: React.ReactNode }) {
		return <div data-testid="page-gradient">{children}</div>;
	};
});

describe("Footer Component", () => {
	it("renders the footer with logo and company name", () => {
		render(<Footer />);

		// Check if the logo is displayed
		expect(screen.getByTestId("logo-image")).toBeInTheDocument();
		expect(screen.getByTestId("logo-image")).toHaveAttribute("alt", "Logo");

		// Check if the company name is displayed
		expect(screen.getByText("My Wellness Journey")).toBeInTheDocument();
	});

	it("renders the tagline", () => {
		render(<Footer />);

		// Check if the tagline is displayed
		expect(screen.getByText("Your trusted companion in health and wellness")).toBeInTheDocument();
	});

	it("renders quick links section with navigation links", () => {
		render(<Footer />);

		// Check if the quick links section is displayed
		expect(screen.getByText("Quick Links")).toBeInTheDocument();

		// Check if the navigation links are displayed
		const homeLink = screen.getByRole("link", { name: /home/i });
		expect(homeLink).toBeInTheDocument();
		expect(homeLink).toHaveAttribute("href", "/");

		const resourcesLink = screen.getByRole("link", { name: /resources/i });
		expect(resourcesLink).toBeInTheDocument();
		expect(resourcesLink).toHaveAttribute("href", "/resources");

		const tipsLink = screen.getByRole("link", { name: /tips/i });
		expect(tipsLink).toBeInTheDocument();
		expect(tipsLink).toHaveAttribute("href", "/tips");
	});

	it("renders copyright information", () => {
		render(<Footer />);

		// Check if the copyright information is displayed
		expect(screen.getByText("© 2025 My Wellness Journey")).toBeInTheDocument();
		expect(screen.getByText("All rights reserved")).toBeInTheDocument();
	});

	it("renders inside a PageGradient component", () => {
		render(<Footer />);

		// Check if the PageGradient component is used
		expect(screen.getByTestId("page-gradient")).toBeInTheDocument();
	});
});
