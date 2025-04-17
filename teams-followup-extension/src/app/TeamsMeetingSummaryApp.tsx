// File: /src/app/TeamsMeetingSummaryApp.tsx
import React, { useState } from "react";
import { loadOfficeJs } from "../util/LoadOfficeJs";

const TeamsMeetingSummaryApp = () => {
	const [transcript, setTranscript] = useState("");
	const [summary, setSummary] = useState("");

	const handleTranscriptionSubmit = async () => {
		if (!transcript) return;

		const response = await fetch("/api/summarize", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text: transcript }),
		});

		const data = await response.json();
		setSummary(data.summary);
	};

	const openOutlookDraft = () => {
		if (!summary) return;

		loadOfficeJs(() => {
			Office.context.mailbox.displayNewMessageForm({
				toRecipients: [], // you can prefill with emails later
				subject: "Follow-Up: Your Subject Here", // optionally pull from response.subject
				htmlBody: summary.replace(/\n/g, "<br>"), // convert newlines to HTML
			});
		});
	};

	const copyToClipboard = () => {
		if (!summary) return;
		navigator.clipboard.writeText(summary).then(
			() => {
				alert("Summary copied to clipboard!");
			},
			(err) => {
				console.error("Failed to copy text: ", err);
			}
		);
	};

	return (
		<div style={{ padding: "1rem" }}>
			<h2>Teams Meeting Follow-up Generator</h2>
			<textarea
				placeholder="Paste your meeting transcript here"
				rows={10}
				style={{ width: "100%" }}
				value={transcript}
				onChange={(e) => setTranscript(e.target.value)}
			/>
			<button onClick={handleTranscriptionSubmit}>Generate Summary</button>
			{summary && (
				<>
					<h3>Suggested Summary</h3>
					<div
						style={{
							whiteSpace: "pre-wrap",
							border: "1px solid #ccc",
							padding: "0.5rem",
						}}>
						{summary}
					</div>
					{typeof Office !== "undefined" && Office.context?.mailbox ? (
						<button onClick={openOutlookDraft}>Open in Outlook</button>
					) : (
						<button onClick={copyToClipboard}>Copy Summary to Clipboard</button>
					)}
				</>
			)}
		</div>
	);
};

export default TeamsMeetingSummaryApp;
