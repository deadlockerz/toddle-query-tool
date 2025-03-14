const express = require("express");
const router = express.Router();
const { executeQuery } = require("../services/clickhouse");
const { getSchema } = require("../services/clickhouse");
const githubService = require("../services/github");

// Generate a SQL query from natural language
router.post("/generate", async (req, res, next) => {
  try {
    const { prompt, token } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Token can be optional now since we have a fallback
    const schema = await getSchema();
    const generatedQuery = await githubService.generateQuery(
      prompt,
      schema,
      token,
    );

    res.json({ query: generatedQuery });
  } catch (error) {
    next(error);
  }
});

// Execute a SQL query
router.post("/execute", async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const results = await executeQuery(query);
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// Explain a SQL query
router.post("/explain", async (req, res, next) => {
  try {
    const { query, token } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Token can be optional now since we have a fallback
    const explanation = await githubService.explainQuery(query, token);
    res.json({ explanation });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
