"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Button from "../Button";

interface PasswordUpdateFormProps {
  onUpdatePassword: (passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  isSaving: boolean;
}

export default function PasswordUpdateForm({ 
  onUpdatePassword,
  isSaving 
}: PasswordUpdateFormProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdatePassword(passwordData);
    
    // Reset form after submission
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <form
      className="space-y-6 bg-white rounded-lg border border-gray-200 p-6"
      onSubmit={handleSubmit}
    >
      <h4 className="font-medium text-primary-heading">Change Password</h4>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-primary-heading mb-1"
          >
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordInputChange}
              className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subheading"
            >
              {showCurrentPassword ? (
                <FaEyeSlash className="w-5 h-5" color="#3A8C96" />
              ) : (
                <FaEye className="w-5 h-5" color="#3A8C96" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-primary-heading mb-1"
          >
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordInputChange}
              className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subheading"
            >
              {showNewPassword ? (
                <FaEyeSlash className="w-5 h-5" color="#3A8C96" />
              ) : (
                <FaEye className="w-5 h-5" color="#3A8C96" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-primary-heading mb-1"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordInputChange}
              className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subheading"
            >
              {showConfirmPassword ? (
                <FaEyeSlash className="w-5 h-5" color="#3A8C96" />
              ) : (
                <FaEye className="w-5 h-5" color="#3A8C96" />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button 
          type="submit" 
          text={isSaving ? "Updating..." : "Update Password"} 
          disabled={isSaving}
        />
      </div>
    </form>
  );
} 