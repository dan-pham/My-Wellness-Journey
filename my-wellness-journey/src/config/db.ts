import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!MONGODB_URI) {
	throw new Error("Missing MONGODB_URI in environment variables");
}

// Warn about encryption key, but don't fail if it's missing
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
	console.warn("Warning: ENCRYPTION_KEY missing or too short. Using fallback key for development.");
}

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(MONGODB_URI, {
			ssl: true,
		});
		console.log(`MongoDB Connected`);
	} catch (error) {
		console.error("Error: ", error);
		process.exit(1);
	}
};

export default connectDB;
