import React from "react";
import { render, screen } from "@testing-library/react";
import DesktopNav from "@/app/components/DesktopNav";

// Mock NavItem component
jest.mock("@/app/components/NavItem", () => {
	return function MockNavItem({ label, href, isSelected }: any) {
		return (
			<div data-testid={`nav-item-${href}`} data-selected={isSelected}>
				{label}
			</div>
		);
	};
});

describe("DesktopNav Component", () => {
	const mockNavItems = [
		{ label: "Home", href: "/" },
		{ label: "Resources", href: "/resources" },
		{ label: "Tips", href: "/tips" },
	];

	const mockIsSelected = (href: string) => href === "/resources";

	it("renders with correct navigation role and aria-label", () => {
		render(<DesktopNav navItems={mockNavItems} isSelected={mockIsSelected} />);

		const nav = screen.getByRole("navigation");
		expect(nav).toBeInTheDocument();
		expect(nav).toHaveAttribute("aria-label", "Main navigation");
	});

	it("renders all nav items with correct props", () => {
		render(<DesktopNav navItems={mockNavItems} isSelected={mockIsSelected} />);

		// Check that all nav items are rendered
		mockNavItems.forEach((item) => {
			const navItem = screen.getByTestId(`nav-item-${item.href}`);
			expect(navItem).toBeInTheDocument();
			expect(navItem).toHaveTextContent(item.label);

			// Check if isSelected is correctly passed
			const isSelected = item.href === "/resources";
			expect(navItem).toHaveAttribute("data-selected", String(isSelected));
		});
	});

	it("applies the correct desktop-specific classes", () => {
		render(<DesktopNav navItems={mockNavItems} isSelected={mockIsSelected} />);

		const nav = screen.getByRole("navigation");
		expect(nav).toHaveClass("hidden");
		expect(nav).toHaveClass("md:flex");
	});

	it("renders nothing when navItems is empty", () => {
		render(<DesktopNav navItems={[]} isSelected={mockIsSelected} />);

		const nav = screen.getByRole("navigation");
		expect(nav.children.length).toBe(0);
	});
});
