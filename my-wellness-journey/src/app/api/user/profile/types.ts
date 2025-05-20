export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: ProfileGender;
    conditions?: string[];
}

export type ProfileGender = 'male' | 'female' | 'other' | 'prefer-not-to-say'; 