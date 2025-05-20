import React from "react";
import { render, screen } from "@testing-library/react";
import ResourcesSection from "@/app/components/ResourcesSection";
import { MyHealthFinder } from "@/lib/api/myhealthfinder";

// Mock the ResourceCard component
jest.mock("@/app/components/ResourceCard", () => {
	return function MockResourceCard({ id, imageUrl, title, description, sourceUrl }: any) {
		return (
			<div data-testid={`resource-card-${id}`}>
				<div>{title}</div>
				<div>{imageUrl}</div>
				<div>{description}</div>
				<div>{sourceUrl}</div>
			</div>
		);
	};
});

describe("ResourcesSection Component", () => {
	const mockResources: MyHealthFinder[] = [
		{
			id: "1",
			imageUrl: "/image1.jpg",
			title: "Managing Diabetes",
			conditions: ["diabetes"],
			content:
				"This is a long content about managing diabetes that should be truncated in the card view.",
			sourceUrl: "https://example.com/diabetes",
		},
		{
			id: "2",
			imageUrl: "/image2.jpg",
			title: "Heart Health Tips",
			conditions: ["diabetes", "anxiety"],
			content: "Content about heart health tips and strategies for a healthy heart.",
			sourceUrl: "https://example.com/heart",
		},
		{
			id: "3",
			imageUrl: "/image3.jpg",
			title: "Mental Wellness",
			conditions: ["anxiety"],
			content: "Information about maintaining good mental health and wellness practices.",
			sourceUrl: "https://example.com/mental",
		},
		{
			id: "4",
			imageUrl: "/image4.jpg",
			title: "Healthy Eating",
			conditions: ["malnutrition"],
			content: "Guide to healthy eating and nutrition for chronic conditions.",
			sourceUrl: "https://example.com/nutrition",
		},
	];

	it("renders the section heading correctly", () => {
		render(<ResourcesSection resources={mockResources} />);

		const heading = screen.getByRole("heading", { name: /Featured Wellness Resources/i });
		expect(heading).toBeInTheDocument();
	});

	it("renders the section subheading correctly", () => {
		render(<ResourcesSection resources={mockResources} />);

		const subheading = screen.getByText("Curated content to support your health journey");
		expect(subheading).toBeInTheDocument();
	});

	it("renders only the first 3 resources even if more are provided", () => {
		render(<ResourcesSection resources={mockResources} />);

		// Should only render the first 3 resources
		expect(screen.getByTestId("resource-card-1")).toBeInTheDocument();
		expect(screen.getByTestId("resource-card-2")).toBeInTheDocument();
		expect(screen.getByTestId("resource-card-3")).toBeInTheDocument();

		// The 4th resource should not be rendered
		expect(screen.queryByTestId("resource-card-4")).not.toBeInTheDocument();
	});

	it("renders resource cards with correct titles", () => {
		render(<ResourcesSection resources={mockResources} />);

		expect(screen.getByText("Managing Diabetes")).toBeInTheDocument();
		expect(screen.getByText("Heart Health Tips")).toBeInTheDocument();
		expect(screen.getByText("Mental Wellness")).toBeInTheDocument();
	});

	it("renders truncated descriptions in resource cards", () => {
		render(<ResourcesSection resources={mockResources} />);

		// Check that descriptions are truncated if longer than 120 characters
		const firstResourceDescription = screen.getByTestId("resource-card-1").children[1];
		expect(firstResourceDescription.textContent?.length).toBeLessThanOrEqual(123); // 120 chars + "..."
	});

	it("renders correctly with empty resources array", () => {
		render(<ResourcesSection resources={[]} />);

		const heading = screen.getByRole("heading", { name: /Featured Wellness Resources/i });
		expect(heading).toBeInTheDocument();

		// No resource cards should be rendered
		expect(screen.queryByTestId(/resource-card-/)).not.toBeInTheDocument();
	});

	it("applies the correct grid layout classes", () => {
		render(<ResourcesSection resources={mockResources} />);

		const grid = screen.getByTestId("resource-card-1").parentElement?.parentElement;
		expect(grid).toHaveClass("grid");
		expect(grid).toHaveClass("md:grid-cols-2");
		expect(grid).toHaveClass("lg:grid-cols-3");
	});
});
