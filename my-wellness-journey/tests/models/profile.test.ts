import mongoose from "mongoose";
import Profile from "@/models/profile";
import User from "@/models/user";
import * as encryption from "@/lib/encryption";

// Mock encryption functions without modifying the actual value
// This avoids validation errors with enum values
jest.mock("@/lib/encryption", () => ({
	encrypt: jest.fn((text) => text), // Just return the original value
	decrypt: jest.fn((text) => text), // Just return the original value
}));

describe("Profile Model", () => {
	// We'll need a user ID for tests
	let userId: mongoose.Types.ObjectId;

	// Create a test user before tests
	beforeAll(async () => {
		const user = await User.create({
			email: "profile-test@example.com",
			password: "password123",
		});
		userId = user._id;
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	// Test profile creation
	it("should create a new profile with encrypted fields", async () => {
		// Count of profiles before adding
		const profileCountBefore = await Profile.countDocuments();

		// Test data
		const profileData = {
			userId,
			firstName: "John",
			lastName: "Doe",
			dateOfBirth: new Date("1990-01-01"),
			gender: "male",
			conditions: [{ id: "c1", name: "Condition 1" }],
		};

		// Create a new profile
		const profile = new Profile(profileData);
		await profile.save();

		// Count of profiles after adding
		const profileCountAfter = await Profile.countDocuments();
		expect(profileCountAfter).toBe(profileCountBefore + 1);

		// Verify encryption was called for sensitive fields
		expect(encryption.encrypt).toHaveBeenCalled();
	});

	// Test retrieving profile data - decryption should happen
	it("should decrypt fields when getting profile data", async () => {
		// Create a profile
		const profileData = {
			userId,
			firstName: "Jane",
			lastName: "Smith",
			gender: "female",
		};
		const profile = await Profile.create(profileData);

		// Clear the mock calls from the creation
		(encryption.encrypt as jest.Mock).mockClear();
		(encryption.decrypt as jest.Mock).mockClear();

		// Retrieve the profile
		const savedProfile = await Profile.findById(profile._id);

		// Verify the profile was found
		expect(savedProfile).not.toBeNull();

		// Verify data was decrypted
		expect(savedProfile!.firstName).toBe("Jane");
		expect(savedProfile!.lastName).toBe("Smith");
		expect(savedProfile!.gender).toBe("female");

		// Verify decrypt was called
		expect(encryption.decrypt).toHaveBeenCalled();
	});

	// Test updating profile data
	it("should encrypt fields when updating profile data", async () => {
		// Create a profile
		const profile = await Profile.create({
			userId,
			firstName: "Update",
			lastName: "Test",
			gender: "male",
		});

		// Clear the mock calls from the creation
		(encryption.encrypt as jest.Mock).mockClear();

		// Update the profile
		profile.firstName = "Updated";
		profile.gender = "non-binary";
		await profile.save();

		// Verify encrypt was called for the updated fields
		expect(encryption.encrypt).toHaveBeenCalledWith("Updated");
		expect(encryption.encrypt).toHaveBeenCalledWith("non-binary");
		expect(encryption.encrypt).not.toHaveBeenCalledWith("Test"); // Last name didn't change
	});

	// Test user ID relation
	it("should enforce uniqueness of user ID", async () => {
		// Create a profile for our test user
		await Profile.create({
			userId,
			firstName: "Unique",
			lastName: "User",
		});

		// Try to create another profile for the same user
		const duplicateProfile = new Profile({
			userId,
			firstName: "Another",
			lastName: "Profile",
		});

		// Expect it to throw an error
		await expect(duplicateProfile.save()).rejects.toThrow();
	});

	// Test adding saved resources
	it("should correctly add and retrieve saved resources", async () => {
		// Create a profile
		const profile = await Profile.create({
			userId,
			firstName: "Resource",
			lastName: "Tester",
		});

		// Add a saved resource
		profile.savedResources.push({
			id: "resource-1",
			savedAt: new Date(),
		});
		await profile.save();

		// Retrieve the profile
		const savedProfile = await Profile.findById(profile._id);

		// Verify saved resource was added
		expect(savedProfile!.savedResources.length).toBe(1);
		expect(savedProfile!.savedResources[0].id).toBe("resource-1");
	});

	// Test adding saved tips
	it("should correctly add and retrieve saved tips", async () => {
		// Create a profile
		const profile = await Profile.create({
			userId,
			firstName: "Tip",
			lastName: "Tester",
		});

		// Add a saved tip
		profile.savedTips.push({
			id: "tip-1",
			savedAt: new Date(),
		});
		await profile.save();

		// Retrieve the profile
		const savedProfile = await Profile.findById(profile._id);

		// Verify saved tip was added
		expect(savedProfile!.savedTips.length).toBe(1);
		expect(savedProfile!.savedTips[0].id).toBe("tip-1");
	});

	// Test conditions array
	it("should correctly add and retrieve health conditions", async () => {
		// Create a profile
		const profile = await Profile.create({
			userId,
			firstName: "Condition",
			lastName: "Tester",
		});

		// Add conditions
		profile.conditions = [
			{ id: "condition-1", name: "Diabetes" },
			{ id: "condition-2", name: "Hypertension" },
		];
		await profile.save();

		// Clear encryption mocks
		(encryption.encrypt as jest.Mock).mockClear();
		(encryption.decrypt as jest.Mock).mockClear();

		// Retrieve the profile
		const savedProfile = await Profile.findById(profile._id);

		// Verify conditions were added and decrypted
		expect(savedProfile!.conditions.length).toBe(2);
		expect(savedProfile!.conditions[0].name).toBe("Diabetes");
		expect(savedProfile!.conditions[1].name).toBe("Hypertension");

		// Verify encryption was used for condition names
		expect(encryption.decrypt).toHaveBeenCalled();
	});

	// Test error handling in encryption/decryption
	it("should handle encryption errors gracefully", async () => {
		// Mock an encryption error for this test
		(encryption.encrypt as jest.Mock).mockImplementationOnce(() => {
			throw new Error("Encryption error");
		});

		// Temporarily suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Create a profile
		const profile = await Profile.create({
			userId,
			firstName: "Error", // This will trigger the error
			lastName: "Handler",
		});

		// Verify profile was created despite encryption error
		expect(profile).toBeDefined();
		expect(profile.firstName).toBe("Error");

		// Restore console.error
		console.error = originalConsoleError;
	});

	it("should handle decryption errors gracefully", async () => {
		// Create a profile
		const profile = await Profile.create({
			userId,
			firstName: "Decrypt",
			lastName: "Error",
		});

		// Clear mocks
		(encryption.decrypt as jest.Mock).mockClear();

		// Mock a decryption error for this test
		(encryption.decrypt as jest.Mock).mockImplementationOnce(() => {
			throw new Error("Decryption error");
		});

		// Temporarily suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Retrieve the profile
		const savedProfile = await Profile.findById(profile._id);

		// Should still return the profile
		expect(savedProfile).toBeDefined();

		// Restore console.error
		console.error = originalConsoleError;
	});

	// Test required fields validation
	it("should require firstName and lastName", async () => {
		// Try to create a profile without required fields
		const invalidProfile = new Profile({
			userId,
			// Missing firstName and lastName
		});

		// Expect it to throw a validation error
		await expect(invalidProfile.save()).rejects.toThrow();
	});

	// Test gender enum validation
	it("should validate gender enum values", async () => {
		// Try to create a profile with invalid gender
		const invalidProfile = new Profile({
			userId,
			firstName: "Gender",
			lastName: "Test",
			gender: "invalid-gender", // Not in the enum
		});

		// Expect it to throw a validation error
		await expect(invalidProfile.save()).rejects.toThrow();
	});
});
