import cors from "cors";
import { NextRequest, NextResponse } from "next/server";

// CORS configuration
const corsOptions = {
	origin:
		process.env.NODE_ENV === "production"
			? ["https://your-domain.com"] // TODO: Replace with your production domain
			: ["http://localhost:3000"],
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
	maxAge: 86400, // 24 hours in seconds
};

// Initialize CORS middleware with options
const corsMiddleware = cors(corsOptions);

// Helper function to run CORS middleware in a NextJS API route
export function runCorsMiddleware(req: NextRequest, res: NextResponse) {
	return new Promise<void>((resolve, reject) => {
		// Create mock req/res objects that CORS can use
		const mockReq: any = {
			method: req.method,
			headers: Object.fromEntries(req.headers),
		};

		const mockRes: any = {
			statusCode: 200,
			getHeader: (name: string) => {
				return mockRes.headers?.[name.toLowerCase()];
			},
			setHeader: (name: string, value: string | string[]) => {
				mockRes.headers = mockRes.headers || {};
				mockRes.headers[name.toLowerCase()] = value;
				return mockRes;
			},
			headers: {},
			end: () => {
				resolve();
			},
		};

		// Run the CORS middleware
		corsMiddleware(mockReq, mockRes, (result: any) => {
			if (result instanceof Error) {
				return reject(result);
			}

			// Forward headers from mock response to actual response
			Object.entries(mockRes.headers || {}).forEach(([name, value]) => {
				if (value !== undefined) {
					res.headers.set(name, value as string);
				}
			});

			resolve();
		});
	});
}
