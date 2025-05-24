"use client";

import { useState } from "react";
import Button from "../Button";

interface EmailData {
	currentEmail: string;
	newEmail: string;
	confirmEmail: string;
}

interface EmailFieldProps {
	id: string;
	name: string;
	label: string;
	value: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	readOnly?: boolean;
}

const EmailField = ({ id, name, label, value, onChange, readOnly }: EmailFieldProps) => (
	<div>
		<label htmlFor={id} className="block text-sm font-medium text-primary-heading mb-1">
			{label}
		</label>
		<input
			type="email"
			id={id}
			name={name}
			value={value}
			onChange={onChange}
			className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
			readOnly={readOnly}
			required
		/>
	</div>
);

interface EmailUpdateFormProps {
	currentEmail: string;
	onUpdateEmail: (emailData: EmailData) => Promise<void>;
	isUpdating: boolean;
}

export default function EmailUpdateForm({
	currentEmail,
	onUpdateEmail,
	isUpdating,
}: EmailUpdateFormProps) {
	const [emailData, setEmailData] = useState<EmailData>({
		currentEmail: currentEmail,
		newEmail: "",
		confirmEmail: "",
	});

	const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setEmailData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onUpdateEmail(emailData);

		// Reset form after submission
		setEmailData({
			currentEmail: currentEmail,
			newEmail: "",
			confirmEmail: "",
		});
	};

	return (
		<form
			className="space-y-6 bg-white rounded-lg border border-gray-200 p-6 mb-8"
			onSubmit={handleSubmit}
		>
			<h4 className="font-medium text-primary-heading">Change Email Address</h4>
			<div className="space-y-4">
				<EmailField
					id="currentEmail"
					name="currentEmail"
					label="Current Email Address"
					value={currentEmail}
					readOnly
				/>
				<EmailField
					id="newEmail"
					name="newEmail"
					label="New Email Address"
					value={emailData.newEmail}
					onChange={handleEmailInputChange}
				/>
				<EmailField
					id="confirmEmail"
					name="confirmEmail"
					label="Confirm New Email Address"
					value={emailData.confirmEmail}
					onChange={handleEmailInputChange}
				/>
			</div>
			<div className="flex justify-end">
				<Button
					type="submit"
					text={isUpdating ? "Updating..." : "Update Email"}
					disabled={isUpdating}
				/>
			</div>
		</form>
	);
}
