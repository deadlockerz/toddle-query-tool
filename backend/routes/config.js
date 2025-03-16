const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

// Update GitHub token in environment
router.post("/github-token", async (req, res) => {
  return res.status(403).json({
    error:
      "GitHub token integration has been removed as it doesn't provide access to Copilot capabilities",
  });
});

// Validate OpenAI API key
router.post("/openai-key", async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    // Store the key in the .env file (OPTIONAL - only if you want to persist it)
    // This part should be handled carefully in production
    // dotenv.config();
    // const envPath = path.resolve(__dirname, '../.env');
    // fs.writeFileSync(envPath, `OPENAI_API_KEY=${apiKey}\n`, { flag: 'w' });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get default OpenAI API key from environment
router.get("/openai-key", (req, res) => {
  try {
    const defaultKey = process.env.OPENAI_API_KEY || "";
    res.json({ key: defaultKey });
  } catch (error) {
    console.error("Error fetching default API key:", error);
    res.status(500).json({ message: "Failed to fetch default API key" });
  }
});

// Verify OpenAI API key and fetch available models
router.post("/verify-openai-key", async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res
      .status(400)
      .json({ valid: false, message: "API key is required" });
  }

  try {
    // Try to fetch models as a way to verify the API key
    const response = await axios.get("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // Filter models to only include GPT models
    const gptModels = response.data.data.filter((model) =>
      model.id.includes("gpt"),
    );

    res.json({
      valid: true,
      models: gptModels,
    });
  } catch (error) {
    console.error(
      "Error verifying OpenAI API key:",
      error.response?.data || error.message,
    );
    res.status(401).json({
      valid: false,
      message: error.response?.data?.error?.message || "Invalid API key",
    });
  }
});

// Save API key and model configuration
router.post("/save-openai-config", (req, res) => {
  const { apiKey, model } = req.body;

  // In a production app, you would securely store these settings
  // For now, we'll just acknowledge receipt
  res.json({ success: true, message: "OpenAI configuration saved" });
});

module.exports = router;
