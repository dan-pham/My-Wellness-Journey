"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";

interface RegisterFormData {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	confirmPassword: string;
}

interface RegisterFormErrors {
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
	confirmPassword?: string;
}

export const useRegisterForm = () => {
	const router = useRouter();
	const { login } = useAuthStore();
	const [formData, setFormData] = useState<RegisterFormData>({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errors, setErrors] = useState<RegisterFormErrors>({});
	const [serverError, setServerError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const validateForm = () => {
		const newErrors: RegisterFormErrors = {};

		if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
		if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
		if (!formData.email.trim()) newErrors.email = "Email is required";
		if (!formData.password) newErrors.password = "Password is required";
		if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";

		if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}

		if (formData.password) {
			const passwordRegex =
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]{8,}$/;
			if (!passwordRegex.test(formData.password)) {
				newErrors.password =
					"Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character";
			}
		}

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

	const handleRegisterAPI = async () => {
		const response = await fetch("/api/auth/register", {
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

		const data = await response.json();

		if (!response.ok) {
			throw { response, data };
		}

		return data;
	};

	const handleLoginAfterRegister = async () => {
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
			throw { response, data };
		}

		return data;
	};

	const createInitialProfile = async (token: string) => {
		const response = await fetch("/api/user/profile", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				firstName: formData.firstName,
				lastName: formData.lastName,
				profile: {
					createdAt: new Date().toISOString(),
				},
			}),
		});

		if (!response.ok) {
			console.error("Error creating initial profile");
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setServerError(null);

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			// First try to register
			await handleRegisterAPI();

			try {
				// Then try to login
				const loginData = await handleLoginAfterRegister();

				if (loginData.token && loginData.user) {
					localStorage.setItem("token", loginData.token);
					login(loginData.user, loginData.token);
					await createInitialProfile(loginData.token);
					toast.success("Account created successfully!");
					router.push("/dashboard");
				} else {
					setServerError("Account created but missing login data");
					setTimeout(() => {
						router.push("/login");
					}, 2000);
				}
			} catch (loginError) {
				// Handle login failure after successful registration
				setServerError("Account created but missing login data");
				setTimeout(() => {
					router.push("/login");
				}, 2000);
			}
		} catch (error: any) {
			console.error("Registration error:", error);

			if (error.data?.errors) {
				setErrors(error.data.errors);
			} else if (error.data?.error) {
				if (error.data.error.includes("Email")) {
					setErrors((prev) => ({ ...prev, email: error.data.error }));
				} else {
					setServerError(error.data.error);
				}
			} else {
				setServerError("An error occurred. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[id]: value,
		}));

		if (errors[id as keyof RegisterFormErrors]) {
			setErrors((prev) => ({
				...prev,
				[id]: "",
			}));
		}

		if (serverError) {
			setServerError(null);
		}
	};

	return {
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
	};
};
