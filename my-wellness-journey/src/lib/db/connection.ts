import mongoose from "mongoose";

// Track connection status
let isConnecting = false;

export async function ensureConnection() {
	// If already connected, return
	if (mongoose.connection.readyState === 1) {
		return;
	}

	// If connecting, wait for connection
	if (mongoose.connection.readyState === 2 || isConnecting) {
		await new Promise((resolve) => {
			mongoose.connection.once("connected", resolve);
		});
		return;
	}

	// Connect if not connected
	try {
		isConnecting = true;
		await mongoose.connect(process.env.MONGODB_URI!);
		isConnecting = false;
	} catch (error) {
		isConnecting = false;
		throw error;
	}
}

// Only use this when application is shutting down
export async function closeConnection() {
	if (process.env.NODE_ENV !== "test" && mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
	}
}
