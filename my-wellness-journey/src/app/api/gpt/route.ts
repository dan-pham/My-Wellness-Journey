import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { searchMedlinePlus } from "@/lib/api/medlineplus";
import redis, { generateCacheKey, CACHE_TTL } from "@/lib/redis";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
	try {
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
			console.log("Cache hit for:", cacheKey);
			return NextResponse.json(JSON.parse(cachedResponse));
		}

		console.log("Cache miss for:", cacheKey);

		// Choose the appropriate prompt based on the input
		let promptToUse = prompt;

		// If we have a query, we'll fetch MedlinePlus content if not provided
		let contentFromMedline = medlineContent;
		if (query && !contentFromMedline) {
			try {
				const medlineData = await searchMedlinePlus(query, 1);
				if (medlineData.results.length > 0) {
					contentFromMedline = medlineData.results[0].snippet;
				}
			} catch (error) {
				console.error("Error fetching MedlinePlus content:", error);
			}
		}

		// Generate system prompt based on what we have
		let systemPrompt =
			"You are a helpful, accurate health assistant. Provide brief, actionable health advice.";

		if (userProfile) {
			systemPrompt +=
				" Personalize your advice based on the user profile provided. Be sensitive to their health conditions.";
		}

		let userPrompt = "";

		// If we're generating tips from MedlinePlus content
		if (contentFromMedline) {
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

			// If we have user profile, add it to personalize the response
			if (userProfile) {
				userPrompt += `\n\nUser profile for personalization: ${JSON.stringify(userProfile)}`;
			}
		} else {
			// Use the provided prompt directly
			userPrompt = promptToUse;
		}

		const chatResponse = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.7,
			response_format: contentFromMedline ? { type: "json_object" } : undefined,
		});

		// Parse the response if it's JSON
		const content = chatResponse.choices[0].message.content;
		let response;

		if (contentFromMedline) {
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
		} else {
			response = { reply: content };
		}

		// Cache the response
		await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

		return NextResponse.json(response);
	} catch (err) {
		console.error("ChatGPT API error:", err);
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}
