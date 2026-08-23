module.exports = async function (context, req) {

    try {

        const question = req.body?.message || "";

        const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
        const searchKey = process.env.AZURE_SEARCH_KEY;
        const searchIndex = process.env.AZURE_SEARCH_INDEX;

        const openAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const openAiKey = process.env.AZURE_OPENAI_API_KEY;
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

        // SEARCH DOCUMENTS
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
            .map(doc => doc.chunk)
            .join("\n\n");

        // GPT CALL
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
                                "You answer questions using the supplied company documents. If the answer cannot be found, say that clearly."
                        },
                        {
                            role: "user",
                            content:
                                `Question:\n${question}\n\nDocuments:\n${contextText}`
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
                answer: error.message,
                sources: []
            }
        };

    }
};
