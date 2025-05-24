import Profile from "@/models/profile";

export function formatProfileResponse(profile: any) {
	return {
		firstName: profile.firstName,
		lastName: profile.lastName,
		dateOfBirth: profile.dateOfBirth,
		gender: profile.gender,
		conditions: profile.conditions || [],
		savedResources: profile.savedResources || [],
		savedTips: profile.savedTips || [],
		createdAt: profile.createdAt,
		updatedAt: profile.updatedAt,
	};
}

export async function findProfileOrFail(userId: string) {
	const profile = await Profile.findOne({ userId });
	if (!profile) {
		throw new Error("Profile not found");
	}
	
	// Initialize arrays if they don't exist (for backward compatibility)
	if (!profile.conditions) profile.conditions = [];
	if (!profile.savedResources) profile.savedResources = [];
	if (!profile.savedTips) profile.savedTips = [];
	
	return profile;
}
