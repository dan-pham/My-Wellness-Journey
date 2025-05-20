"use client";

import Link from "next/link";
import { FaExclamationCircle } from "react-icons/fa";
import Button from "./Button";

// Types and Interfaces
interface EmptyStateProps {
	title: string;
	message: string;
	icon?: React.ReactNode;
	actionText?: string;
	actionFn?: () => void;
	actionLabel?: string;
	actionUrl?: string;
	className?: string;
}

interface ActionButtonProps {
	text: string;
	onClick: () => void;
}

interface ActionLinkProps {
	label: string;
	url: string;
}

// Components
const ActionButton: React.FC<ActionButtonProps> = ({ text, onClick }) => (
	<Button text={text} onClick={onClick} variant="primary" size="md" className="mt-4" />
);

const ActionLink: React.FC<ActionLinkProps> = ({ label, url }) => (
	<Link href={url} className="mt-4 inline-block">
		<Button text={label} variant="primary" size="md" />
	</Link>
);

// Main Component
export const EmptyState: React.FC<EmptyStateProps> = ({
	title,
	message,
	icon,
	actionText,
	actionFn,
	actionLabel,
	actionUrl,
	className = "",
}) => (
	<div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
		<div className="text-center">
			<div className="flex justify-center mb-4">
				{icon || <FaExclamationCircle className="w-12 h-12 text-gray-400" />}
			</div>
			<p className="text-lg font-semibold text-primary-heading">{title}</p>
			<p className="mt-2 text-primary-subheading">{message}</p>

			{actionText && actionFn && <ActionButton text={actionText} onClick={actionFn} />}
			{actionLabel && actionUrl && <ActionLink label={actionLabel} url={actionUrl} />}
		</div>
	</div>
);
