import React from "react";
import { render, screen, within } from "@testing-library/react";
import AuthLayout from "@/app/components/AuthLayout";

// Mock the next/image component
jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ src, alt, width, height, className, priority }: any) => (
		<img
			src={src}
			alt={alt}
			width={width}
			height={height}
			className={className}
			data-priority={priority}
		/>
	),
}));

// Mock the PageGradient and Footer components
jest.mock("@/app/components/PageGradient", () => {
	return function MockPageGradient({ children, type }: any) {
		return (
			<div data-testid="page-gradient" data-type={type}>
				{children}
			</div>
		);
	};
});

jest.mock("@/app/components/Footer", () => {
	return function MockFooter() {
		return <footer data-testid="footer">Footer</footer>;
	};
});

describe("AuthLayout Component", () => {
	const mockProps = {
		route: "Login",
		alternateLink: {
			text: "Don't have an account?",
			linkText: "Sign up",
			href: "/register",
		},
	};

	it("renders the logo and site name", () => {
		render(
			<AuthLayout {...mockProps}>
				<div>Test Content</div>
			</AuthLayout>
		);

		expect(screen.getByAltText("My Wellness Journey Logo")).toBeInTheDocument();
		expect(screen.getByText("My Wellness Journey")).toBeInTheDocument();
	});

	it("displays the correct route in breadcrumb", () => {
		render(
			<AuthLayout {...mockProps}>
				<div>Test Content</div>
			</AuthLayout>
		);

		const breadcrumb = screen.getByTestId("breadcrumb");
		expect(within(breadcrumb).getByText("Home")).toBeInTheDocument();
		expect(within(breadcrumb).getByText("Login")).toBeInTheDocument();
	});

	it("renders the hero image with correct attributes", () => {
		render(
			<AuthLayout {...mockProps}>
				<div>Test Content</div>
			</AuthLayout>
		);

		const image = screen.getByAltText("Grandpa carrying granddaughter");
		expect(image).toBeInTheDocument();
		expect(image).toHaveAttribute("data-priority", "true");
		expect(image).toHaveClass("object-cover");
	});

	it("displays the route in the form header", () => {
		render(
			<AuthLayout {...mockProps}>
				<div>Test Content</div>
			</AuthLayout>
		);

		expect(screen.getByRole("heading", { level: 2, name: "Login" })).toBeInTheDocument();
	});

	it("renders the alternate link with correct text and href", () => {
		render(
			<AuthLayout {...mockProps}>
				<div>Test Content</div>
			</AuthLayout>
		);

		const link = screen.getByRole("link", { name: "Sign up" });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/register");
		expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
	});

	it("renders children content in the form section", () => {
		render(
			<AuthLayout {...mockProps}>
				<div data-testid="test-content">Test Form Content</div>
			</AuthLayout>
		);

		expect(screen.getByTestId("test-content")).toBeInTheDocument();
		expect(screen.getByText("Test Form Content")).toBeInTheDocument();
	});

	it("renders the footer", () => {
		render(
			<AuthLayout {...mockProps}>
				<div>Test Content</div>
			</AuthLayout>
		);

		expect(screen.getByTestId("footer")).toBeInTheDocument();
	});

	it("applies the correct responsive classes", () => {
		render(
			<AuthLayout {...mockProps}>
				<div>Test Content</div>
			</AuthLayout>
		);

		const mainContainer = screen.getByRole("main");
		expect(mainContainer).toHaveClass("min-h-screen");

		const contentContainer = screen.getByTestId("auth-content-container").firstChild;
		expect(contentContainer).toHaveClass("flex-col", "md:flex-row");
	});
});
