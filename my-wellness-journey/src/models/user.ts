import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
	{
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			unique: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
			select: false, // Don't include in queries by default
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

// Hash password before saving
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	const saltRounds = 10;
	this.password = await bcrypt.hash(this.password, saltRounds);
	next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model("User", userSchema);
