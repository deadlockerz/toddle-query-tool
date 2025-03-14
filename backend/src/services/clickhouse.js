const { createClient } = require("@clickhouse/client");

// Create a ClickHouse client with connection details from environment variables
const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST || "http://localhost:8123",
  username: process.env.CLICKHOUSE_USER || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
  database: process.env.CLICKHOUSE_DATABASE || "default",
  request_timeout: 30000,
});

// Get database schema with improved error handling
async function getSchema() {
  try {
    console.log("ClickHouse connection params:", {
      host: process.env.CLICKHOUSE_HOST || "http://localhost:8123",
      database: process.env.CLICKHOUSE_DATABASE || "default",
    });

    // Get all tables in the database
    const tablesQuery = `
      SELECT 
        name as table_name,
        engine,
        total_rows,
        total_bytes
      FROM system.tables 
      WHERE database = '${process.env.CLICKHOUSE_DATABASE || "default"}'
    `;

    console.log("Executing tables query...");
    const tablesResult = await clickhouse.query({
      query: tablesQuery,
      format: "JSONEachRow",
    });

    const tables = await tablesResult.json();
    console.log(`Retrieved ${tables.length} tables`);

    // Get columns for each table
    const columnsQuery = `
      SELECT 
        table as table_name,
        name as column_name,
        type as data_type,
        is_in_primary_key
      FROM system.columns 
      WHERE database = '${process.env.CLICKHOUSE_DATABASE || "default"}'
    `;

    console.log("Executing columns query...");
    const columnsResult = await clickhouse.query({
      query: columnsQuery,
      format: "JSONEachRow",
    });

    const columns = await columnsResult.json();
    console.log(`Retrieved column information for ${tables.length} tables`);

    // Organize columns by table
    const schema = tables.map((table) => {
      const tableColumns = columns.filter(
        (col) => col.table_name === table.table_name,
      );
      return {
        ...table,
        columns: tableColumns.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          isPrimaryKey: Boolean(col.is_in_primary_key),
        })),
      };
    });

    return schema;
  } catch (error) {
    console.error("Error fetching schema from ClickHouse:", error);
    throw new Error(`Failed to fetch database schema: ${error.message}`);
  }
}

// Execute a SQL query
async function executeQuery(query) {
  try {
    const result = await clickhouse.query({
      query,
      format: "JSONEachRow",
    });

    return await result.json();
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Failed to execute query: ${error.message}`);
  }
}

module.exports = {
  clickhouse,
  getSchema,
  executeQuery,
};
