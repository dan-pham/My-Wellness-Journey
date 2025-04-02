import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	throw new Error("Missing MONGODB_URI in environment variables");
}

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(MONGODB_URI);
		console.log(`MongoDB Connected`);
	} catch (error) {
		console.error("Error: ", error);
		process.exit(1);
	}
};

export default connectDB;
