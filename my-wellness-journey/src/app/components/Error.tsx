"use client";

export const Error = ({ message }: { message: string }) => (
	<div className="flex items-center justify-center h-64 bg-red-50 text-red-700 p-3 rounded-md">
		<div className="text-center">
			<p className="text-lg font-semibold">Error</p>
			<p className="mt-2">{message}</p>
			<button
				onClick={() => window.location.reload()}
				className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
			>
				Try Again
			</button>
		</div>
	</div>
);
