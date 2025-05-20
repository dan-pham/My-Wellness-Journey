"use client";

import { useState } from "react";
import Button from "../Button";

interface EmailUpdateFormProps {
  currentEmail: string;
  onUpdateEmail: (emailData: { currentEmail: string; newEmail: string; confirmEmail: string }) => Promise<void>;
  isUpdating: boolean;
}

export default function EmailUpdateForm({ 
  currentEmail, 
  onUpdateEmail,
  isUpdating 
}: EmailUpdateFormProps) {
  const [emailData, setEmailData] = useState({
    currentEmail: currentEmail,
    newEmail: "",
    confirmEmail: "",
  });

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateEmail(emailData);
    
    // Reset form after submission
    setEmailData({
      currentEmail: currentEmail,
      newEmail: "",
      confirmEmail: "",
    });
  };

  return (
    <form
      className="space-y-6 bg-white rounded-lg border border-gray-200 p-6 mb-8"
      onSubmit={handleSubmit}
    >
      <h4 className="font-medium text-primary-heading">Change Email Address</h4>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="currentEmail"
            className="block text-sm font-medium text-primary-heading mb-1"
          >
            Current Email Address
          </label>
          <input
            type="email"
            id="currentEmail"
            name="currentEmail"
            value={currentEmail}
            className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
            readOnly
            required
          />
        </div>
        <div>
          <label
            htmlFor="newEmail"
            className="block text-sm font-medium text-primary-heading mb-1"
          >
            New Email Address
          </label>
          <input
            type="email"
            id="newEmail"
            name="newEmail"
            value={emailData.newEmail}
            onChange={handleEmailInputChange}
            className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
            required
          />
        </div>
        <div>
          <label
            htmlFor="confirmEmail"
            className="block text-sm font-medium text-primary-heading mb-1"
          >
            Confirm New Email Address
          </label>
          <input
            type="email"
            id="confirmEmail"
            name="confirmEmail"
            value={emailData.confirmEmail}
            onChange={handleEmailInputChange}
            className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
            required
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          text={isUpdating ? "Updating..." : "Update Email"}
          disabled={isUpdating}
        />
      </div>
    </form>
  );
} 