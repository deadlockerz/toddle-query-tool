const express = require("express");
const router = express.Router();
const { getSchema } = require("../services/clickhouse");

// Get the database schema with improved error handling
router.get("/", async (req, res, next) => {
  try {
    console.log("Fetching schema from ClickHouse...");
    const schema = await getSchema();
    console.log(`Schema fetched successfully with ${schema.length} tables`);
    res.json(schema);
  } catch (error) {
    console.error("Error in /api/schema endpoint:", error);
    // Send detailed error information to help debug
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      details:
        "Failed to fetch database schema. Check your ClickHouse connection.",
    });
  }
});

module.exports = router;
