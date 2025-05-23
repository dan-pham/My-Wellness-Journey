import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import { authenticate } from "@/middleware/auth";
import { validateAndSanitizeInput, isRequired, isEmail } from "@/middleware/validation";
import { ensureConnection } from "@/lib/db/connection";

export async function PUT(req: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authenticate(req);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { userId } = authResult;

        // Validate input
        const validationSchema = {
            currentEmail: [isRequired("Current email"), isEmail()],
            newEmail: [isRequired("New email"), isEmail()],
        };

        const validationResult = await validateAndSanitizeInput(validationSchema)(req);
        if (validationResult instanceof NextResponse) {
            return validationResult;
        }

        const { currentEmail, newEmail } = validationResult.validated;

        // Connect to database
        await ensureConnection();

        // Find user and verify current email
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.email !== currentEmail) {
            return NextResponse.json({ error: "Current email is incorrect" }, { status: 400 });
        }

        // Check if new email is already in use
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser && existingUser._id.toString() !== userId) {
            return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
        }

        // Update email
        user.email = newEmail;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "Email updated successfully"
        });
    } catch (error) {
        console.error("Email update error:", error);
        return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
    }
} 