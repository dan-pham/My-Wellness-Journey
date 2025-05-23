"use client";

import { useState, useEffect } from "react";
import Button from "../Button";
import { formatDate } from "@/utils/stringUtils";

interface ProfileData {
	firstName: string;
	lastName: string;
	dateOfBirth?: string;
	gender?: string;
}

interface FormFieldProps {
	id: string;
	name: string;
	label: string;
	type?: "text" | "date" | "select";
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	options?: Array<{ value: string; label: string }>;
	error?: string;
}

const FormField = ({
	id,
	name,
	label,
	type = "text",
	value,
	onChange,
	options,
	error,
}: FormFieldProps) => (
	<div className="space-y-2">
		<label htmlFor={id} className="block text-sm font-medium text-primary-heading">
			{label}
		</label>
		{type === "select" ? (
			<select
				id={id}
				name={name}
				value={value}
				onChange={onChange}
				className={`w-full px-4 py-2 text-primary-heading bg-white border ${
					error ? "border-red-500" : "border-gray-200"
				} rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200`}
			>
				{options?.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		) : (
			<input
				type={type}
				id={id}
				name={name}
				value={value}
				onChange={onChange}
				className={`w-full px-4 py-2 text-primary-heading bg-white border ${
					error ? "border-red-500" : "border-gray-200"
				} rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200`}
			/>
		)}
		{error && <p className="text-sm text-red-500 mt-1">{error}</p>}
	</div>
);

interface PersonalInfoTabProps {
	initialProfile: ProfileData;
	onSave: (profileData: ProfileData) => Promise<void>;
	isSaving: boolean;
}

export default function PersonalInfoTab({
	initialProfile,
	onSave,
	isSaving,
}: PersonalInfoTabProps) {
	const [profile, setProfile] = useState(initialProfile);

	// Update profile when initialProfile changes
	useEffect(() => {
		setProfile(initialProfile);
	}, [initialProfile]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setProfile({
			...profile,
			[name]: value,
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSave(profile);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* Form Fields */}
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						id="firstName"
						name="firstName"
						label="First Name"
						value={profile?.firstName || ""}
						onChange={handleInputChange}
					/>
					<FormField
						id="lastName"
						name="lastName"
						label="Last Name"
						value={profile?.lastName || ""}
						onChange={handleInputChange}
					/>
				</div>

				<FormField
					id="dateOfBirth"
					name="dateOfBirth"
					label="Date of Birth"
					type="date"
					value={formatDate(profile?.dateOfBirth)}
					onChange={handleInputChange}
				/>

				<FormField
					id="gender"
					name="gender"
					label="Gender"
					type="select"
					value={profile?.gender || ""}
					onChange={handleInputChange}
					options={[
						{ value: "", label: "Select gender" },
						{ value: "male", label: "Male" },
						{ value: "female", label: "Female" },
						{ value: "non-binary", label: "Non-binary" },
						{ value: "prefer-not-to-say", label: "Prefer not to say" },
					]}
				/>
			</div>

			{/* Save Button */}
			<div className="flex justify-end">
				<Button type="submit" text={isSaving ? "Saving..." : "Save Changes"} disabled={isSaving} />
			</div>
		</form>
	);
}
