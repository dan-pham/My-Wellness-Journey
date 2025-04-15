import React from "react";
import Button from "../components/Button";

const CTASection = () => {
	return (
		<section className="w-full">
			<div className="mx-auto max-w-[1200px] px-4 md:px-8 py-20">
				<div className="text-center max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-12">
					<h2 className="text-3xl md:text-4l font-bold text-primary-heading mb-4">
						Ready to start your wellness journey?
					</h2>
					<p className="text-lg text-primary-subheading mb-8">
						Join others in improving their quality of life through personalized resources
					</p>
					<Button
						text="Create Your Free Account"
						onClick={() => console.log("Create Your Free Account Clicked")}
					/>
				</div>
			</div>
		</section>
	);
};

export default CTASection;
