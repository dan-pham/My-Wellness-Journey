import Image from "next/image";
import Link from "next/link";
import Footer from "./Footer";
import PageGradient from "./PageGradient";

// Types and Interfaces
interface AuthLayoutProps {
	children: React.ReactNode;
	route: string;
	alternateLink: {
		text: string;
		linkText: string;
		href: string;
	};
}

interface NavbarProps {
	logoSrc: string;
}

interface BreadcrumbProps {
	route: string;
}

interface ContentSideProps {
	title: string;
	subtitle: string;
	imageSrc: string;
}

interface FormContainerProps {
	route: string;
	alternateLink: AuthLayoutProps["alternateLink"];
	children: React.ReactNode;
}

// Components
const Navbar: React.FC<NavbarProps> = ({ logoSrc }) => (
	<nav className="p-4 md:p-6">
		<Link href="/" className="flex items-center gap-2">
			<Image
				src={logoSrc}
				alt="My Wellness Journey Logo"
				width={40}
				height={40}
				className="rounded-full"
			/>
			<p className="text-xl font-bold text-primary-accent">My Wellness Journey</p>
		</Link>
	</nav>
);

const Breadcrumb: React.FC<BreadcrumbProps> = ({ route }) => (
	<div data-testid="breadcrumb" className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 mt-8">
		<div className="flex items-center gap-2 text-sm text-primary-subheading mb-8">
			<Link href="/" className="hover:text-primary-accent transition-colors duration-200">
				Home
			</Link>
			<span>/</span>
			<span className="text-primary-subheading">{route}</span>
		</div>
	</div>
);

const ContentSide: React.FC<ContentSideProps> = ({ title, subtitle, imageSrc }) => (
	<div className="w-full md:w-[45%] space-y-6">
		<div className="space-y-2">
			<h1 className="text-3xl md:text-4xl font-bold text-primary-heading">{title}</h1>
			<p className="text-lg text-primary-subheading">{subtitle}</p>

			<div className="relative aspect-square w-full rounded-2xl overflow-hidden">
				<Image
					src={imageSrc}
					alt="Grandpa carrying granddaughter"
					fill
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
					className="object-cover"
					priority
				/>
			</div>
		</div>
	</div>
);

const FormContainer: React.FC<FormContainerProps> = ({ route, alternateLink, children }) => (
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
);

// Main Component
const AuthLayout: React.FC<AuthLayoutProps> = ({ children, route, alternateLink }) => {
	return (
		<main className="min-h-screen w-full">
			<PageGradient type="top">
				<Navbar logoSrc="/logo.png" />
			</PageGradient>

			<Breadcrumb route={route} />

			<div
				data-testid="auth-content-container"
				className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12 pb-24 md:pb-32"
			>
				<div className="flex flex-col md:flex-row items-center justify-between gap-12">
					<ContentSide
						title="Take control of your health"
						subtitle="Live life to your fullest"
						imageSrc="https://images.unsplash.com/photo-1586498024141-1940debde48d?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
					/>
					<FormContainer route={route} alternateLink={alternateLink}>
						{children}
					</FormContainer>
				</div>
			</div>

			<Footer />
		</main>
	);
};

export default AuthLayout;
