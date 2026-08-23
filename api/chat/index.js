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

        // Search documents
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
                    top: 3
                })
            }
        );

        const searchResults = await searchResponse.json();

        const sources = searchResults.value || [];

        const contextText = sources
            .map(doc =>
                `SOURCE: ${doc.title}\n${doc.chunk}`)
            .join("\n\n");

        const prompt = `
Answer ONLY using the supplied company documents.

If the information is not present, say:
"I couldn't find that information in the company documents."

Company Documents:

${contextText}

User Question:
${question}
`;

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
                            content:
                                "You are Contoso Knowledge Copilot. Always answer based on the provided company documents."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    max_completion_tokens: 2000
                })
            }
        );

        const openAiResult = await openAiResponse.json();

        const answer =
            openAiResult.choices?.[0]?.message?.content ||
            "No response received.";

        // Unique document names
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
