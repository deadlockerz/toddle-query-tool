const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { getOpenAIClient } = require("../src/config/github");
const { generateQuery, explainQuery } = require("../src/services/github");

// Validation schema for generate-query endpoint
const generateQuerySchema = Joi.object({
  prompt: Joi.string().required(),
  apiKey: Joi.string().required(),
  model: Joi.string().default("gpt-3.5-turbo"),
});

// Test if an OpenAI API key is valid
router.post("/test-token", async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    try {
      const openai = getOpenAIClient(apiKey);
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello!" }],
        max_tokens: 5,
      });

      return res.json({ valid: true });
    } catch (error) {
      console.error("Invalid OpenAI key:", error);
      return res.status(401).json({ error: "Invalid OpenAI API key" });
    }
  } catch (error) {
    console.error("Error in test-token endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});

// Generate SQL query using OpenAI
router.post("/generate-query", async (req, res) => {
  try {
    // Validate request body against schema
    const { error, value } = generateQuerySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { prompt, apiKey, model } = value;

    // For now, no schema is provided
    const result = await generateQuery(prompt, {}, apiKey, model);
    res.json({ query: result });
  } catch (error) {
    console.error("Error generating query:", error);
    res.status(500).json({ error: error.message });
  }
});

// New streaming endpoint for real-time output
router.post("/generate-query-stream", async (req, res) => {
  try {
    // Validate request
    const { error, value } = generateQuerySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { prompt, apiKey, model } = value;

    // Set headers for streaming
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Content-Type-Options", "nosniff");

    try {
      const openai = getOpenAIClient(apiKey);

      const stream = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are an expert SQL assistant specialized in ClickHouse SQL. Generate only valid SQL queries based on user requirements.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        stream: true,
      });

      // Process the stream and send each chunk to the client
      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          res.write(chunk.choices[0].delta.content);
        }
      }

      // End the response
      res.end();
    } catch (error) {
      console.error("OpenAI API error:", error.message);
      if (!res.headersSent) {
        res.status(500).json({
          error: `OpenAI API error: ${error.message}`,
          details: error.response?.data || error.message,
        });
      } else {
        res.write("\n\nError: " + error.message);
        res.end();
      }
    }
  } catch (error) {
    console.error("Error in streaming endpoint:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write("\n\nServer error: " + error.message);
      res.end();
    }
  }
});

// Explain a SQL query using OpenAI
router.post("/explain-query", async (req, res) => {
  try {
    const { query, apiKey, model = "gpt-3.5-turbo" } = req.body;

    if (!query || !apiKey) {
      return res.status(400).json({ error: "Query and API key are required" });
    }

    const explanation = await explainQuery(query, apiKey, model);
    res.json({ explanation });
  } catch (error) {
    console.error("OpenAI API error:", error.message);
    res.status(500).json({
      error: `OpenAI API error: ${error.message}`,
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
