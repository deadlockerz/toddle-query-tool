const express = require("express");
const router = express.Router();
const clickhouseClient = require("../config/clickhouse");

// Get all tables in the database
router.get("/tables", async (req, res) => {
  try {
    // Log database name being used
    const dbName = process.env.CLICKHOUSE_DATABASE || "default";
    console.log(`Using database: ${dbName}`);

    const query = `
      SELECT 
        name as table_name,
        engine,
        total_rows,
        formatReadableSize(total_bytes) as size
      FROM system.tables
      WHERE database = '${dbName}'
    `;

    // Log connection attempt
    console.log("Attempting to query ClickHouse for tables...");

    const resultSet = await clickhouseClient.query({
      query,
      format: "JSONEachRow",
    });

    const tables = await resultSet.json();
    console.log(`Successfully fetched ${tables.length} tables`);
    res.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    // More detailed error response
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      details: "Error occurred while fetching tables from ClickHouse",
    });
  }
});

// Get schema for all tables or a specific table
router.get("/:table?", async (req, res) => {
  try {
    const { table } = req.params;
    const dbName = process.env.CLICKHOUSE_DATABASE || "default";
    console.log(`Using database: ${dbName}, table param: ${table || "none"}`);

    let query;

    if (table) {
      query = `
        SELECT
          name as column_name,
          type as data_type,
          default_kind,
          default_expression,
          comment
        FROM system.columns
        WHERE database = '${dbName}'
        AND table = '${table}'
      `;
    } else {
      query = `
        SELECT
          table,
          groupArray(tuple(name, type, default_kind, default_expression, comment)) AS columns
        FROM system.columns
        WHERE database = '${dbName}'
        GROUP BY table
      `;
    }

    console.log("Executing schema query...");
    const resultSet = await clickhouseClient.query({
      query,
      format: "JSONEachRow",
    });

    const schema = await resultSet.json();
    console.log(
      `Schema data fetched successfully with ${schema.length} entries`,
    );
    res.json(schema);
  } catch (error) {
    console.error("Error fetching schema:", error);
    // Return detailed error information
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      details:
        "Error occurred while fetching schema from ClickHouse. Check your environment variables and database connection.",
    });
  }
});

module.exports = router;
