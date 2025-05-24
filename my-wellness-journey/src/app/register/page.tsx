"use client";

import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import { Loading } from "../components/Loading";
import { FormInput } from "../components/FormInput";
import { useRegisterForm } from "../hooks/useRegisterForm";

export default function RegisterPage() {
	const {
		formData,
		showPassword,
		setShowPassword,
		showConfirmPassword,
		setShowConfirmPassword,
		errors,
		serverError,
		isLoading,
		handleSubmit,
		handleChange,
	} = useRegisterForm();

	if (isLoading) {
		return (
			<AuthLayout
				route="Register"
				alternateLink={{
					text: "Already have an account?",
					linkText: "Log in here",
					href: "/login",
				}}
			>
				<div className="flex flex-col items-center justify-center min-h-[300px]">
					<Loading />
					<p className="mt-4 text-primary-subheading">Creating your account...</p>
				</div>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout
			route="Register"
			alternateLink={{
				text: "Already have an account?",
				linkText: "Log in here",
				href: "/login",
			}}
		>
			<form onSubmit={handleSubmit} noValidate>
				{serverError && (
					<div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
						{serverError}
					</div>
				)}

				<div className="grid grid-cols-2 gap-4">
					<FormInput
						id="firstName"
						label="First name *"
						type="text"
						value={formData.firstName}
						onChange={handleChange}
						error={errors.firstName}
						required
					/>

					<FormInput
						id="lastName"
						label="Last name *"
						type="text"
						value={formData.lastName}
						onChange={handleChange}
						error={errors.lastName}
						required
					/>
				</div>

				<FormInput
					id="email"
					label="Email *"
					type="email"
					value={formData.email}
					onChange={handleChange}
					error={errors.email}
					required
				/>

				<FormInput
					id="password"
					label="Password *"
					type="password"
					value={formData.password}
					onChange={handleChange}
					error={errors.password}
					required
					isPassword
					showPassword={showPassword}
					onTogglePassword={() => setShowPassword(!showPassword)}
				/>

				<FormInput
					id="confirmPassword"
					label="Confirm password *"
					type="password"
					value={formData.confirmPassword}
					onChange={handleChange}
					error={errors.confirmPassword}
					required
					isPassword
					showPassword={showConfirmPassword}
					onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
				/>

				<Button text="Create Account" type="submit" className="w-full mt-6" />
			</form>
		</AuthLayout>
	);
}
