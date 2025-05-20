import mongoose from "mongoose";

export async function ensureConnection() {
	if (mongoose.connection.readyState === 1) {
		// Already connected
		return;
	}

	if (mongoose.connection.readyState === 2) {
		// Connecting
		await new Promise((resolve) => {
			mongoose.connection.once("connected", resolve);
		});
		return;
	}

	// Not connected, connect
	await mongoose.connect(process.env.MONGODB_URI!);
}

export async function closeConnection() {
	// Only disconnect if we're not in a test environment
	if (process.env.NODE_ENV !== "test" && mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
	}
}
