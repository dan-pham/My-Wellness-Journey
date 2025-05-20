import { ValidationRule } from "@/middleware/validation";
import { ProfileGender } from "./types";

const ALLOWED_GENDERS: ProfileGender[] = ['male', 'female', 'other', 'prefer-not-to-say'];

export const isValidName = (fieldName: string): ValidationRule => ({
    validator: (value: string) => typeof value === 'string' && value.length >= 2 && value.length <= 50,
    message: `${fieldName} must be between 2 and 50 characters`,
});

export const isValidDateOfBirth = (): ValidationRule => ({
    validator: (value: string) => {
        if (typeof value !== 'string') return false;
        const date = new Date(value);
        const now = new Date();
        return !isNaN(date.getTime()) && date <= now;
    },
    message: "Date of birth must be a valid date and not in the future",
});

export const isValidGender = (): ValidationRule => ({
    validator: (value: string) => ALLOWED_GENDERS.includes(value as ProfileGender),
    message: `Gender must be one of: ${ALLOWED_GENDERS.join(', ')}`,
});

export const isValidConditions = (): ValidationRule => ({
    validator: (value: unknown) => 
        Array.isArray(value) && 
        value.every(item => typeof item === 'string' && item.length > 0),
    message: "Conditions must be an array of non-empty strings",
}); 