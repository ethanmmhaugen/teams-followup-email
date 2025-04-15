// File: api/summarize.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		res.status(405).json({ error: "Only POST method allowed" });
		return;
	}

	const { text } = req.body;

	if (!text || typeof text !== "string") {
		res
			.status(400)
			.json({ error: "Invalid or missing `text` in request body" });
		return;
	}

	try {
		const openaiRes = await fetch(
			"https://api.openai.com/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: "gpt-4",
					messages: [
						{
							role: "system",
							content:
								"Summarize the following meeting transcript and extract key action items clearly.",
						},
						{
							role: "user",
							content: text,
						},
					],
				}),
			}
		);

		const json = await openaiRes.json();
		const summary = json?.choices?.[0]?.message?.content ?? "No summary found.";

		res.status(200).json({ summary });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to generate summary" });
	}
}
