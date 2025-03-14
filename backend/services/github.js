const axios = require("axios");

// Generate SQL query based on natural language prompt and schema using GitHub Copilot API
async function generateQuery(prompt, schema, token, model = "copilot-4") {
  try {
    const schemaStr = JSON.stringify(schema, null, 2);

    if (!token) {
      throw new Error(
        "GitHub token is required. Please provide a valid GitHub access token.",
      );
    }

    // The GitHub Copilot API endpoint
    const response = await axios.post(
      "https://api.github.com/copilot/chat",
      {
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
        model: model, // Use the specified model
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating query with GitHub:", error);
    throw new Error("Failed to generate SQL query using GitHub API");
  }
}

// Explain the generated SQL query
async function explainQuery(query, token, model = "copilot-4") {
  try {
    if (!token) {
      throw new Error(
        "GitHub token is required. Please provide a valid GitHub access token.",
      );
    }

    const response = await axios.post(
      "https://api.github.com/copilot/chat",
      {
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
        model: model, // Use the specified model
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error explaining query with GitHub:", error);
    throw new Error("Failed to explain SQL query using GitHub API");
  }
}

module.exports = {
  generateQuery,
  explainQuery,
};
