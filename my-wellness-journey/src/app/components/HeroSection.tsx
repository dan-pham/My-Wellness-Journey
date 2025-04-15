import Button from "../components/Button";
import Image from "next/image";

const HeroSection = () => {
	return (
		<section className="w-full mb-16">
			<div className="mx-auto max-w-[1200px] min-h-[600px] flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-20">
				<div className="w-full sm:max-w-[500px] md:max-w-[600px] space-y-6 text-center md:text-left md:pl-8">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-heading leading-tight">
						Take control of your health journey with personalized wellness resources
					</h1>
					<p className="text-lg md:text-xl text-primary-subheading">
						Trusted information tailored to your chronic condition needs
					</p>
					<Button
						text="Get Started Today"
						onClick={() => console.log("Get Started Today Clicked")}
					/>
				</div>
				<div className="relative w-full max-w-[400px] aspect-square mt-8 md:mt-0">
					<Image
						src="https://images.unsplash.com/photo-1505837070343-f0f1722298ea?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
						alt="A man hugging a woman in a garden"
						fill
						className="rounded-lg object-cover"
						priority
					/>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
