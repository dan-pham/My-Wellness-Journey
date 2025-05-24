import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Button from "../Button";

interface PasswordInputProps {
	value: string;
	onChange: (value: string) => void;
	showPassword: boolean;
	onToggleShow: () => void;
}

const PasswordInput = ({ value, onChange, showPassword, onToggleShow }: PasswordInputProps) => (
	<div>
		<label
			htmlFor="confirmPassword"
			className="block text-sm font-medium text-primary-heading mb-1"
		>
			Password
		</label>
		<div className="relative">
			<input
				type={showPassword ? "text" : "password"}
				id="confirmPassword"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
				required
			/>
			<button
				type="button"
				onClick={onToggleShow}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subheading"
				aria-label={showPassword ? "Hide password" : "Show password"}
			>
				{showPassword ? (
					<FaEyeSlash className="w-5 h-5" color="#3A8C96" />
				) : (
					<FaEye className="w-5 h-5" color="#3A8C96" />
				)}
			</button>
		</div>
	</div>
);

interface CancelButtonProps {
	onClick: () => void;
	disabled?: boolean;
}

const CancelButton = ({ onClick, disabled }: CancelButtonProps) => (
	<button
		type="button"
		onClick={onClick}
		className="px-4 py-2 text-primary-heading border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
		disabled={disabled}
	>
		Cancel
	</button>
);

interface DeleteAccountModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (password: string) => Promise<void>;
	isDeleting: boolean;
}

export default function DeleteAccountModal({
	isOpen,
	onClose,
	onConfirm,
	isDeleting,
}: DeleteAccountModalProps) {
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onConfirm(password);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
				<h3 className="text-xl font-semibold text-red-600 mb-4">Delete Account</h3>

				<p className="mb-6 text-primary-heading">
					This action cannot be undone. All your data will be permanently deleted. Please enter your
					password to confirm.
				</p>

				<form onSubmit={handleSubmit} className="space-y-6">
					<PasswordInput
						value={password}
						onChange={setPassword}
						showPassword={showPassword}
						onToggleShow={() => setShowPassword(!showPassword)}
					/>

					<div className="flex justify-end space-x-4">
						<CancelButton onClick={onClose} disabled={isDeleting} />
						<Button
							type="submit"
							text={isDeleting ? "Deleting..." : "Delete Account"}
							className="!bg-red-600 hover:!bg-red-700"
							disabled={isDeleting || !password}
						/>
					</div>
				</form>
			</div>
		</div>
	);
}
