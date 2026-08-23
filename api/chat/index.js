module.exports = async function (context, req) {

    try {

        const question = req.body?.message || "";

        const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
        const searchKey = process.env.AZURE_SEARCH_KEY;
        const searchIndex = process.env.AZURE_SEARCH_INDEX;

        const openAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const openAiKey = process.env.AZURE_OPENAI_API_KEY;
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

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

Company Documents:

${contextText}

Question:
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
                            content: "You are Contoso Knowledge Copilot."
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
                openAiResult,
                sources: citationList
            }
        };

    } catch (error) {

        return {
            status: 500,
            body: {
                error: error.message
            }
        };

    }
};
