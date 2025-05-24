"use client";

import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import Link from "next/link";
import { Loading } from "../components/Loading";
import { FormInput } from "../components/FormInput";
import { useLoginForm } from "../hooks/useLoginForm";

export default function LoginPage() {
	const {
		formData,
		showPassword,
		setShowPassword,
		rememberMe,
		setRememberMe,
		errors,
		serverError,
		isLoading,
		handleSubmit,
		handleChange,
	} = useLoginForm();

	if (isLoading) {
		return (
			<AuthLayout
				route="Login"
				alternateLink={{
					text: "Don't have an account?",
					linkText: "Register here",
					href: "/register",
				}}
			>
				<div className="flex flex-col items-center justify-center min-h-[300px]">
					<Loading />
					<p className="mt-4 text-primary-subheading">Logging in...</p>
				</div>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout
			route="Login"
			alternateLink={{
				text: "Don't have an account?",
				linkText: "Register here",
				href: "/register",
			}}
		>
			<form onSubmit={handleSubmit} noValidate>
				{serverError && (
					<div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
						{serverError}
					</div>
				)}

				<FormInput
					id="email"
					label="Email"
					type="email"
					value={formData.email}
					onChange={handleChange}
					error={errors.email}
					required
				/>

				<FormInput
					id="password"
					label="Password"
					type="password"
					value={formData.password}
					onChange={handleChange}
					error={errors.password}
					required
					isPassword
					showPassword={showPassword}
					onTogglePassword={() => setShowPassword(!showPassword)}
				/>

				<div className="flex items-center justify-between mb-6">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
							className="w-4 h-4 text-primary-accent rounded border-gray-300 focus:ring-primary-accent cursor-pointer"
						/>
						<span className="text-sm text-primary-subheading">Remember Me</span>
					</label>
					<Link
						href="/forgot-password"
						className="text-sm text-primary-accent hover:text-primary-accent/80 transition-colors duration-200"
					>
						Forgot password?
					</Link>
				</div>

				<Button text="Login" type="submit" className="w-full mt-6" />
			</form>
		</AuthLayout>
	);
}
