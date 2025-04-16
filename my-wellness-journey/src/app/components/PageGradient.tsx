import React from "react";

interface PageGradientProps {
	children: React.ReactNode;
	type: "top" | "bottom";
}

const PageGradient = ({ children, type }: PageGradientProps) => {
	return (
		<div className="relative">
			{type === "top" && (
				<div
					className={`absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-[#E8F4FF] to-transparent pointer-events-none`}
					style={{ zIndex: -1 }}
				/>
			)}

			{type === "bottom" && (
				<div
					className={`absolute bottom-0 left-0 right-0 h-[800px] bg-gradient-to-t from-[#E8F4FF] to-transparent pointer-events-none`}
					style={{ zIndex: -1 }}
				/>
			)}

			<div className="relative">{children}</div>
		</div>
	);
};

export default PageGradient;
