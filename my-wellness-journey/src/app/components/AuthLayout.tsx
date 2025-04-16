import Image from "next/image";
import Link from "next/link";
import Footer from "./Footer";
import PageGradient from "./PageGradient";

interface AuthLayoutProps {
	children: React.ReactNode;
	route: string;
	alternateLink: {
		text: string;
		linkText: string;
		href: string;
	};
}

const AuthLayout = ({ children, route, alternateLink }: AuthLayoutProps) => {
	return (
		<main className="min-h-screen w-full">
			<PageGradient type="top">
				<nav className="p-4 md:p-6">
					<Link href="/" className="flex items-center gap-2">
						<Image
							src="/logo.png"
							alt="My Wellness Journey Logo"
							width={40}
							height={40}
							className="rounded-full"
						/>
						<p className="text-xl font-bold text-primary-accent">My Wellness Journey</p>
					</Link>
				</nav>
			</PageGradient>

			{/* Breadcrumb */}
			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 mt-8">
				<div className="flex items-center gap-2 text-sm text-primary-subheading mb-8">
					<Link href="/" className="hover:text-primary-accent transition-colors duration-200">
						Home
					</Link>
					<span>/</span>
					<span className="text-primary-subheading">{route}</span>
				</div>
			</div>

			{/* Main content */}
			<PageGradient type="bottom">
				<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12 pb-24 md:pb-32">
					<div className="flex flex-col md:flex-row items-center justify-between gap-12">
						{/* Left side - Text and Image */}
						<div className="w-full md:w-[45%] space-y-6">
							<div className="space-y-2">
								<h1 className="text-3xl md:text-4xl font-bold text-primary-heading">
									Take control of your health
								</h1>
								<p className="text-lg text-primary-subheading">Live life to your fullest</p>

								<div className="relative aspect-square w-full rounded-2xl overflow-hidden">
									<Image
										src="https://images.unsplash.com/photo-1586498024141-1940debde48d?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
										alt="Grandpa carrying granddaughter"
										fill
										className="object-cover"
										priority
									/>
								</div>
							</div>
						</div>

						{/* Right side - Form */}
						<div className="w-full md:w-[45%]">
							<div className="bg-white rounded-2xl shadow-lg p-8 w-full md:max-w-[400px] border border-gray-100">
								<h2 className="text-2xl font-semibold text-primary-heading text-center">{route}</h2>
								<div className="mt-4 text-center text-primary-subheading mb-8">
									<span>{alternateLink.text} </span>
									<Link
										href={alternateLink.href}
										className="text-primary-accent hover:text-primary-accent/80 font-medium transition-colors duration-200"
									>
										{alternateLink.linkText}
									</Link>
								</div>
								{children}
							</div>
						</div>
					</div>
				</div>
			</PageGradient>

			<Footer />
		</main>
	);
};

export default AuthLayout;
