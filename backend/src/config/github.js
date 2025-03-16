const { OpenAI } = require("openai");

const getOpenAIClient = (apiKey) => {
  try {
    // Use provided API key or fall back to environment variable
    const key = apiKey || process.env.OPENAI_API_KEY;

    if (!key) {
      throw new Error(
        "OpenAI API key is required. Please provide an API key or set OPENAI_API_KEY environment variable.",
      );
    }

    return new OpenAI({
      apiKey: key,
    });
  } catch (error) {
    console.error("Error creating OpenAI client:", error);
    throw error;
  }
};

module.exports = { getOpenAIClient };
