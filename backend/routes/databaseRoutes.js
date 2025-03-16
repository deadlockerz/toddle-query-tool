const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const router = express.Router();

const DB_FILE_PATH = path.join(__dirname, "../assets/databases.json");

// Ensure the assets directory exists
const ensureDirectory = async () => {
  const dir = path.dirname(DB_FILE_PATH);
  try {
    await fs.access(dir);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(dir, { recursive: true });
  }
};

// Get all databases
router.get("/databases", async (req, res) => {
  try {
    await ensureDirectory();

    try {
      const data = await fs.readFile(DB_FILE_PATH, "utf8");
      const databases = JSON.parse(data);
      res.json(databases);
    } catch (error) {
      if (error.code === "ENOENT") {
        // File doesn't exist yet, return empty array
        await fs.writeFile(DB_FILE_PATH, JSON.stringify([]));
        res.json([]);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Error reading database file:", error);
    res.status(500).json({ error: "Failed to read databases" });
  }
});

// Save databases
router.post("/databases", async (req, res) => {
  try {
    await ensureDirectory();

    const databases = req.body;
    if (!Array.isArray(databases)) {
      return res.status(400).json({ error: "Invalid database format" });
    }

    await fs.writeFile(DB_FILE_PATH, JSON.stringify(databases, null, 2));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error writing database file:", error);
    res.status(500).json({ error: "Failed to save databases" });
  }
});

module.exports = router;
