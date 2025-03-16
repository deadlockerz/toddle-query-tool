const { getOpenAIClient } = require("../config/github");

// Generate SQL query based on natural language prompt and schema using OpenAI API
async function generateQuery(prompt, schema, apiKey, model = "gpt-3.5-turbo") {
  try {
    const schemaStr = JSON.stringify(schema, null, 2);
    const openai = getOpenAIClient(apiKey);

    const response = await openai.chat.completions.create({
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

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating query with OpenAI:", error);
    throw new Error("Failed to generate SQL query using OpenAI API");
  }
}

// Explain the generated SQL query
async function explainQuery(query, apiKey, model = "gpt-3.5-turbo") {
  try {
    const openai = getOpenAIClient(apiKey);

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert SQL assistant. Explain the provided SQL query in simple terms.",
        },
        {
          role: "user",
          content: `Explain the following SQL query in simple terms: ${query}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error explaining query with OpenAI:", error);
    throw new Error("Failed to explain SQL query using OpenAI API");
  }
}

module.exports = {
  generateQuery,
  explainQuery,
};
