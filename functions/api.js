import { marked } from "marked";

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    // Check if the query exists
    if (!query) {
        return new Response(
            `<html><body><h1>Error</h1><p>No query provided. Please add a 'query' parameter to the URL.</p></body></html>`,
            { headers: { "Content-Type": "text/html" } }
        );
    }

    // Embed query into a prompt for ChatGPT
    const prompt = `Translate the following Japanese sentence and explain its meaning in English: ${query}`;

    // Call OpenAI's API
    const apiKey = context.env.OPENAI_API_KEY; // Set in your Cloudflare environment variables
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const body = JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    try {
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

        const encodedPrompt = encodeURIComponent(prompt);
        const chatGPTLink = `https://chat.openai.com/?prompt=${encodedPrompt}`;

        // QR Code API (Google Chart API)
        const qrCodeLink = `https://quickchart.io/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(
            chatGPTLink
        )}`;

        // HTML response with QR code and ChatGPT link
        const htmlResponse = `
			<html>
			<head>
				<title>ChatGPT Prompt</title>
			</head>
			<body>
				<h1>Your ChatGPT Prompt</h1>
				<p><strong>Prompt:</strong> ${query}</p>
				<p>${marked(answer)}</p>
				<h2>QR Code</h2>
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
