"use client";

import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Login submitted:", { email, password, rememberMe });
	};

	return (
		<AuthLayout
			route="Login"
			alternateLink={{
				text: "Don't have an account?",
				linkText: "Register here",
				href: "/register",
			}}
		>
			<form onSubmit={handleSubmit}>
				<div className="space-y-2 mb-6">
					<label htmlFor="email" className="block text-sm font-medium text-primary-heading">
						Email
					</label>
					<input
						type="email"
						id="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full px-4 py-2 text-primary-heading bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
						required
					/>
				</div>

				<div className="space-y-2 mb-6">
					<label htmlFor="password" className="block text-sm font-medium text-primary-heading">
						Password
					</label>
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-4 py-2 text-primary-heading bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
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
