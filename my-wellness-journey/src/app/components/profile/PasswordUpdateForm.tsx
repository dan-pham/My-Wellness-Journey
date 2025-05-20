"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Button from "../Button";

interface PasswordData {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

interface PasswordFieldProps {
	id: string;
	name: string;
	label: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	showPassword: boolean;
	onToggleShow: () => void;
}

const PasswordField = ({
	id,
	name,
	label,
	value,
	onChange,
	showPassword,
	onToggleShow,
}: PasswordFieldProps) => (
	<div>
		<label htmlFor={id} className="block text-sm font-medium text-primary-heading mb-1">
			{label}
		</label>
		<div className="relative">
			<input
				type={showPassword ? "text" : "password"}
				id={id}
				name={name}
				value={value}
				onChange={onChange}
				className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
				required
			/>
			<button
				type="button"
				onClick={onToggleShow}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subheading"
				aria-label={showPassword ? "Hide password" : "Show password"}
			>
				{showPassword ? (
					<FaEyeSlash className="w-5 h-5" color="#3A8C96" />
				) : (
					<FaEye className="w-5 h-5" color="#3A8C96" />
				)}
			</button>
		</div>
	</div>
);

interface PasswordUpdateFormProps {
	onUpdatePassword: (passwordData: PasswordData) => Promise<void>;
	isSaving: boolean;
}

export default function PasswordUpdateForm({
	onUpdatePassword,
	isSaving,
}: PasswordUpdateFormProps) {
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const [passwordData, setPasswordData] = useState<PasswordData>({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPasswordData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onUpdatePassword(passwordData);

		// Reset form after submission
		setPasswordData({
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		});
	};

	return (
		<form
			className="space-y-6 bg-white rounded-lg border border-gray-200 p-6"
			onSubmit={handleSubmit}
		>
			<h4 className="font-medium text-primary-heading">Change Password</h4>
			<div className="space-y-4">
				<PasswordField
					id="currentPassword"
					name="currentPassword"
					label="Current Password"
					value={passwordData.currentPassword}
					onChange={handlePasswordInputChange}
					showPassword={showCurrentPassword}
					onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
				/>
				<PasswordField
					id="newPassword"
					name="newPassword"
					label="New Password"
					value={passwordData.newPassword}
					onChange={handlePasswordInputChange}
					showPassword={showNewPassword}
					onToggleShow={() => setShowNewPassword(!showNewPassword)}
				/>
				<PasswordField
					id="confirmPassword"
					name="confirmPassword"
					label="Confirm Password"
					value={passwordData.confirmPassword}
					onChange={handlePasswordInputChange}
					showPassword={showConfirmPassword}
					onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
				/>
			</div>
			<div className="flex justify-end">
				<Button
					type="submit"
					text={isSaving ? "Updating..." : "Update Password"}
					disabled={isSaving}
				/>
			</div>
		</form>
	);
}
