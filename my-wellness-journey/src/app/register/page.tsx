"use client";

import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function RegisterPage() {
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Register submitted:", formData);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.id]: e.target.value,
		});
	};

	return (
		<AuthLayout
			route="Register"
			alternateLink={{
				text: "Already have an account?",
				linkText: "Log in here",
				href: "/login",
			}}
		>
			<form onSubmit={handleSubmit}>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2 mb-6">
						<label htmlFor="firstName" className="block text-sm font-medium text-primary-heading">
							First name *
						</label>
						<input
							type="text"
							id="firstName"
							value={formData.firstName}
							onChange={handleChange}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all duration-200"
							required
						/>
					</div>
					<div className="space-y-2 mb-6">
						<label htmlFor="lastName" className="block text-sm font-medium text-primary-heading">
							Last name *
						</label>
						<input
							type="text"
							id="lastName"
							value={formData.lastName}
							onChange={handleChange}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all duration-200"
							required
						/>
					</div>
				</div>

				<div className="space-y-2 mb-6">
					<label htmlFor="email" className="block text-sm font-medium text-primary-heading">
						Email *
					</label>
					<input
						type="email"
						id="email"
						value={formData.email}
						onChange={handleChange}
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all duration-200"
						required
					/>
				</div>

				<div className="space-y-2 mb-6">
					<label htmlFor="password" className="block text-sm font-medium text-primary-heading">
						Password *
					</label>
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							id="password"
							value={formData.password}
							onChange={handleChange}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all duration-200"
							required
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subheading"
						>
							{showPassword ? (
								<FaEyeSlash className="w-5 h-5" color="#3A8C96" />
							) : (
								<FaEye className="w-5 h-5" color="#3A8C96" />
							)}
						</button>
					</div>
				</div>

				<div className="space-y-2 mb-4">
					<label
						htmlFor="confirmPassword"
						className="block text-sm font-medium text-primary-heading"
					>
						Confirm password *
					</label>
					<div className="relative">
						<input
							type={showConfirmPassword ? "text" : "password"}
							id="confirmPassword"
							value={formData.confirmPassword}
							onChange={handleChange}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all duration-200"
							required
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subheading"
						>
							{showConfirmPassword ? (
								<FaEyeSlash className="w-5 h-5" color="#3A8C96" />
							) : (
								<FaEye className="w-5 h-5" color="#3A8C96" />
							)}
						</button>
					</div>
				</div>

				<div className="text-sm text-primary-subheading text-right space-y-2 mb-6">
					<p>* = required</p>
				</div>

				<Button text="Create account" type="submit" className="w-full" />
			</form>
		</AuthLayout>
	);
}
