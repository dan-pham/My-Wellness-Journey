/**
 * @jest-environment node
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

import { NextRequest, NextResponse } from "next/server";
import {
	validateAndSanitizeInput,
	isRequired,
	isEmail,
	minLength,
	passwordStrength,
	sanitizeInput,
	ValidationSchema,
} from "@/middleware/validation";

describe("Validation Middleware", () => {
	// Mock request creator helper
	function createMockRequest(data: Record<string, any>) {
		return {
			json: jest.fn().mockResolvedValue(data),
		} as unknown as NextRequest;
	}

	describe("validation rules", () => {
		it("isRequired should validate non-empty values", () => {
			const rule = isRequired("Field");

			// Valid values
			expect(rule.validator("value")).toBe(true);
			expect(rule.validator(0)).toBe(true);
			expect(rule.validator(false)).toBe(true);

			// Invalid values
			expect(rule.validator("")).toBe(false);
			expect(rule.validator(null)).toBe(false);
			expect(rule.validator(undefined)).toBe(false);

			// Check message
			expect(rule.message).toBe("Field is required");
		});

		it("isEmail should validate email format", () => {
			const rule = isEmail();

			// Valid emails
			expect(rule.validator("test@example.com")).toBe(true);
			expect(rule.validator("user.name+tag@domain.co.uk")).toBe(true);

			// Invalid emails
			expect(rule.validator("not-an-email")).toBe(false);
			expect(rule.validator("@missing-username.com")).toBe(false);
			expect(rule.validator("missing-domain@")).toBe(false);
			expect(rule.validator("missing-dot@domain")).toBe(false);
			expect(rule.validator(123)).toBe(false); // non-string

			// Check message
			expect(rule.message).toBe("Invalid email format");
		});

		it("minLength should validate string length", () => {
			const rule = minLength(5);

			// Valid strings
			expect(rule.validator("12345")).toBe(true);
			expect(rule.validator("longer than five")).toBe(true);

			// Invalid strings
			expect(rule.validator("1234")).toBe(false);
			expect(rule.validator("")).toBe(false);
			expect(rule.validator(123)).toBe(false); // non-string

			// Check message
			expect(rule.message).toBe("Must be at least 5 characters");
		});

		it("passwordStrength should validate strong passwords", () => {
			const rule = passwordStrength();

			// Valid passwords
			expect(rule.validator("StrongP@ss1")).toBe(true);
			expect(rule.validator("C0mpl3x!Password")).toBe(true);

			// Invalid passwords - missing requirements
			expect(rule.validator("weakpassword")).toBe(false); // No uppercase, number, or special char
			expect(rule.validator("ALLCAPS123")).toBe(false); // No lowercase or special char
			expect(rule.validator("NoNumbers!")).toBe(false); // No number
			expect(rule.validator("N0special")).toBe(false); // No special char
			expect(rule.validator("Short1!")).toBe(false); // Too short
			expect(rule.validator(12345678)).toBe(false); // Non-string

			// Check message contains explanation
			expect(rule.message).toContain("Password must contain");
		});
	});

	describe("sanitizeInput", () => {
		it("should sanitize HTML and script tags", () => {
			const unsafeInput = '<script>alert("XSS")</script><b>Bold</b>';
			const sanitized = sanitizeInput(unsafeInput);

			expect(sanitized).toBe(
				"&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;&lt;b&gt;Bold&lt;&#x2F;b&gt;"
			);
		});

		it("should sanitize quotes and slashes", () => {
			const unsafeInput = `" ' / backlash\\`;
			const sanitized = sanitizeInput(unsafeInput);

			expect(sanitized).toBe("&quot; &#x27; &#x2F; backlash\\");
		});
	});

	describe("validateAndSanitizeInput", () => {
		it("should validate and sanitize input based on schema", async () => {
			// Create a validation schema
			const schema: ValidationSchema = {
				name: [isRequired("Name"), minLength(2)],
				email: [isRequired("Email"), isEmail()],
			};

			// Create validator middleware
			const validator = validateAndSanitizeInput(schema);

			// Valid data
			const req = createMockRequest({
				name: "John",
				email: "john@example.com",
			});

			const result = await validator(req);

			// Should return validated data
			expect(result).toEqual({
				validated: {
					name: "John",
					email: "john@example.com",
				},
			});
		});

		it("should sanitize HTML in input values", async () => {
			// Create a validation schema
			const schema: ValidationSchema = {
				name: [isRequired("Name")],
			};

			// Create validator middleware
			const validator = validateAndSanitizeInput(schema);

			// Data with HTML
			const req = createMockRequest({
				name: "<script>alert('XSS')</script>",
			});

			const result = await validator(req);

			// Should return sanitized data
			expect(result).toEqual({
				validated: {
					name: "&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;&#x2F;script&gt;",
				},
			});
		});

		it("should return validation errors for invalid data", async () => {
			// Suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Create a validation schema
			const schema: ValidationSchema = {
				name: [isRequired("Name"), minLength(2)],
				email: [isRequired("Email"), isEmail()],
				password: [isRequired("Password"), minLength(8), passwordStrength()],
			};

			// Create validator middleware
			const validator = validateAndSanitizeInput(schema);

			// Invalid data
			const req = createMockRequest({
				name: "",
				email: "not-an-email",
				password: "weak",
			});

			const result = await validator(req);

			// Should be a response with errors
			expect(result).toBeInstanceOf(NextResponse);

			const response = result as NextResponse;
			expect(response.status).toBe(400);

			const body = await response.json();

			// Should have errors for each field
			expect(body.errors).toBeDefined();
			expect(body.errors.name).toContain("Name is required");
			expect(body.errors.email).toContain("Invalid email format");
			expect(body.errors.password).toHaveLength(2); // minLength and passwordStrength

			// Restore console.error
			console.error = originalConsoleError;
		});

		it("should handle errors in request parsing", async () => {
			// Suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Create a validation schema
			const schema: ValidationSchema = {
				name: [isRequired("Name")],
			};

			// Create validator middleware
			const validator = validateAndSanitizeInput(schema);

			// Request that throws when json() is called
			const req = {
				json: jest.fn().mockRejectedValue(new Error("JSON parse error")),
			} as unknown as NextRequest;

			const result = await validator(req);

			// Should be an error response
			expect(result).toBeInstanceOf(NextResponse);

			const response = result as NextResponse;
			expect(response.status).toBe(400);

			const body = await response.json();
			expect(body).toEqual({ error: "Invalid request data" });

			// Restore console.error
			console.error = originalConsoleError;
		});
	});
});
