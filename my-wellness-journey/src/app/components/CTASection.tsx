import React from "react";
import Button from "../components/Button";

const CTASection = () => {
	return (
		<section className="bg-gradient-to-b from-white to-blue-50 py-12">
			<div className="text-center max-w-2xl mx-auto">
				<h2 className="text-xl font-semibold text-primary-heading mb-2">
					Ready to start your wellness journey?
				</h2>
				<p className="text-primary-subheading mb-6">
					Join others in improving their quality of life through personalized resources
				</p>
				<Button
					text="Create Your Free Account"
					className="bg-primary-accent text-white px-6 py-3 rounded-full hover:bg-teal-700 transition"
				/>
			</div>
		</section>
	);
};

export default CTASection;
