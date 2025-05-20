import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MobileMenu from "@/app/components/MobileMenu";

// Mock the necessary components
jest.mock("next/link", () => {
	return ({ children, href, className }: any) => (
		<a href={href} className={className}>
			{children}
		</a>
	);
});

jest.mock("@/app/components/NavItem", () => {
	return function MockNavItem({ label, href, isSelected, onClick }: any) {
		return (
			<div data-testid={`nav-item-${href}`} data-selected={isSelected} onClick={onClick}>
				{label}
			</div>
		);
	};
});

jest.mock("@/app/components/Button", () => {
	return function MockButton({ text, onClick, className }: any) {
		return (
			<button onClick={onClick} className={className}>
				{text}
			</button>
		);
	};
});

describe("MobileMenu Component", () => {
	const mockNavItems = [
		{ label: "Home", href: "/" },
		{ label: "Resources", href: "/resources" },
		{ label: "Tips", href: "/tips" },
	];

	const mockIsSelected = (href: string) => href === "/resources";
	const mockOnClose = jest.fn();
	const mockOnAuthClick = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders with the correct transform class when closed", () => {
		render(
			<MobileMenu
				isOpen={false}
				onClose={mockOnClose}
				navItems={mockNavItems}
				isSelected={mockIsSelected}
				isSignedIn={false}
				onAuthClick={mockOnAuthClick}
			/>
		);

		const menuContainer = screen.getByRole("navigation").parentElement?.parentElement;
		expect(menuContainer).toHaveClass("translate-x-full");
	});

	it("renders with the correct transform class when open", () => {
		render(
			<MobileMenu
				isOpen={true}
				onClose={mockOnClose}
				navItems={mockNavItems}
				isSelected={mockIsSelected}
				isSignedIn={false}
				onAuthClick={mockOnAuthClick}
			/>
		);

		const menuContainer = screen.getByRole("navigation").parentElement?.parentElement;
		expect(menuContainer).toHaveClass("translate-x-0");
	});

	it("renders all nav items with correct props", () => {
		render(
			<MobileMenu
				isOpen={true}
				onClose={mockOnClose}
				navItems={mockNavItems}
				isSelected={mockIsSelected}
				isSignedIn={false}
				onAuthClick={mockOnAuthClick}
			/>
		);

		mockNavItems.forEach((item) => {
			const navItem = screen.getByTestId(`nav-item-${item.href}`);
			expect(navItem).toBeInTheDocument();
			expect(navItem).toHaveTextContent(item.label);

			const isSelected = item.href === "/resources";
			expect(navItem).toHaveAttribute("data-selected", String(isSelected));
		});
	});

	it("calls onClose when the close button is clicked", () => {
		render(
			<MobileMenu
				isOpen={true}
				onClose={mockOnClose}
				navItems={mockNavItems}
				isSelected={mockIsSelected}
				isSignedIn={false}
				onAuthClick={mockOnAuthClick}
			/>
		);

		const closeButton = screen.getByLabelText("Close menu");
		fireEvent.click(closeButton);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('renders "Get started" button when not signed in', () => {
		render(
			<MobileMenu
				isOpen={true}
				onClose={mockOnClose}
				navItems={mockNavItems}
				isSelected={mockIsSelected}
				isSignedIn={false}
				onAuthClick={mockOnAuthClick}
			/>
		);

		const button = screen.getByText("Get started");
		expect(button).toBeInTheDocument();
	});

	it('calls onAuthClick when the "Get started" button is clicked', () => {
		render(
			<MobileMenu
				isOpen={true}
				onClose={mockOnClose}
				navItems={mockNavItems}
				isSelected={mockIsSelected}
				isSignedIn={false}
				onAuthClick={mockOnAuthClick}
			/>
		);

		const button = screen.getByText("Get started");
		fireEvent.click(button);

		expect(mockOnAuthClick).toHaveBeenCalledTimes(1);
	});

	it('renders "Sign Out" button when signed in', () => {
		render(
			<MobileMenu
				isOpen={true}
				onClose={mockOnClose}
				navItems={mockNavItems}
				isSelected={mockIsSelected}
				isSignedIn={true}
				onAuthClick={mockOnAuthClick}
			/>
		);

		const button = screen.getByText("Sign Out");
		expect(button).toBeInTheDocument();
	});

	it('calls onAuthClick when the "Sign Out" button is clicked', () => {
		render(
			<MobileMenu
				isOpen={true}
				onClose={mockOnClose}
				navItems={mockNavItems}
				isSelected={mockIsSelected}
				isSignedIn={true}
				onAuthClick={mockOnAuthClick}
			/>
		);

		const button = screen.getByText("Sign Out");
		fireEvent.click(button);

		expect(mockOnAuthClick).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when a nav item is clicked", () => {
		render(
			<MobileMenu
				isOpen={true}
				onClose={mockOnClose}
				navItems={mockNavItems}
				isSelected={mockIsSelected}
				isSignedIn={false}
				onAuthClick={mockOnAuthClick}
			/>
		);

		const navItem = screen.getByTestId("nav-item-/");
		fireEvent.click(navItem);

		// Verify that the onClick prop was passed to NavItem
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});
});
