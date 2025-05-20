import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { searchMedlinePlus } from "@/lib/api/medlineplus";
import redis, { generateCacheKey, CACHE_TTL } from "@/lib/redis";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

interface GPTRequest {
	prompt?: string;
	query?: string;
	userProfile?: any;
	medlineContent?: string;
}

interface ActionableTask {
	id: string;
	task: string;
	reason: string;
	sourceUrl: string;
}

interface GPTResponse {
	actionableTasks?: ActionableTask[];
	reply?: string;
}

// Helper function to fetch MedlinePlus content
async function fetchMedlinePlusContent(query: string): Promise<string | null> {
	try {
		const medlineData = await searchMedlinePlus(query, 1);
		return medlineData.results.length > 0 ? medlineData.results[0].snippet : null;
	} catch (error) {
		console.error("Error fetching MedlinePlus content:", error);
		return null;
	}
}

// Helper function to generate system and user prompts
function generatePrompts(
	query: string | undefined,
	userProfile: any | undefined,
	contentFromMedline: string | undefined,
	originalPrompt: string | undefined
): { systemPrompt: string; userPrompt: string } {
	// Generate system prompt
	let systemPrompt =
		"You are a helpful, accurate health assistant. Provide brief, actionable health advice.";
	if (userProfile) {
		systemPrompt +=
			" Personalize your advice based on the user profile provided. Be sensitive to their health conditions.";
	}

	// Generate user prompt
	let userPrompt = "";
	if (!contentFromMedline) {
		userPrompt = originalPrompt || "";
	} else {
		userPrompt = `
            Convert the following content about ${query} into a list of 3 to 5 simple, actionable health tasks
            that a person can do today. Each task should be specific, practical, and easily completed in a day.
            For each task, provide:
            1. A clear, action-oriented task description
            2. A patient-friendly medical explanation of why this task is beneficial

            Format the output as a JSON object with the following structure:
            {
                "actionableTasks": [
                    {
                        "id": "task1",
                        "task": "Clear action-oriented task description",
                        "reason": "Patient-friendly medical explanation of the task's benefits",
                        "sourceUrl": ""
                    },
                    ...more tasks
                ]
            }
            
            Content to analyze: ${contentFromMedline}
        `;

		if (userProfile) {
			userPrompt += `\n\nUser profile for personalization: ${JSON.stringify(userProfile)}`;
		}
	}

	return { systemPrompt, userPrompt };
}

// Helper function to handle OpenAI chat completion
async function getChatCompletion(
	systemPrompt: string,
	userPrompt: string,
	shouldFormatAsJson: boolean
): Promise<string> {
	const chatResponse = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		],
		temperature: 0.7,
		response_format: shouldFormatAsJson ? { type: "json_object" } : undefined,
	});

	return chatResponse.choices[0].message.content || "";
}

// Main handler function
export async function POST(req: NextRequest) {
	try {
		// Parse request
		const { prompt, query, userProfile, medlineContent } = await req.json();

		// Validate inputs
		if (!prompt && !query) {
			return NextResponse.json({ error: "Missing prompt or query" }, { status: 400 });
		}

		// Generate cache key based on inputs
		const cacheKey = generateCacheKey(prompt || "", query, userProfile);

		// Try to get cached response
		const cachedResponse = await redis.get(cacheKey);
		if (cachedResponse) {
			return NextResponse.json(JSON.parse(cachedResponse));
		}

		// Fetch MedlinePlus content if needed
		const contentFromMedline =
			medlineContent || (query ? await fetchMedlinePlusContent(query) : null);

		// Generate prompts
		const { systemPrompt, userPrompt } = generatePrompts(
			query,
			userProfile,
			contentFromMedline,
			prompt
		);

		// Get chat completion
		const content = await getChatCompletion(systemPrompt, userPrompt, !!contentFromMedline);

		// Parse and format response
		let response: GPTResponse;

		if (!contentFromMedline) {
			response = { reply: content };
		} else {
			try {
				response = JSON.parse(content || "{}");
			} catch (error) {
				console.error("Error parsing JSON response:", error);
				return NextResponse.json(
					{
						error: "Failed to parse response",
						rawResponse: content,
					},
					{ status: 500 }
				);
			}
		}

		// Cache the response
		await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

		return NextResponse.json(response);
	} catch (err) {
		console.error("ChatGPT API error:", err);
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}
