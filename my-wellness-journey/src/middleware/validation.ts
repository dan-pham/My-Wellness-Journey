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
	return async (req: NextRequest | any) => {
		let data: any;
		
		try {
			// If req is already the data object, use it directly
			if (typeof req === 'object' && !('json' in req)) {
				data = req;
			} else {
				// Otherwise, try to parse it as a request
				data = await req.json();
			}
		} catch (error) {
			console.error('Validation middleware - JSON parse error:', error);
			return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
		}

		const errors: { [key: string]: string[] } = {};
		const sanitizedData: { [key: string]: any } = {};

		// Validate and sanitize each field against its rules
		for (const field of Object.keys(schema)) {
			const rules = schema[field];
			const value = data[field];
			const fieldErrors: string[] = [];

			// Skip sanitization for date fields and gender enums
			if (field === 'dateOfBirth' || field === 'gender') {
				sanitizedData[field] = value;
			}
			// Handle string sanitization for simple string values
			else if (typeof value === 'string') {
				sanitizedData[field] = sanitizeInput(value);
			} 
			// Handle arrays of objects with string properties
			else if (Array.isArray(value)) {
				sanitizedData[field] = value.map(item => {
					if (typeof item === 'string') {
						return sanitizeInput(item);
					}
					if (typeof item === 'object' && item !== null) {
						const sanitizedItem: any = {};
						for (const [key, val] of Object.entries(item)) {
							sanitizedItem[key] = typeof val === 'string' ? sanitizeInput(val) : val;
						}
						return sanitizedItem;
					}
					return item;
				});
			}
			// Handle other values as-is
			else {
				sanitizedData[field] = value;
			}

			// Apply validation rules
			for (const rule of rules) {
				try {
					if (!rule.validator(sanitizedData[field])) {
						fieldErrors.push(rule.message);
						break; // Stop on first validation failure for this field
					}
				} catch (error) {
					console.error(`Validation error for field ${field}:`, error);
					fieldErrors.push('Invalid value provided');
				}
			}

			if (fieldErrors.length > 0) {
				errors[field] = fieldErrors;
			}
		}

		if (Object.keys(errors).length > 0) {
			console.error('Validation middleware - Validation errors:', errors);
			return NextResponse.json({ errors }, { status: 400 });
		}

		return { validated: sanitizedData };
	};
}
