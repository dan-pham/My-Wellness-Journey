"use client";

import { useState } from "react";
import { FaTimes, FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import Button from "../components/Button";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuthNavigation } from "../hooks/useAuthNavigation";

export default function ProfilePage() {
	const [activeTab, setActiveTab] = useState("health");

	const [conditions, setConditions] = useState([
		"Hypertension",
		"Type 2 Diabetes",
		"Osteoarthritis",
		"Chronic Obstructive Pulmonary Disease (COPD)",
		"Sleep Apnea",
		"Depression",
		"Gastroesophageal Reflux Disease (GERD)",
		"Obesity",
	]);

	const [newCondition, setNewCondition] = useState("");

	const commonConditions = [
		"Hypertension",
		"Type 2 Diabetes",
		"Osteoarthritis",
		"Chronic Obstructive Pulmonary Disease (COPD)",
		"Sleep Apnea",
		"Depression",
		"Gastroesophageal Reflux Disease (GERD)",
		"Obesity",
	];

	const handleAddCondition = () => {
		if (newCondition && !conditions.includes(newCondition)) {
			setConditions([...conditions, newCondition]);
			setNewCondition("");
		}
	};

	const handleRemoveCondition = (condition: string) => {
		setConditions(conditions.filter((c) => c !== condition));
	};

	const [userData, setUserData] = useState({
		firstName: "John",
		lastName: "Cooper",
		email: "john.cooper@gmail.com",
		dateOfBirth: "1955-12-12",
	});

	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const { handleSignOut } = useAuthNavigation();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Saving changes:", userData);
	};

	return (
		<main className="min-h-screen w-full">
			<Header />
			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
				{/* Page Header */}
				<div className="mb-8">
					<h1 className="text-3xl md:text-4xl font-bold text-primary-heading mb-2">
						My Health Profile
					</h1>
					<p className="text-primary-subheading">Manage your conditions and account</p>
				</div>

				{/* Profile Tabs */}
				<div className="border-b border-gray-200 mb-8">
					<nav className="flex gap-8">
						{["health", "personal", "account"].map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`pb-4 px-1 font-medium transition-colors duration-200 relative
                                        ${
																					activeTab === tab
																						? "text-primary-accent"
																						: "text-primary-subheading hover:text-primary-heading"
																				}`}
							>
								{tab === "health" && "Health Conditions"}
								{tab === "personal" && "Personal Information"}
								{tab === "account" && "Password"}
								{activeTab === tab && (
									<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-accent" />
								)}
							</button>
						))}
					</nav>
				</div>

				{/* Content */}
				<div className="max-w-2xl">
					{activeTab === "health" && (
						<div className="space-y-8">
							<div>
								<h3 className="text-xl font-semibold text-primary-heading mb-4">My Conditions</h3>

								{/* Add condition input */}
								<div className="flex gap-2 mb-6">
									<input
										type="text"
										placeholder="Add a condition"
										value={newCondition}
										onChange={(e) => setNewCondition(e.target.value)}
										className="flex-1 px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
									/>
									<Button text="Add" onClick={handleAddCondition} className="!px-6" />
								</div>

								{/* Current conditions */}
								<div className="flex flex-wrap gap-2 mb-8">
									{conditions.map((condition) => (
										<div
											key={condition}
											className="flex items-center gap-2 px-3 py-1.5 bg-primary-accent/10 text-primary-accent rounded-full text-sm"
										>
											{condition}
											<button
												onClick={() => handleRemoveCondition(condition)}
												className="hover:text-primary-heading transition-colors duration-200"
											>
												<FaTimes className="w-3 h-3" />
											</button>
										</div>
									))}
								</div>
							</div>

							{/* Common conditions */}
							<div>
								<h3 className="text-xl font-semibold text-primary-heading mb-4">
									Common Conditions
								</h3>
								<div className="flex flex-wrap gap-2">
									{commonConditions.map(
										(condition) =>
											!conditions.includes(condition) && (
												<button
													key={condition}
													onClick={() => setConditions([...conditions, condition])}
													className="flex items-center gap-1 px-3 py-1.5 border border-primary-accent/30 text-primary-accent rounded-full text-sm hover:bg-primary-accent/10 transition-all duration-200"
												>
													<FaPlus className="w-3 h-3" />
													{condition}
												</button>
											)
									)}
								</div>
							</div>

							<div className="flex justify-end">
								<Button
									text="Save Changes"
									onClick={() => console.log("Saving conditions:", conditions)}
								/>
							</div>
						</div>
					)}

					{activeTab === "personal" && (
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
											value={userData.firstName}
											onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
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
											value={userData.lastName}
											onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
											className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<label htmlFor="email" className="block text-sm font-medium text-primary-heading">
										Email Address
									</label>
									<input
										type="email"
										id="email"
										value={userData.email}
										onChange={(e) => setUserData({ ...userData, email: e.target.value })}
										className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
									/>
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
										value={userData.dateOfBirth}
										onChange={(e) => setUserData({ ...userData, dateOfBirth: e.target.value })}
										className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200"
									/>
								</div>
							</div>

							{/* Save Button */}
							<div className="flex justify-end">
								<Button type="submit" text="Save Changes" />
							</div>
						</form>
					)}

					{activeTab === "account" && (
						<div className="space-y-8">
							<div>
								<h3 className="text-xl font-semibold text-primary-heading mb-6">Password</h3>

								{/* Password Update Section */}
								<form
									className="space-y-6 bg-white rounded-lg border border-gray-200 p-6"
									onSubmit={(e) => {
										e.preventDefault();
										// TODO: Implement password update logic
										alert("Password updated!");
									}}
								>
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
										<Button type="submit" text="Update Password" />
									</div>
								</form>

								{/* Delete Account Section */}
								<div className="mt-8">
									<h3 className="text-xl font-semibold text-primary-heading mb-6">Account</h3>

									<div className="flex flex-col gap-4">
										<Button text="Log out" onClick={handleSignOut} className="w-auto w-40" />

										<button
											type="button"
											className="px-4 py-4 mt-4 text-red-600 border border-red-200 rounded-full bg-red-50 hover:bg-red-100 transition-colors duration-200 w-40"
											onClick={() =>
												window.confirm("Are you sure you want to delete your account?") &&
												alert("Account deleted!")
											}
										>
											Delete Account
										</button>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
			<Footer />
		</main>
	);
}
