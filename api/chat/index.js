module.exports = async function (context, req) {

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    const question = req.body?.message || "Hello";

    const url =
        `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=2024-10-21`;

    try {

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You are Contoso Knowledge Copilot."
                    },
                    {
                        role: "user",
                        content: question
                    }
                ],
                max_completion_tokens: 500
            })
        });

        const result = await response.json();

        return {
            status: 200,
            body: {
                endpoint: endpoint,
                deployment: deployment,
                statusCode: response.status,
                response: result
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
