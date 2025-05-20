"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import { Loading } from "../components/Loading";

export default function RegisterPage() {
	const router = useRouter();
	const { login } = useAuthStore();
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [serverError, setServerError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const validate = () => {
		const newErrors: Record<string, string> = {};

		// Required fields
		if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
		if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
		if (!formData.email.trim()) newErrors.email = "Email is required";
		if (!formData.password) newErrors.password = "Password is required";
		if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";

		// Email format
		if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}

		// Password strength - match API validation
		if (formData.password) {
			const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]{8,}$/;
			if (!passwordRegex.test(formData.password)) {
				newErrors.password = "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character";
			}
		}

		// Password match
		if (
			formData.password &&
			formData.confirmPassword &&
			formData.password !== formData.confirmPassword
		) {
			newErrors.confirmPassword = "Passwords don't match";
		}

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
			// Register the user
			const registerResponse = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					firstName: formData.firstName,
					lastName: formData.lastName,
					email: formData.email,
					password: formData.password,
				}),
			});

			const registerData = await registerResponse.json();

			if (!registerResponse.ok) {
				// Handle registration errors
				setIsLoading(false);

				if (registerData.errors) {
					setErrors(registerData.errors);
				} else if (registerData.error) {
					if (registerData.error.includes("Email")) {
						setErrors({ ...errors, email: registerData.error });
					} else {
						setServerError(registerData.error);
					}
				} else {
					setServerError("Registration failed. Please try again.");
				}
				return;
			}

			// Registration successful, now login to get token
			const loginResponse = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: formData.email,
					password: formData.password,
				}),
			});

			const loginData = await loginResponse.json();

			// Login successful, set up initial user profile
			if (loginResponse.ok) {
				if (loginData.token && loginData.user) {
					// Store the token
					localStorage.setItem("token", loginData.token);

					// Update auth state
					login(loginData.user, loginData.token);

					// Create initial profile
					try {
						const profileResponse = await fetch("/api/user/profile", {
							method: "PUT",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${loginData.token}`,
							},
							body: JSON.stringify({
								firstName: formData.firstName,
								lastName: formData.lastName,
								profile: {
									createdAt: new Date().toISOString(),
								},
							}),
						});
					} catch (profileError) {
						console.error("Error creating initial profile:", profileError);
					}

					// Success message and redirect
					toast.success("Account created successfully!");
					router.push("/dashboard");
				}
			} else {
				// Missing user or token
				setIsLoading(false);
				setServerError("Account created but missing login data. Please try logging in manually.");
				setTimeout(() => {
					router.push("/login");
				}, 2000);
			}
		} catch (error) {
			console.error("Registration error:", error);
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
				{/* General server error message */}
				{serverError && (
					<div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
						{serverError}
					</div>
				)}

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
							className={`w-full px-4 py-2 border ${
								errors.firstName ? "border-red-500" : "border-gray-300"
							} rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all duration-200`}
							required
						/>
						{errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
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
							className={`w-full px-4 py-2 border ${
								errors.lastName ? "border-red-500" : "border-gray-300"
							} rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all duration-200`}
							required
						/>
						{errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
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
						className={`w-full px-4 py-2 border ${
							errors.email ? "border-red-500" : "border-gray-300"
						} rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all duration-200`}
						required
					/>
					{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
							className={`w-full px-4 py-2 border ${
								errors.password ? "border-red-500" : "border-gray-300"
							} rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all duration-200`}
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
							className={`w-full px-4 py-2 border ${
								errors.confirmPassword ? "border-red-500" : "border-gray-300"
							} rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all duration-200`}
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
					{errors.confirmPassword && (
						<p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
					)}
				</div>

				<div className="text-sm text-primary-subheading text-right space-y-2 mb-6">
					<p>* = required</p>
				</div>

				<Button text="Create account" type="submit" className="w-full" />
			</form>
		</AuthLayout>
	);
}
