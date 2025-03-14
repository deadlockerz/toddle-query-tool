// This file is now deprecated as we've switched from OpenAI to GitHub Copilot
// All functionality has been moved to the github.js service
// This file is kept for reference but should not be used

const { getGitHubCopilotClient } = require("../config/github");

// Generate SQL query based on natural language prompt and schema
async function generateQuery(prompt, schema, token, model = "copilot-4") {
  try {
    const schemaStr = JSON.stringify(schema, null, 2);
    const client = getGitHubCopilotClient(token);

    const completion = await client.createChatCompletion({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are an expert SQL assistant specialized in ClickHouse SQL. 
          Generate only valid ClickHouse SQL queries based on user requirements.
          The database has the following schema: ${schemaStr}`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating query:", error);
    throw new Error("Failed to generate SQL query");
  }
}

// Explain the generated SQL query
async function explainQuery(query, token, model = "copilot-4") {
  try {
    const client = getGitHubCopilotClient(token);

    const completion = await client.createChatCompletion({
      model: model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert SQL assistant. Explain the provided SQL query in simple terms.",
        },
        {
          role: "user",
          content: `Explain the following ClickHouse SQL query in simple terms: ${query}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error explaining query:", error);
    throw new Error("Failed to explain SQL query");
  }
}

module.exports = {
  generateQuery,
  explainQuery,
};
