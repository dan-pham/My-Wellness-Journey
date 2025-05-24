import { Error } from "./Error";
import Header from "./Header";
import Footer from "./Footer";

interface DashboardErrorProps {
	error: string;
	variant?: "error" | "warning" | "info";
	onRetry?: () => void;
}

export const DashboardError: React.FC<DashboardErrorProps> = ({
	error,
	variant = "error",
	onRetry,
}) => {
	return (
		<div className="min-h-screen bg-background">
			<Header />
			<div className="container mx-auto px-4 py-8">
				<Error
					title="Failed to load dashboard"
					message={error}
					variant={variant}
					retryable={true}
					onRetry={onRetry}
					className="mt-8"
				/>
			</div>
			<Footer />
		</div>
	);
};
