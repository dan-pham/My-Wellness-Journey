import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CTASection from "@/app/components/CTASection";

// Create a mock function for navigateToLogin
const mockNavigateToLogin = jest.fn();

// Mock the useAuthNavigation hook
jest.mock("@/app/hooks/useAuthNavigation", () => ({
	useAuthNavigation: () => ({
		navigateToLogin: mockNavigateToLogin,
	}),
}));

// Mock the Button component to properly pass the onClick handler
jest.mock("@/app/components/Button", () => {
	return function MockButton({ text, onClick }: { text: string; onClick: () => void }) {
		return (
			<button onClick={onClick} data-testid="cta-button">
				{text}
			</button>
		);
	};
});

describe("CTASection Component", () => {
	beforeEach(() => {
		// Clear the mock before each test
		mockNavigateToLogin.mockClear();
	});

	it("renders the CTA section with heading and text", () => {
		render(<CTASection />);

		// Check if the heading is displayed
		expect(
			screen.getByRole("heading", { name: /ready to start your wellness journey\?/i })
		).toBeInTheDocument();

		// Check if the description text is displayed
		expect(screen.getByText(/join others in improving their quality of life/i)).toBeInTheDocument();
	});

	it("renders the CTA button with correct text", () => {
		render(<CTASection />);

		// Check if the button is displayed with correct text
		const ctaButton = screen.getByTestId("cta-button");
		expect(ctaButton).toBeInTheDocument();
		expect(ctaButton).toHaveTextContent("Create Your Free Account");
	});

	it("calls navigateToLogin when button is clicked", () => {
		render(<CTASection />);

		// Click the CTA button
		fireEvent.click(screen.getByTestId("cta-button"));

		// Check if navigateToLogin was called
		expect(mockNavigateToLogin).toHaveBeenCalledTimes(1);
	});
});
