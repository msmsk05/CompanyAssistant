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
                        content: "You are Contoso Knowledge Copilot. Answer clearly and concisely."
                    },
                    {
                        role: "user",
                        content: question
                    }
                ],
                max_completion_tokens: 2000
            })
        });

        const result = await response.json();

        const answer =
            result.choices?.[0]?.message?.content ||
            "No response received.";

        return {
            status: 200,
            body: {
                answer
            }
        };

    } catch (error) {

        return {
            status: 500,
            body: {
                answer: `Error: ${error.message}`
            }
        };

    }
};
