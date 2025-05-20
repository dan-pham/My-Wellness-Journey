"use client";

export const Loading = () => (
	<div data-testid="loading-spinner" className="flex items-center justify-center h-64">
		<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-accent"></div>
	</div>
);
