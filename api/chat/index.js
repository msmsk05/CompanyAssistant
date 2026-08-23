
module.exports = async function (context, req) {

    try {

        const question = req.body?.message || "";

        const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
        const searchKey = process.env.AZURE_SEARCH_KEY;
        const searchIndex = process.env.AZURE_SEARCH_INDEX;

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
                    top: 3
                })
            }
        );

        const searchResults = await searchResponse.json();

        const sources = searchResults.value || [];

        const contextText = sources
            .map(doc =>
                `${doc.title}\n${doc.chunk}`)
            .join("\n\n");

        // GPT
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
                            content: `You are Contoso Knowledge Copilot.

Answer the user's question using ONLY the retrieved company documents.

If the answer is not present in the documents, say:
"I couldn't find that information in the company documents."

Be concise and professional.`
                        },
                        {
                            role: "assistant",
                            content: `Retrieved documents:\n\n${contextText}`
                        },
             
