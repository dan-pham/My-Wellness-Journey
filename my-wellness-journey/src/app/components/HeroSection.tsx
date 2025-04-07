import Button from "../components/Button";
import Image from "next/image";

const HeroSection = () => {
	return (
		<section className="flex flex-col-reverse md:flex-row items-center justify-between px-20 py-20 bg-gradient-to-b from-gradient-start to-gradient-end max-md:px-10 max-sm:px-5">
			<div className="max-w-xl">
				<h1 className="text-5xl md:text-5xl font-bold text-primary-heading mb-4">
					Take control of your health journey with personalized wellness resources
				</h1>
				<p className="text-xl text-primary-subheading mb-8">
					Trusted information tailored to your chronic condition needs
				</p>
				<Button text="Get Started Today" onClick={() => console.log("Get Started Clicked")} />
			</div>
			<div className="mb-10 md:mb-0 md:ml-10">
				<Image
					src="https://images.unsplash.com/photo-1505837070343-f0f1722298ea?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
					alt="A man hugging a woman in a garden"
					width={400}
					height={400}
					className="rounded-lg object-cover"
				/>
			</div>
		</section>
	);
};

export default HeroSection;
