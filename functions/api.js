import { marked } from "marked";

import promptPrefix from "./prompt.txt"

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const query = url.searchParams.get("query");
	const secret = url.searchParams.get("secret");

    try {
        // Check if the query exists
        if (!query) throw new Error("Missing query parameter");
		if (secret != context.env.SECRET) throw new Error("You're not allowed in. Scram!");

        // Embed query into a prompt for ChatGPT
        const prompt = promptPrefix + query;

        // Call OpenAI's API
        const apiKey = context.env.OPENAI_API_KEY; // Set in your Cloudflare environment variables
        const apiUrl = "https://api.openai.com/v1/chat/completions";

        const body = JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body,
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const answer =
            data.choices[0]?.message?.content || "No response from API.";

		const linkPrompt = "I am a Japanese learner around the N2 level, I would like to ask some questions about the following passage from a book: " + query
        const encodedPrompt = encodeURIComponent(linkPrompt);
        const chatGPTLink = `https://chat.openai.com/?q=${encodedPrompt}`;

        // QR Code API (Google Chart API)
        const qrCodeLink = `https://quickchart.io/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(
            chatGPTLink
        )}`;

        // HTML response with QR code and ChatGPT link
        const htmlResponse = `
			<html>
			<head>
				<title>Ask GPT</title>
				<link rel="stylesheet" href="/style.css" />
			</head>
			<body>
				<div class="prompt">${query}</div>
				<div class="response">${marked(answer)}</div>
				<img src="${qrCodeLink}" alt="QR Code to ChatGPT" />
			</body>
			</html>
		`;

        return new Response(htmlResponse, {
            headers: { "Content-Type": "text/html; charset=UTF-8" },
        });
    } catch (error) {
        return new Response(
            `<html><body><h1>Error</h1><p>${error.message}</p></body></html>`,
            { headers: { "Content-Type": "text/html" } }
        );
    }
}
