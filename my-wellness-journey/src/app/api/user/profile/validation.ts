import { ValidationRule } from "@/middleware/validation";

const ALLOWED_GENDERS = ["male", "female", "non-binary", "prefer-not-to-say", ""] as const;

export const isValidName = (fieldName: string): ValidationRule => ({
	validator: (value: string) =>
		typeof value === "string" && value.length >= 2 && value.length <= 50,
	message: `${fieldName} must be between 2 and 50 characters`,
});

export const isValidDateOfBirth = (): ValidationRule => ({
	validator: (value: string) => {
		if (!value) return true; // Allow empty value

		const date = new Date(value);
		const now = new Date();

		// Check if it's a valid date
		if (isNaN(date.getTime())) {
			throw new Error("Invalid date format");
		}

		// Check if date is in the future
		if (date > now) {
			throw new Error("Date of birth cannot be in the future");
		}

		// Check if date is too far in the past (e.g., over 120 years)
		const minDate = new Date();
		minDate.setFullYear(now.getFullYear() - 120);
		if (date < minDate) {
			throw new Error("Date of birth cannot be more than 120 years ago");
		}

		return true;
	},
	message: "Invalid date of birth", // This is a fallback message
});

export const isValidGender = (): ValidationRule => ({
	validator: (value: string) => ALLOWED_GENDERS.includes(value as any),
	message: `Gender must be one of: ${ALLOWED_GENDERS.filter((g) => g !== "").join(", ")} or empty`,
});

export const isValidConditions = (): ValidationRule => ({
	validator: (value: any) => {
		// If no conditions, that's valid
		if (!value || !Array.isArray(value)) return false;

		// Check each condition in the array
		return value.every(
			(condition) =>
				condition &&
				typeof condition === "object" &&
				typeof condition.id === "string" &&
				condition.id.length > 0 &&
				typeof condition.name === "string" &&
				condition.name.length > 0
		);
	},
	message: "Conditions must be an array of objects with non-empty id and name strings",
});
