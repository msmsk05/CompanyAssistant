
module.exports = async function (context, req) {

    try {

        const question = req.body?.message || "";

        // Azure AI Search
        const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
        const searchKey = process.env.AZURE_SEARCH_KEY;
        const searchIndex = process.env.AZURE_SEARCH_INDEX;

        // Azure OpenAI
        const openAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const openAiKey = process.env.AZURE_OPENAI_API_KEY;
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

        // SEARCH
        const searchResponse = await fetch(
            `${searchEndpoint}/indexes/${searchIndex}/docs/search?api-version=2024-07-01`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": searchKey
                },
                body: JSON.stringify({
                    search: question,
                    top: 5
                })
            }
        );

        const searchResults = await searchResponse.json();

        const sources = searchResults.value || [];

        const contextText = sources
            .map(doc =>
                `DOCUMENT: ${doc.title}\n\n${doc.chunk}`)
            .join("\n\n--------------------------------\n\n");

        const prompt = `
You are Contoso Knowledge Copilot.

Use ONLY the document excerpts provided below.

Rules:
1. Answer using the document excerpts.
2. Summarize and explain clearly.
3. If partial information exists, provide the best answer possible.
4. Only say "I couldn't find that information in the company documents." if the answer truly does not appear in the excerpts.
5. Do not invent policies or procedures.

DOCUMENT EXCERPTS:

${contextText}

QUESTION:
${question}

ANSWER:
`;

        // OPENAI
        const openAiResponse = await fetch(
            `${openAiEndpoint}openai/deployments/${deployment}/chat/completions?api-version=2024-10-21`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": openAiKey
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: "You are a helpful document assistant."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    max_completion_tokens: 1000
                })
            }
        );

        const openAiResult = await openAiResponse.json();

        const answer =
            openAiResult.choices?.[0]?.message?.content ||
            "No response received.";

        const citationList = [
            ...new Set(
                sources
                    .map(source => source.title)
                    .filter(Boolean)
            )
        ];

        return {
            status: 200,
            body: {
                answer,
                sources: citationList
            }
        };

    } catch (error) {

        return {
            status: 500,
            body: {
                answer: `Error: ${error.message}`,
                sources: []
            }
        };

    }
};
