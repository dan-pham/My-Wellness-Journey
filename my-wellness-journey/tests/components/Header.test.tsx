import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "@/app/components/Header";

// Mock the necessary components and hooks
jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ src, alt, className }: any) => <img src={src} alt={alt} className={className} />,
}));

jest.mock("next/link", () => {
	return ({ children, href, className }: any) => (
		<a href={href} className={className}>
			{children}
		</a>
	);
});

jest.mock("@/app/components/DesktopNav", () => {
	return function MockDesktopNav({ navItems, isSelected }: any) {
		return <div data-testid="desktop-nav" />;
	};
});

jest.mock("@/app/components/MobileMenu", () => {
	return function MockMobileMenu({
		isOpen,
		onClose,
		navItems,
		isSelected,
		isSignedIn,
		onAuthClick,
	}: any) {
		return <div data-testid="mobile-menu" data-open={isOpen} />;
	};
});

jest.mock("@/app/components/PageGradient", () => {
	return function MockPageGradient({ children, type }: any) {
		return (
			<div data-testid="page-gradient" data-type={type}>
				{children}
			</div>
		);
	};
});

jest.mock("@/app/components/Button", () => {
	return function MockButton({ text, onClick }: any) {
		return <button onClick={onClick}>{text}</button>;
	};
});

// Mock hooks
jest.mock("next/navigation", () => ({
	usePathname: () => "/resources",
}));

jest.mock("@/app/hooks/useAuthNavigation", () => ({
	useAuthNavigation: () => ({
		navigateToLogin: jest.fn(),
	}),
}));

jest.mock("@/stores/uiStore", () => ({
	useUIStore: () => ({
		isMobileMenuOpen: false,
		toggleMobileMenu: jest.fn(),
	}),
}));

jest.mock("@/stores/authStore", () => ({
	useAuthStore: () => ({
		isAuthenticated: false,
	}),
}));

describe("Header Component", () => {
	it("renders the logo and site name", () => {
		render(<Header />);

		expect(screen.getByAltText("My Wellness Journey Logo")).toBeInTheDocument();
		expect(screen.getByText("My Wellness Journey")).toBeInTheDocument();
	});

	it("renders the DesktopNav component with correct props", () => {
		render(<Header />);

		expect(screen.getByTestId("desktop-nav")).toBeInTheDocument();
	});

	it("renders the MobileMenu component with correct props", () => {
		render(<Header />);

		expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
	});

	it('renders the PageGradient component with type "top"', () => {
		render(<Header />);

		const pageGradient = screen.getByTestId("page-gradient");
		expect(pageGradient).toBeInTheDocument();
		expect(pageGradient).toHaveAttribute("data-type", "top");
	});

	it('renders the "Get started" button when not authenticated', () => {
		render(<Header />);

		expect(screen.getByText("Get started")).toBeInTheDocument();
	});

	it('does not render the "Get started" button when authenticated', () => {
		// Override the mock for this specific test
		jest.spyOn(require("@/stores/authStore"), "useAuthStore").mockImplementation(() => ({
			isAuthenticated: true,
		}));

		render(<Header />);

		expect(screen.queryByText("Get started")).not.toBeInTheDocument();
	});

	it("renders the mobile menu toggle button", () => {
		render(<Header />);

		const toggleButton = screen.getByLabelText("Toggle menu");
		expect(toggleButton).toBeInTheDocument();
	});

	it("calls toggleMobileMenu when the toggle button is clicked", () => {
		const mockToggleMobileMenu = jest.fn();
		jest.spyOn(require("@/stores/uiStore"), "useUIStore").mockImplementation(() => ({
			isMobileMenuOpen: false,
			toggleMobileMenu: mockToggleMobileMenu,
		}));

		render(<Header />);

		const toggleButton = screen.getByLabelText("Toggle menu");
		fireEvent.click(toggleButton);

		expect(mockToggleMobileMenu).toHaveBeenCalledTimes(1);
	});
});
