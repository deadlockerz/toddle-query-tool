const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Update GitHub token in environment
router.post("/github-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Path to .env file
    const envPath = path.resolve(__dirname, "../.env");

    // Read current .env file
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    // Update the GITHUB_TOKEN value
    envConfig.GITHUB_TOKEN = token;

    // Convert back to .env format
    const newEnvContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // Write back to .env file
    fs.writeFileSync(envPath, newEnvContent);

    // Update the current environment
    process.env.GITHUB_TOKEN = token;

    res.status(200).json({ message: "GitHub token updated successfully" });
  } catch (error) {
    console.error("Error updating GitHub token:", error);
    res.status(500).json({ error: "Failed to update GitHub token" });
  }
});

module.exports = router;
