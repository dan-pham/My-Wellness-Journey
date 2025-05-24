import mongoose from "mongoose";
import User, { IUser } from "@/models/user";
import bcrypt from "bcryptjs";

// Mock bcrypt for controlled testing
jest.mock("bcryptjs", () => ({
	genSalt: jest.fn().mockResolvedValue("mockedsalt"),
	hash: jest.fn().mockImplementation((password, salt) => Promise.resolve(`hashed:${password}`)),
	compare: jest.fn().mockImplementation((plainPassword, hashedPassword) => {
		// Just match when passwords match after hashing
		return Promise.resolve(hashedPassword === `hashed:${plainPassword}`);
	}),
}));

describe("User Model", () => {
	// Connect to in-memory database before tests
	// This is handled by the global setup in setup.ts

	beforeAll(async () => {
		// Ensure indexes are created before running tests
		await User.init();
	});

	// Clear database after each test
	// This is also handled by the global setup in setup.ts

	// Test user creation
	it("should create a new user with encrypted password", async () => {
		// Count of users before adding
		const userCountBefore = await User.countDocuments();

		// Test data
		const userData = {
			email: "test@example.com",
			password: "password123",
		};

		// Create a new user
		const user = new User(userData);
		await user.save();

		// Find the saved user
		const savedUser = await User.findOne({ email: userData.email }).select("+password");

		// Check that the user was created
		expect(savedUser).not.toBeNull();

		// Count of users after adding
		const userCountAfter = await User.countDocuments();
		expect(userCountAfter).toBe(userCountBefore + 1);

		// Check that email was saved correctly
		expect(savedUser!.email).toBe(userData.email);

		// Check that password was hashed
		expect(savedUser!.password).not.toBe(userData.password);
		expect(savedUser!.password).toBe(`hashed:${userData.password}`);

		// Verify bcrypt was called correctly
		expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
		expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, "mockedsalt");
	});

	// Test email uniqueness
	it("should not allow duplicate emails", async () => {
		// Create a user first
		await User.create({
			email: "duplicate@example.com",
			password: "password123",
		});

		// Try to create another user with the same email
		const duplicateUser = new User({
			email: "duplicate@example.com",
			password: "differentpassword",
		});

		// Expect it to throw an error
		await expect(duplicateUser.save()).rejects.toThrow();
	});

	// Test password comparison - correct password
	it("should correctly verify a valid password", async () => {
		// Create a user
		const user = await User.create({
			email: "compare@example.com",
			password: "correctpassword",
		});

		// Set up bcrypt.compare to return true for this specific test
		(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

		// Retrieve the user WITH password field
		const savedUser = await User.findOne({ email: "compare@example.com" }).select("+password");
		expect(savedUser).not.toBeNull();

		// Test password comparison
		const isMatch = await savedUser!.comparePassword("correctpassword");
		expect(isMatch).toBe(true);

		// Verify bcrypt.compare was called
		expect(bcrypt.compare).toHaveBeenCalled();
	});

	// Test password comparison - wrong password
	it("should correctly reject an invalid password", async () => {
		// Create a user
		const user = await User.create({
			email: "compare2@example.com",
			password: "correctpassword",
		});

		// Set up bcrypt.compare to return false for this specific test
		(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

		// Retrieve the user WITH password field
		const savedUser = await User.findOne({ email: "compare2@example.com" }).select("+password");
		expect(savedUser).not.toBeNull();

		// Test password comparison
		const isMatch = await savedUser!.comparePassword("wrongpassword");
		expect(isMatch).toBe(false);
	});

	// Test password not visible in queries by default
	it("should not include password in queries by default", async () => {
		// Create a user
		await User.create({
			email: "hidden@example.com",
			password: "hiddenpassword",
		});

		// Retrieve the user without explicitly selecting password
		const user = await User.findOne({ email: "hidden@example.com" });

		// Expect password to be undefined
		expect(user).not.toBeNull();
		expect(user!.password).toBeUndefined();

		// Verify password exists when explicitly selected
		const userWithPassword = await User.findOne({ email: "hidden@example.com" }).select(
			"+password"
		);
		expect(userWithPassword!.password).toBeDefined();
	});

	// Test password requirements (minlength)
	it("should require a password of at least 6 characters", async () => {
		// Try to create a user with a short password
		const user = new User({
			email: "short@example.com",
			password: "12345", // 5 characters, min is 6
		});

		// Expect validation error
		await expect(user.save()).rejects.toThrow();
	});

	// Test email requirements - try a completely invalid email format
	it("should require a valid email", async () => {
		// Create a user with a completely invalid email format
		const invalidUser = new User({
			email: "@", // Clearly invalid email format
			password: "password123",
		});

		// Attempt to save and expect it to fail
		await expect(invalidUser.save()).rejects.toThrow();
	});

	// Test password hashing only happens when password changes
	it("should only hash password when it is modified", async () => {
		// Create a user
		const user = await User.create({
			email: "modified@example.com",
			password: "password123",
		});

		// Reset the mock call count
		(bcrypt.genSalt as jest.Mock).mockClear();
		(bcrypt.hash as jest.Mock).mockClear();

		// Retrieve and update user without changing password
		const savedUser = await User.findOne({ email: "modified@example.com" }).select("+password");
		savedUser!.email = "modified2@example.com";
		await savedUser!.save();

		// Verify bcrypt was not called again
		expect(bcrypt.genSalt).not.toHaveBeenCalled();
		expect(bcrypt.hash).not.toHaveBeenCalled();
	});

	// Test comparePassword error handling
	it("should handle errors in comparePassword", async () => {
		// Create a user
		const user = await User.create({
			email: "error@example.com",
			password: "password123",
		});

		// Retrieve the user WITH password field
		const savedUser = await User.findOne({ email: "error@example.com" }).select("+password");
		expect(savedUser).not.toBeNull();

		// Mock bcrypt.compare to throw an error
		(bcrypt.compare as jest.Mock).mockRejectedValueOnce(new Error("Comparison failed"));

		// Test password comparison
		await expect(savedUser!.comparePassword("password123")).rejects.toThrow();
	});
});
