export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '';
    conditions?: Array<{ id: string; name: string }>;
}

export type ProfileGender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | ''; 