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
		model: "gpt-4",
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
		const answer = data.choices[0]?.message?.content || "No response from API.";

		// Return the result as a simple HTML page
		return new Response(
			`<html><body><h1>Result</h1><p>${answer}</p></body></html>`,
			{ headers: { "Content-Type": "text/html" } }
		);
	} catch (error) {
		return new Response(
			`<html><body><h1>Error</h1><p>${error.message}</p></body></html>`,
			{ headers: { "Content-Type": "text/html" } }
		);
	}
}
