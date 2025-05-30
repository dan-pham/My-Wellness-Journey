import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	render(): ReactNode {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="error-container">
						<h2>Oops! Something went wrong.</h2>
						<p>Please try again or contact support if the problem persists.</p>
					</div>
				)
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
