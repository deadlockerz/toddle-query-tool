const express = require("express");
const router = express.Router();
const Joi = require("joi");
const clickhouseClient = require("../config/clickhouse");

// Validation schema
const querySchema = Joi.object({
  query: Joi.string().required(),
  format: Joi.string().default("JSONEachRow"),
});

// Execute a ClickHouse query
router.post("/execute", async (req, res) => {
  try {
    const { error, value } = querySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { query, format } = value;

    // Execute the query
    const resultSet = await clickhouseClient.query({
      query,
      format,
    });

    const results = await resultSet.json();
    res.json(results);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
