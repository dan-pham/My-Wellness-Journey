import { ValidationRule, isEmail, minLength, passwordStrength } from "@/middleware/validation";

export const isValidName = (fieldName: string): ValidationRule => ({
    validator: (value: string) => typeof value === 'string' && value.length >= 2 && value.length <= 50,
    message: `${fieldName} must be between 2 and 50 characters`,
});

export const createUserValidationSchema = {
    firstName: [isValidName("First name")],
    lastName: [isValidName("Last name")],
    email: [isEmail()],
    password: [minLength(8), passwordStrength()],
}; 