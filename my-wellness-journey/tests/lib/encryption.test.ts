/**
 * @jest-environment node
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

import * as crypto from "crypto";
import { encrypt, decrypt } from "@/lib/encryption";

// Mock crypto module
jest.mock("crypto", () => ({
	randomBytes: jest.fn(),
	createCipheriv: jest.fn(),
	createDecipheriv: jest.fn(),
}));

describe("Encryption Utils", () => {
	// Store original process.env
	const originalEnv = process.env;

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();

		// Setup environment variables for testing
		process.env.ENCRYPTION_KEY = "test-encryption-key-32-chars-long!";

		// Mock randomBytes to return a consistent IV for testing
		(crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from("1234567890123456"));

		// Mock cipher with update and final methods
		const mockCipher = {
			update: jest.fn().mockReturnValue("encrypted-"),
			final: jest.fn().mockReturnValue("data"),
		};
		(crypto.createCipheriv as jest.Mock).mockReturnValue(mockCipher);

		// Mock decipher with update and final methods
		const mockDecipher = {
			update: jest.fn().mockReturnValue("decrypted-"),
			final: jest.fn().mockReturnValue("data"),
		};
		(crypto.createDecipheriv as jest.Mock).mockReturnValue(mockDecipher);
	});

	afterEach(() => {
		// Restore original process.env
		process.env = originalEnv;
	});

	describe("encrypt function", () => {
		it("should encrypt a string using AES-256-CBC", () => {
			const text = "test-data";
			const encrypted = encrypt(text);

			// Verify randomBytes was called with correct IV length
			expect(crypto.randomBytes).toHaveBeenCalledWith(16);

			// Verify createCipheriv was called with correct algorithm and key
			expect(crypto.createCipheriv).toHaveBeenCalledWith(
				"aes-256-cbc",
				expect.any(Buffer),
				expect.any(Buffer)
			);

			// Verify the cipher's update and final methods were called
			const cipher = (crypto.createCipheriv as jest.Mock).mock.results[0].value;
			expect(cipher.update).toHaveBeenCalledWith(text, "utf8", "hex");
			expect(cipher.final).toHaveBeenCalledWith("hex");

			// Verify the encrypted result format (IV:encryptedData)
			expect(encrypted).toBe("31323334353637383930313233343536:encrypted-data");
		});

		it("should handle encryption errors gracefully", () => {
			// Setup createCipheriv to throw an error
			(crypto.createCipheriv as jest.Mock).mockImplementationOnce(() => {
				throw new Error("Encryption error");
			});

			// Temporarily suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			const text = "test-data";
			const result = encrypt(text);

			// Should return unencrypted marker with original text
			expect(result).toBe("UNENCRYPTED:test-data");

			// Restore console.error
			console.error = originalConsoleError;
		});
	});

	describe("decrypt function", () => {
		it("should decrypt an encrypted string", () => {
			const encrypted = "31323334353637383930313233343536:encrypted-data";
			const decrypted = decrypt(encrypted);

			// Verify createDecipheriv was called with correct algorithm, key and IV
			expect(crypto.createDecipheriv).toHaveBeenCalledWith(
				"aes-256-cbc",
				expect.any(Buffer),
				expect.any(Buffer)
			);

			// Verify the decipher's update and final methods were called
			const decipher = (crypto.createDecipheriv as jest.Mock).mock.results[0].value;
			expect(decipher.update).toHaveBeenCalledWith("encrypted-data", "hex", "utf8");
			expect(decipher.final).toHaveBeenCalledWith("utf8");

			// Verify the decrypted result
			expect(decrypted).toBe("decrypted-data");
		});

		it("should return original text for strings marked as unencrypted", () => {
			const unencrypted = "UNENCRYPTED:test-data";
			const result = decrypt(unencrypted);

			// Should return the original text without the marker
			expect(result).toBe("test-data");

			// createDecipheriv should not be called
			expect(crypto.createDecipheriv).not.toHaveBeenCalled();
		});

		it("should handle decryption errors gracefully", () => {
			// Setup createDecipheriv to throw an error
			(crypto.createDecipheriv as jest.Mock).mockImplementationOnce(() => {
				throw new Error("Decryption error");
			});

			// Temporarily suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			const encrypted = "invalid:encrypted-data";
			const result = decrypt(encrypted);

			// Should return the original text on error
			expect(result).toBe("invalid:encrypted-data");

			// Restore console.error
			console.error = originalConsoleError;
		});
	});

	// Test with different environment configurations
	describe("environment configuration", () => {
		it("should use fallback key when ENCRYPTION_KEY is not set", () => {
			// Remove encryption key from environment
			delete process.env.ENCRYPTION_KEY;

			const text = "test-data";
			encrypt(text); // This should use the fallback key

			// Verify createCipheriv was called (meaning it worked with fallback)
			expect(crypto.createCipheriv).toHaveBeenCalled();
		});

		it("should pad short keys and truncate long keys to 32 bytes", () => {
			// Test with short key
			process.env.ENCRYPTION_KEY = "short-key";
			encrypt("test");

			// Key should have been padded to 32 chars
			const args1 = (crypto.createCipheriv as jest.Mock).mock.calls[0];
			expect(args1[1].length).toBe(32);

			jest.clearAllMocks();

			// Test with long key
			process.env.ENCRYPTION_KEY = "this-is-a-very-long-encryption-key-that-exceeds-32-characters";
			encrypt("test");

			// Key should have been truncated to 32 chars
			const args2 = (crypto.createCipheriv as jest.Mock).mock.calls[0];
			expect(args2[1].length).toBe(32);
		});
	});
});
