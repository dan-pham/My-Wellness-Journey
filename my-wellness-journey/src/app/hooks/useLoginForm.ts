"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";

interface LoginFormData {
    email: string;
    password: string;
}

interface LoginFormErrors {
    email?: string;
    password?: string;
}

export const useLoginForm = () => {
    const router = useRouter();
    const { login } = useAuthStore();
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState<LoginFormErrors>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: LoginFormErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }
        
        if (!formData.password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLoginAPI = async () => {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw { response, data };
        }

        return data;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError(null);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const data = await handleLoginAPI();

            if (data.token) {
                if (rememberMe) {
                    localStorage.setItem("token", data.token);
                } else {
                    sessionStorage.setItem("token", data.token);
                }
            }

            if (data.user) {
                login(data.user, data.token);
                toast.success("Login successful!");
                router.push("/dashboard");
            } else {
                setServerError("Something went wrong. Please try again.");
            }
        } catch (error: any) {
            console.error("Login error:", error);
            
            if (error.data?.errors) {
                setErrors(error.data.errors);
            } else if (error.data?.error) {
                setServerError(error.data.error);
            } else {
                setServerError("An error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value,
        }));

        if (errors[id as keyof LoginFormErrors]) {
            setErrors(prev => ({
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
        rememberMe,
        setRememberMe,
        errors,
        serverError,
        isLoading,
        handleSubmit,
        handleChange,
    };
}; 