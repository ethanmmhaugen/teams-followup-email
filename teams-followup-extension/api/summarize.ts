// File: api/summarize.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	console.log("In function");
	if (req.method !== "POST")
		return res.status(405).json({ error: "Only POST allowed" });

	const { text } = req.body;
	if (!text) return res.status(400).json({ error: "Missing transcript text" });

	try {
		const ASSISTANT_ID = process.env.ASSISTANT_ID!;
		const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
		console.log("creating thread");
		// Create a new thread
		const threadRes = await fetch("https://api.openai.com/v1/threads", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				"Content-Type": "application/json",
				"OpenAI-Beta": "assistants=v2",
			},
		});

		const thread = await threadRes.json();
		console.log(thread);
		console.log("Adding Message");
		// Add the message (your transcript) to the thread
		await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				"Content-Type": "application/json",
				"OpenAI-Beta": "assistants=v2",
			},
			body: JSON.stringify({
				role: "user",
				content: text,
			}),
		});
		console.log("added message to the thread");

		// Run the assistant
		const runRes = await fetch(
			`https://api.openai.com/v1/threads/${thread.id}/runs`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${OPENAI_API_KEY}`,
					"Content-Type": "application/json",
					"OpenAI-Beta": "assistants=v2",
				},
				body: JSON.stringify({
					assistant_id: ASSISTANT_ID,
				}),
			}
		);
		console.log("ran agent");

		const run = await runRes.json();
		if (run.error) {
			console.error("Run creation failed:", run.error);
			return res.status(500).json({ error: run.error.message || "Run failed" });
		}

		// Poll until the run is complete
		let status = run.status;
		let retries = 0;
		while (status !== "completed" && retries < 10) {
			console.log(retries);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			const checkRun = await fetch(
				`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`,
				{
					headers: {
						Authorization: `Bearer ${OPENAI_API_KEY}`,
						"OpenAI-Beta": "assistants=v2",
					},
				}
			);
			const checkData = await checkRun.json();
			if (checkData.error) {
				console.error("Run polling error:", checkData.error);
				return res.status(500).json({ error: checkData.error.message });
			}

			status = checkData.status;
			retries++;
		}

		// Get the assistant’s reply
		const messagesRes = await fetch(
			`https://api.openai.com/v1/threads/${thread.id}/messages`,
			{
				headers: {
					Authorization: `Bearer ${OPENAI_API_KEY}`,
					"OpenAI-Beta": "assistants=v2",
				},
			}
		);

		const messagesData = await messagesRes.json();
		console.log(messagesData);
		const finalMessage = messagesData.data.find(
			(msg: { role: string }) => msg.role === "assistant"
		);

		res.status(200).json({
			summary: finalMessage?.content?.[0]?.text?.value || "No reply received.",
		});
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.json({ error: "Failed to communicate with OpenAI Assistant" });
	}
}
