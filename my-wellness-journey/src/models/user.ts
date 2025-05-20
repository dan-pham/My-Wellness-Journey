import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Define the User interface
export interface IUser extends Document {
	email: string;
	password: string;
	comparePassword: (password: string) => Promise<boolean>;
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: [true, "Email is required"],
			trim: true,
			unique: true,
			lowercase: true,
			match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
			select: false, // Don't include in queries by default
		},
	},
	{
		timestamps: true,
	}
);

// Hash password before saving
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error: any) {
		next(error);
	}
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
	try {
		return await bcrypt.compare(password, this.password);
	} catch (error) {
		return false;
	}
};

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;
