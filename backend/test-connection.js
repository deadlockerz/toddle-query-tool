require("dotenv").config();
const { createClient } = require("@clickhouse/client");

// Create client with explicitly combined host and port
const client = createClient({
  host: process.env.CLICKHOUSE_HOST || "http://localhost:8123",
  username: process.env.CLICKHOUSE_USER || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
  database: process.env.CLICKHOUSE_DATABASE || "default",
});

async function testConnection() {
  try {
    console.log("Attempting to connect to ClickHouse...");
    console.log(
      `Host: ${process.env.CLICKHOUSE_HOST || "http://localhost:8123"}`,
    );

    const result = await client.query({
      query: "SELECT 1 AS test",
      format: "JSONEachRow",
    });

    const data = await result.json();
    console.log("Connection successful!");
    console.log("Test query result:", data);
    return data;
  } catch (error) {
    console.error("Connection error:", error.message);
    console.error("Error details:", error);
    throw error;
  }
}

// Run the test
testConnection()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
