"use client";

interface ProfileTabsProps {
	activeTab: string;
	onTabChange: (tab: string) => void;
}

export const ProfileTabs = ({ activeTab, onTabChange }: ProfileTabsProps) => {
	const tabs = [
		{ id: "health", label: "Health Conditions" },
		{ id: "personal", label: "Personal Information" },
		{ id: "account", label: "Account" },
	];

	return (
		<div className="border-b border-gray-200 mb-8">
			<nav className="flex gap-8">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={`pb-4 px-1 font-medium transition-colors duration-200 relative
                            ${
															activeTab === tab.id
																? "text-primary-accent"
																: "text-primary-subheading hover:text-primary-heading"
														}`}
					>
						{tab.label}
						{activeTab === tab.id && (
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-accent" />
						)}
					</button>
				))}
			</nav>
		</div>
	);
};
