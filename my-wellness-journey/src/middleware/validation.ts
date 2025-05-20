import { NextRequest, NextResponse } from "next/server";

export interface ValidationRule {
	validator: (value: any) => boolean;
	message: string;
}

export interface ValidationSchema {
	[key: string]: ValidationRule[];
}

// Validation rules
export const isRequired = (fieldName: string): ValidationRule => ({
	validator: (value) => value !== undefined && value !== null && value !== "",
	message: `${fieldName} is required`,
});

export const isEmail = (): ValidationRule => ({
	validator: (value) =>
		typeof value === "string" && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
	message: "Invalid email format",
});

export const minLength = (length: number): ValidationRule => ({
	validator: (value) => typeof value === "string" && value.length >= length,
	message: `Must be at least ${length} characters`,
});

export const passwordStrength = (): ValidationRule => ({
	validator: (value) =>
		typeof value === "string" &&
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]{8,}$/.test(
			value
		),
	message:
		"Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character",
});

export function sanitizeInput(input: string): string {
	// Basic sanitization to prevent XSS
	return input
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/\//g, "&#x2F;");
}

export function validateAndSanitizeInput(schema: ValidationSchema) {
	return async (req: NextRequest) => {
		try {
			const data = await req.json();
			const errors: { [key: string]: string[] } = {};
			const sanitizedData: { [key: string]: any } = {};

			// Validate and sanitize each field against its rules
			Object.keys(schema).forEach((field) => {
				const rules = schema[field];
				const value = data[field];
				const fieldErrors: string[] = [];

				// Handle string sanitization
				if (typeof value === "string") {
					sanitizedData[field] = sanitizeInput(value);
				} else {
					sanitizedData[field] = value;
				}

				rules.forEach((rule) => {
					if (!rule.validator(sanitizedData[field])) {
						fieldErrors.push(rule.message);
					}
				});

				if (fieldErrors.length > 0) {
					errors[field] = fieldErrors;
				}
			});

			if (Object.keys(errors).length > 0) {
				return NextResponse.json({ errors }, { status: 400 });
			}

			// If validation passes, add validated and sanitized data to request
			return { validated: sanitizedData };
		} catch (error) {
			return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
		}
	};
}
