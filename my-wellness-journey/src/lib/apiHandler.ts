import { NextRequest, NextResponse } from "next/server";
import { runCorsMiddleware } from "./cors";

type ApiHandler = (
	req: NextRequest,
	context: { params: Record<string, string | string[]> }
) => Promise<NextResponse>;

type RateLimiter = (req: NextRequest) => Promise<NextResponse | null>;

export function withApiMiddleware(
	handler: ApiHandler,
	options: {
		rateLimiter?: RateLimiter;
		enableCors?: boolean;
	} = {}
) {
	return async function (req: NextRequest, context: { params: Record<string, string | string[]> }) {
		try {
			// Create a response scaffold for CORS headers
			const res = NextResponse.next();

			// Apply CORS if enabled
			if (options.enableCors !== false) {
				await runCorsMiddleware(req, res);
			}

			// Apply rate limiting if provided
			if (options.rateLimiter) {
				const rateLimitResponse = await options.rateLimiter(req);
				if (rateLimitResponse) {
					// Add CORS headers to rate limit response
					res.headers.forEach((value, key) => {
						if (key.toLowerCase().startsWith("access-control-")) {
							rateLimitResponse.headers.set(key, value);
						}
					});
					return rateLimitResponse;
				}
			}

			// Call the original handler
			const response = await handler(req, context);

			// Add CORS headers to the response
			res.headers.forEach((value, key) => {
				if (key.toLowerCase().startsWith("access-control-")) {
					response.headers.set(key, value);
				}
			});

			return response;
		} catch (error) {
			console.error("API error:", error);

			// Create error response with more details in test environment
			const errorMessage = process.env.NODE_ENV === 'test' 
				? `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				: "An error occurred processing your request";
				
			const errorResponse = NextResponse.json(
				{ error: errorMessage },
				{ status: 500 }
			);

			return errorResponse;
		}
	};
}
