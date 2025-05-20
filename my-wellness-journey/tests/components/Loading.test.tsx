import React from "react";
import { render, screen } from "@testing-library/react";
import { Loading } from "@/app/components/Loading";

describe("Loading Component", () => {
	it("renders a loading spinner", () => {
		render(<Loading />);

		// Check if the spinner container is in the document
		const loadingContainer = screen.getByTestId("loading-spinner");
		expect(loadingContainer).toBeInTheDocument();

		// Check if it has the correct classes
		expect(loadingContainer.firstChild).toHaveClass("animate-spin");
		expect(loadingContainer.firstChild).toHaveClass("rounded-full");
		expect(loadingContainer.firstChild).toHaveClass("border-t-2");
		expect(loadingContainer.firstChild).toHaveClass("border-b-2");
		expect(loadingContainer.firstChild).toHaveClass("border-primary-accent");
	});
});
