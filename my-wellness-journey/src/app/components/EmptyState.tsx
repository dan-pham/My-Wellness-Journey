"use client";

export const EmptyState = ({ message }: { message: string }) => (
	<div className="flex items-center justify-center h-64 text-gray-500">
		<div className="text-center">
			<p className="text-lg font-semibold">No Results</p>
			<p className="mt-2">{message}</p>
		</div>
	</div>
);
