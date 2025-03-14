const axios = require("axios");

const getGitHubCopilotClient = (token) => {
  // Use provided token or fall back to environment variable
  const authToken = token || process.env.GITHUB_TOKEN;

  if (!authToken) {
    throw new Error("GitHub token is required for Copilot functionality");
  }

  return {
    createChatCompletion: async (options) => {
      const {
        messages,
        model = "copilot-4",
        temperature = 0.7,
        max_tokens = 500,
      } = options;

      try {
        const response = await axios.post(
          "https://api.github.com/copilot/chat",
          {
            messages,
            temperature,
            max_tokens,
            model,
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        return response.data;
      } catch (error) {
        console.error("GitHub Copilot API error:", error.message);
        throw new Error(`GitHub Copilot API error: ${error.message}`);
      }
    },
  };
};

module.exports = { getGitHubCopilotClient };
