const express = require("express");
const router = express.Router();
const Joi = require("joi");
// Simplified imports to avoid conditional logic
const { getSchema } = require("../src/services/clickhouse");
const githubService = require("../src/services/github");

// Validation schema for generate-query endpoint
const generateQuerySchema = Joi.object({
  prompt: Joi.string().required(),
  apiKey: Joi.string().required(),
  model: Joi.string().default("copilot-4"),
});

// Generate SQL query using GitHub Copilot
router.post("/generate-query", async (req, res) => {
  try {
    // Validate request body against schema
    const { error, value } = generateQuerySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { prompt, apiKey, model } = value;

    // Get database schema for context
    const schema = await getSchema();

    // Call the GitHub Copilot API through our service
    const query = await githubService.generateQuery(
      prompt,
      schema,
      apiKey,
      model,
    );

    // Return the generated query
    res.json({
      query: query,
    });
  } catch (error) {
    console.error("Error generating query:", error);
    res.status(500).json({ error: error.message });
  }
});

// Explain a SQL query using GitHub Copilot
router.post("/explain-query", async (req, res) => {
  try {
    const { query, apiKey, model = "copilot-4" } = req.body;

    if (!query || !apiKey) {
      return res.status(400).json({ error: "Query and API key are required" });
    }

    const explanation = await githubService.explainQuery(query, apiKey, model);
    res.json({ explanation });
  } catch (error) {
    console.error("Error explaining query:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
