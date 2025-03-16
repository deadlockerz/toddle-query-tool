/**
 * Utility functions for parsing SQL schema statements
 */

/**
 * Extract table name from a CREATE TABLE statement
 * @param {string} sql - SQL CREATE TABLE statement
 * @returns {string|null} - Table name or null if not found
 */
export const extractTableName = (sql) => {
  const match = sql.match(/create\s+table\s+([^\s(]+)/i);
  return match ? match[1] : null;
};

/**
 * Extract column definitions from a CREATE TABLE statement
 * @param {string} sql - SQL CREATE TABLE statement
 * @returns {Array} - Array of column objects with name, type, and isPrimaryKey
 */
export const extractColumns = (sql) => {
  try {
    // Get the content inside the outer parentheses
    const columnsSection = sql.substring(
      sql.indexOf("(") + 1,
      sql.lastIndexOf(")"),
    );

    // Split by commas, but not inside parentheses
    const columnLines = columnsSection
      .split(/,(?![^(]*\))/)
      .map((line) => line.trim())
      .filter((line) => {
        const lowerLine = line.toLowerCase();
        return (
          !lowerLine.startsWith("primary") &&
          !lowerLine.startsWith("constraint") &&
          !lowerLine.startsWith("engine") &&
          !lowerLine.startsWith("settings")
        );
      });

    return columnLines
      .map((line) => {
        // Handle more complex column definitions
        const parts = line.split(/\s+/);
        if (parts.length < 2) return null;

        const name = parts[0];
        // Join the rest as the type definition
        const type = parts.slice(1).join(" ");

        return {
          name,
          type,
          isPrimaryKey:
            line.toLowerCase().includes("primary key") ||
            name.toLowerCase() === "id", // Assume id is primary key
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Error parsing SQL:", error);
    return [];
  }
};

/**
 * Parse a complete SQL CREATE TABLE statement
 * @param {string} sql - SQL CREATE TABLE statement
 * @returns {Object|null} - Table object with name and columns, or null if parsing failed
 */
export const parseCreateTableStatement = (sql) => {
  const tableName = extractTableName(sql);
  if (!tableName) return null;

  const columns = extractColumns(sql);

  return {
    table_name: tableName,
    columns,
  };
};
