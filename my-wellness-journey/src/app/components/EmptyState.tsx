"use client";

import Link from "next/link";

interface EmptyStateProps {
	title: string;
	message: string;
	actionText?: string;
	actionFn?: () => void;
	actionLabel?: string;
	actionUrl?: string;
}

export const EmptyState = ({
	title,
	message,
	actionText,
	actionFn,
	actionLabel,
	actionUrl,
}: EmptyStateProps) => (
	<div className="flex items-center justify-center h-64 text-gray-500">
		<div className="text-center">
			<p className="text-lg font-semibold">{title}</p>
			<p className="mt-2">{message}</p>

			{actionText && actionFn && (
				<button
					onClick={actionFn}
					className="mt-4 px-6 py-2 bg-primary-accent text-white rounded-full hover:bg-primary-accent/90 transition-colors duration-200 font-medium"
				>
					{actionText}
				</button>
			)}

			{actionLabel && actionUrl && (
				<Link
					href={actionUrl}
					className="mt-4 inline-block px-6 py-2 bg-primary-accent text-white rounded-full hover:bg-primary-accent/90 transition-colors duration-200 font-medium"
				>
					{actionLabel}
				</Link>
			)}
		</div>
	</div>
);
