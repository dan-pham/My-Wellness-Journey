import crypto from "crypto";

// Get encryption key from environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-fallback-encryption-key-32-chars!!";
const ENCRYPTION_KEY_BUFFER = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
const IV_LENGTH = 16; // For AES, this is always 16

// Encryption function
export function encrypt(text: string): string {
	try {
		const iv = crypto.randomBytes(IV_LENGTH);
		const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY_BUFFER, iv);
		let encrypted = cipher.update(text, "utf8", "hex");
		encrypted += cipher.final("hex");
		return iv.toString("hex") + ":" + encrypted;
	} catch (error) {
		console.error("Encryption error:", error);
		// Return a marker that this is unencrypted
		return "UNENCRYPTED:" + text;
	}
}

// Decryption function
export function decrypt(text: string): string {
	try {
		// If the text is marked as unencrypted, just return the original
		if (text.startsWith("UNENCRYPTED:")) {
			return text.substring(12);
		}

		const textParts = text.split(":");
		const iv = Buffer.from(textParts.shift()!, "hex");
		const encryptedText = textParts.join(":");
		const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY_BUFFER, iv);
		let decrypted = decipher.update(encryptedText, "hex", "utf8");
		decrypted += decipher.final("utf8");
		return decrypted;
	} catch (error) {
		console.error("Decryption error:", error);
		// Return the original text if decryption fails
		return text;
	}
}
