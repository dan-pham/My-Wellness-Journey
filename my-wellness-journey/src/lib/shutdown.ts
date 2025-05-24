import { closeConnection } from "./db/connection";

async function handleShutdown() {
	console.log("Shutting down gracefully...");

	try {
		// Close database connection
		await closeConnection();
		console.log("Database connection closed successfully");

		// Add any other cleanup tasks here

		process.exit(0);
	} catch (error) {
		console.error("Error during shutdown:", error);
		process.exit(1);
	}
}

// Listen for shutdown signals
process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
	console.error("Uncaught Exception:", error);
	await handleShutdown();
});
