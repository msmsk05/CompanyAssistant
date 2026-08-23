module.exports = async function (context, req) {

    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const key = process.env.AZURE_SEARCH_KEY;
    const index = process.env.AZURE_SEARCH_INDEX;

    const question = req.body?.message || "remote work";

    const url =
        `${endpoint}/indexes/${index}/docs/search?api-version=2024-07-01`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": key
        },
        body: JSON.stringify({
            search: question,
            top: 5
        })
    });

    const results = await response.json();

    return {
        status: 200,
        body: results
    };
};
