"use client";

import { useState, useEffect } from "react";
import Button from "../Button";
import { formatDate } from "@/utils/stringUtils";

interface PersonalInfoTabProps {
  initialProfile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
  };
  onSave: (profileData: any) => Promise<void>;
  isSaving: boolean;
}

export default function PersonalInfoTab({
  initialProfile,
  onSave,
  isSaving
}: PersonalInfoTabProps) {
  const [profile, setProfile] = useState(initialProfile);

  // Update profile when initialProfile changes
  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Form Fields */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-primary-heading"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={profile?.firstName || ""}
              onChange={handleInputChange}
              className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-primary-heading"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={profile?.lastName || ""}
              onChange={handleInputChange}
              className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-primary-heading"
          >
            Date of Birth
          </label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formatDate(profile?.dateOfBirth)}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
          />
        </div>
        
        <div className="space-y-2">
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-primary-heading"
          >
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={profile?.gender || ""}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          type="submit" 
          text={isSaving ? "Saving..." : "Save Changes"} 
          disabled={isSaving}
        />
      </div>
    </form>
  );
} 