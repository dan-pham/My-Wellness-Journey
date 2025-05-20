"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import { Loading } from "../components/Loading";

export default function LoginPage() {
	const router = useRouter();
	const { login } = useAuthStore();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [serverError, setServerError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const validate = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.email.trim()) newErrors.email = "Email is required";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}
		
		if (!formData.password) newErrors.password = "Password is required";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Clear any previous server errors
		setServerError(null);

		if (!validate()) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: formData.email,
					password: formData.password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setIsLoading(false);

				if (data.errors) {
					// Handle field-specific errors from API
					setErrors(data.errors);
				} else if (data.error) {
					// For login, most errors should be generic
					setServerError(data.error);
				} else {
					setServerError("Login failed. Please check your credentials and try again.");
				}
				return;
			}

			// Store token in local storage or cookies if remember me is checked
			if (data.token) {
				if (rememberMe) {
					localStorage.setItem("token", data.token);
				} else {
					// If not remembering, store in sessionStorage
					sessionStorage.setItem("token", data.token);
				}
			} else {
				console.error("Login response missing token");
			}

			// Login successful - update auth state
			if (data.user) {
				login(data.user, data.token);

				toast.success("Login successful!");
				router.push("/dashboard");
			} else {
				setServerError("Something went wrong. Please try again.");
				setIsLoading(false);
			}
		} catch (error) {
			console.error("Login error:", error);
			setServerError("An error occurred. Please try again.");
			setIsLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setFormData({
			...formData,
			[id]: value,
		});

		// Clear error for this field when user types
		if (errors[id]) {
			setErrors({
				...errors,
				[id]: "",
			});
		}

		// Clear server error when user makes any change
		if (serverError) {
			setServerError(null);
		}
	};

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
				{/* General server error message */}
				{serverError && (
					<div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
						{serverError}
					</div>
				)}

				<div className="space-y-2 mb-6">
					<label htmlFor="email" className="block text-sm font-medium text-primary-heading">
						Email
					</label>
					<input
						type="email"
						id="email"
						value={formData.email}
						onChange={handleChange}
						className={`w-full px-4 py-2 text-primary-heading bg-gray-50 border ${
							errors.email ? "border-red-500" : "border-gray-200"
						} rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200`}
						required
					/>
					{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
				</div>

				<div className="space-y-2 mb-6">
					<label htmlFor="password" className="block text-sm font-medium text-primary-heading">
						Password
					</label>
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							id="password"
							value={formData.password}
							onChange={handleChange}
							className={`w-full px-4 py-2 text-primary-heading bg-gray-50 border ${
								errors.password ? "border-red-500" : "border-gray-200"
							} rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200`}
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
					{errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
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
