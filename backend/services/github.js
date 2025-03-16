const axios = require("axios");

// Generate SQL query based on natural language prompt and schema using GitHub Copilot API
async function generateQuery(prompt, schema, token, model = "copilot-4") {
  throw new Error(
    "GitHub token integration has been removed as it doesn't provide access to Copilot capabilities",
  );
}

// Explain the generated SQL query
async function explainQuery(query, token, model = "copilot-4") {
  throw new Error(
    "GitHub token integration has been removed as it doesn't provide access to Copilot capabilities",
  );
}

module.exports = {
  generateQuery,
  explainQuery,
};
