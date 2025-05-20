import "@jest/globals";
import mongoose from "mongoose";

// Skip Jest environment check for Mongoose
mongoose.set('debug', false);
mongoose.set('strictQuery', true);
// @ts-ignore - Add _skipJestEnvironmentCheck to suppress warnings
mongoose._skipJestEnvironmentCheck = true;

import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";

// Suppress Mongoose warnings about Jest environment
process.env.SUPPRESS_MONGOOSE_DEPRECATION_WARNINGS = "true";

// Load environment variables
dotenv.config();

// Set NODE_ENV to test
if (process.env.NODE_ENV !== "test") {
	Object.defineProperty(process.env, "NODE_ENV", { value: "test" });
}

// Set required environment variables for tests
process.env.JWT_SECRET = "test-jwt-secret";
process.env.ENCRYPTION_KEY = "test-encryption-key-32-chars-long!";

let mongoServer: MongoMemoryServer;

let isConnected = false;

// Setup before tests
beforeAll(async () => {
	if (!isConnected) {
		// Create an in-memory MongoDB server for testing
		mongoServer = await MongoMemoryServer.create();
		const uri = mongoServer.getUri();

		// Disconnect if already connected
		if (mongoose.connection.readyState !== 0) {
			await mongoose.disconnect();
		}

		// Connect to the in-memory database
		await mongoose.connect(uri);
		isConnected = true;

		// Override the connectDB function to prevent double connections
		jest.mock("@/config/db", () => ({
			__esModule: true,
			default: jest.fn().mockResolvedValue(true),
		}));
	}
});

// Cleanup after tests
afterAll(async () => {
	if (isConnected) {
		// Disconnect from the database
		await mongoose.disconnect();
		isConnected = false;

		// Stop the in-memory MongoDB server
		if (mongoServer) {
			await mongoServer.stop();
		}
	}
});

// Clear database between tests
afterEach(async () => {
	if (isConnected) {
		const collections = mongoose.connection.collections;

		for (const key in collections) {
			const collection = collections[key];
			await collection.deleteMany({});
		}
	}
});
