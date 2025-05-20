import mongoose, { Document, Schema, Types } from "mongoose";
import { encrypt, decrypt } from "@/lib/encryption";

interface SavedItem {
	id: string;
	savedAt: Date;
}

// Define the Profile interface
export interface IProfile extends Document {
	userId: Types.ObjectId;
	firstName: string;
	lastName: string;
	dateOfBirth?: Date;
	gender?: string;
	conditions?: Array<{ id: string; name: string }>;
	savedResources?: SavedItem[];
	savedTips?: SavedItem[];
	createdAt: Date;
	updatedAt: Date;
}

// Helper function to safely encrypt/decrypt values
const safeEncrypt = (value: string | undefined | null): string | undefined => {
	if (!value) return undefined;
	try {
		return encrypt(value);
	} catch (error) {
		console.error("Encryption error:", error);
		return value; // Return original value if encryption fails
	}
};

const safeDecrypt = (value: string | undefined | null): string | undefined => {
	if (!value) return undefined;
	try {
		return decrypt(value);
	} catch (error) {
		console.error("Decryption error:", error);
		return value; // Return original value if decryption fails
	}
};

// Create the profile schema
const profileSchema = new Schema<IProfile>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
		},
		firstName: {
			type: String,
			required: [true, "First name is required"],
			trim: true,
			get: (value: string) => safeDecrypt(value),
			set: (value: string) => safeEncrypt(value),
		},
		lastName: {
			type: String,
			required: [true, "Last name is required"],
			trim: true,
			get: (value: string) => safeDecrypt(value),
			set: (value: string) => safeEncrypt(value),
		},
		dateOfBirth: {
			type: Date,
			get: (value: Date) =>
				value ? new Date(safeDecrypt(value.toString()) || value.toString()) : value,
			set: (value: Date) => (value ? safeEncrypt(value.toString()) : value),
		},
		gender: {
			type: String,
			enum: ["male", "female", "non-binary", "prefer-not-to-say", ""],
			get: (value: string) => safeDecrypt(value),
			set: (value: string) => safeEncrypt(value),
		},
		conditions: [
			{
				id: String,
				name: {
					type: String,
					get: (value: string) => safeDecrypt(value),
					set: (value: string) => safeEncrypt(value),
				},
			},
		],
		savedResources: [
			{
				id: String,
				savedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		savedTips: [
			{
				id: String,
				savedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{
		timestamps: true,
		toJSON: { getters: true },
		toObject: { getters: true },
	}
);

// Create and export the model
const Profile = mongoose.models.Profile || mongoose.model<IProfile>("Profile", profileSchema);
export default Profile;
