"use client";

import { useState } from "react";
import EmailUpdateForm from "./EmailUpdateForm";
import PasswordUpdateForm from "./PasswordUpdateForm";
import DeleteAccountModal from "./DeleteAccountModal";
import Button from "../Button";

interface AccountTabProps {
  userEmail: string;
  onUpdateEmail: (emailData: { currentEmail: string; newEmail: string; confirmEmail: string }) => Promise<void>;
  onUpdatePassword: (passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
  onSignOut: () => void;
  isUpdatingEmail: boolean;
  isUpdatingPassword: boolean;
  isDeletingAccount: boolean;
}

export default function AccountTab({
  userEmail,
  onUpdateEmail,
  onUpdatePassword,
  onSignOut,
  onDeleteAccount,
  isUpdatingEmail,
  isUpdatingPassword,
  isDeletingAccount
}: AccountTabProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async (password: string) => {
    await onDeleteAccount(password);
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-primary-heading mb-6">Account</h3>

        {/* Email Update Section */}
        <EmailUpdateForm 
          currentEmail={userEmail} 
          onUpdateEmail={onUpdateEmail} 
          isUpdating={isUpdatingEmail} 
        />

        {/* Password Update Section */}
        <PasswordUpdateForm 
          onUpdatePassword={onUpdatePassword} 
          isSaving={isUpdatingPassword} 
        />

        {/* Log Out / Delete Account Section */}
        <div className="mt-8">
          <div className="flex flex-col gap-4">
            <Button text="Log out" onClick={onSignOut} className="w-auto w-40" />

            <button
              type="button"
              className="px-4 py-4 mt-4 text-red-600 border border-red-200 rounded-full bg-red-50 hover:bg-red-100 transition-colors duration-200 w-40"
              onClick={handleOpenDeleteModal}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingAccount}
      />
    </div>
  );
} 