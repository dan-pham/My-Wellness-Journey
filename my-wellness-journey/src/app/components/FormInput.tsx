"use client";

import { FaEye, FaEyeSlash } from "react-icons/fa";

interface FormInputProps {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    required?: boolean;
    isPassword?: boolean;
    showPassword?: boolean;
    onTogglePassword?: () => void;
}

export const FormInput = ({
    id,
    label,
    type,
    value,
    onChange,
    error,
    required = false,
    isPassword = false,
    showPassword,
    onTogglePassword,
}: FormInputProps) => {
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className="space-y-2 mb-6">
            <label htmlFor={id} className="block text-sm font-medium text-primary-heading">
                {label}
            </label>
            <div className="relative">
                <input
                    type={inputType}
                    id={id}
                    value={value}
                    onChange={onChange}
                    className={`w-full px-4 py-2 text-primary-heading bg-gray-50 border ${
                        error ? "border-red-500" : "border-gray-200"
                    } rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200`}
                    required={required}
                />
                {isPassword && onTogglePassword && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subheading"
                    >
                        {showPassword ? (
                            <FaEyeSlash className="w-5 h-5" color="#3A8C96" />
                        ) : (
                            <FaEye className="w-5 h-5" color="#3A8C96" />
                        )}
                    </button>
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}; 