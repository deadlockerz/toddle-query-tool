/**
 * Utility functions for managing schema data persistence
 */

const API_BASE_URL = "/api";

/**
 * Load databases from server file
 * @returns {Promise<Array>} Promise resolving to array of database objects with tables
 */
export const loadDatabases = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/databases`);
    if (!response.ok) {
      throw new Error(`Failed to load databases: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error loading databases from server:", error);
    return [];
  }
};

/**
 * Save databases to server file
 * @param {Array} databases - Array of database objects with tables
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const saveDatabases = async (databases) => {
  try {
    const response = await fetch(`${API_BASE_URL}/databases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(databases),
    });

    return response.ok;
  } catch (error) {
    console.error("Error saving databases to server:", error);
    return false;
  }
};

/**
 * Delete a database by name
 * @param {string} databaseName - Name of the database to delete
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const deleteDatabase = async (databaseName) => {
  try {
    const databases = await loadDatabases();
    const updatedDatabases = databases.filter((db) => db.name !== databaseName);
    return await saveDatabases(updatedDatabases);
  } catch (error) {
    console.error(`Error deleting database ${databaseName}:`, error);
    return false;
  }
};

/**
 * Delete a table from a specific database
 * @param {string} databaseName - Name of the database
 * @param {string} tableName - Name of the table to delete
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const deleteTable = async (databaseName, tableName) => {
  try {
    const databases = await loadDatabases();
    const updatedDatabases = databases.map((db) => {
      if (db.name === databaseName) {
        return {
          ...db,
          tables: db.tables.filter((table) => table.table_name !== tableName),
        };
      }
      return db;
    });
    return await saveDatabases(updatedDatabases);
  } catch (error) {
    console.error(
      `Error deleting table ${tableName} from ${databaseName}:`,
      error,
    );
    return false;
  }
};

/**
 * Export databases to a JSON string
 * @param {Array} databases - Array of database objects
 * @returns {string} JSON string representation of the databases
 */
export const exportDatabases = (databases) => {
  try {
    return JSON.stringify(databases, null, 2);
  } catch (error) {
    console.error("Error exporting databases:", error);
    return "{}";
  }
};

/**
 * Import databases from a JSON string
 * @param {string} jsonString - JSON string representation of databases
 * @returns {Promise<Array|null>} Promise resolving to array of database objects or null if invalid
 */
export const importDatabases = async (jsonString) => {
  try {
    const databases = JSON.parse(jsonString);
    if (Array.isArray(databases)) {
      // Save the imported databases to the server
      await saveDatabases(databases);
      return databases;
    }
    return null;
  } catch (error) {
    console.error("Error importing databases:", error);
    return null;
  }
};

/**
 * Edit a database's properties
 * @param {string} originalName - Original name of the database
 * @param {object} updatedData - Updated database properties
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const editDatabase = async (originalName, updatedData) => {
  try {
    const databases = await loadDatabases();
    const updatedDatabases = databases.map((db) => {
      if (db.name === originalName) {
        return { ...db, ...updatedData };
      }
      return db;
    });
    return await saveDatabases(updatedDatabases);
  } catch (error) {
    console.error(`Error editing database ${originalName}:`, error);
    return false;
  }
};

/**
 * Check if an item (database or table) is editable
 * @param {object} item - Database or table object
 * @returns {boolean} Whether the item is editable
 */
export const isItemEditable = (item) => {
  // By default, all databases and tables are editable
  // You can add custom logic here if some items should not be editable
  return true;
};

/**
 * Get properties for edit buttons in the UI
 * @param {string} itemType - Type of item ('database' or 'table')
 * @returns {object} Object with button properties
 */
export const getEditButtonProps = (itemType) => {
  return {
    visible: true,
    icon: "edit", // FontAwesome or other icon library name
    tooltip: `Edit ${itemType}`,
    className: `edit-${itemType}-btn`,
    style: {
      marginRight: "8px",
      cursor: "pointer",
      color: "#4a90e2",
    },
  };
};

/**
 * Edit a table's properties within a database
 * @param {string} databaseName - Name of the database
 * @param {string} originalTableName - Original name of the table
 * @param {object} updatedTableData - Updated table properties
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const editTable = async (
  databaseName,
  originalTableName,
  updatedTableData,
) => {
  try {
    const databases = await loadDatabases();
    const updatedDatabases = databases.map((db) => {
      if (db.name === databaseName) {
        return {
          ...db,
          tables: db.tables.map((table) => {
            if (table.table_name === originalTableName) {
              return { ...table, ...updatedTableData };
            }
            return table;
          }),
        };
      }
      return db;
    });
    return await saveDatabases(updatedDatabases);
  } catch (error) {
    console.error(
      `Error editing table ${originalTableName} in ${databaseName}:`,
      error,
    );
    return false;
  }
};

/**
 * Fix for ResizeObserver loop errors
 */
export const setupResizeObserverErrorHandler = () => {
  // Only patch if it hasn't been patched already and ResizeObserver exists
  if (window.ResizeObserver && !window._isResizeObserverPatched) {
    window._isResizeObserverPatched = true;

    // Store original ResizeObserver
    const OriginalResizeObserver = window.ResizeObserver;

    // Create a new constructor function that wraps the original
    window.ResizeObserver = function ResizeObserverWrapper(callback) {
      // Throttle the callback execution to prevent flooding
      const throttledCallback = throttleResizeObserverCallback(callback);
      return new OriginalResizeObserver(throttledCallback);
    };

    // Copy all static properties from original to wrapper
    Object.keys(OriginalResizeObserver).forEach((key) => {
      if (key !== "prototype") {
        window.ResizeObserver[key] = OriginalResizeObserver[key];
      }
    });

    // Set prototype chain correctly
    window.ResizeObserver.prototype = OriginalResizeObserver.prototype;
  }

  // Keep a backup error handler for any that still might occur
  const errorHandler = (event) => {
    if (
      (event.message && event.message.includes("ResizeObserver loop")) ||
      (event.reason &&
        event.reason.message &&
        event.reason.message.includes("ResizeObserver loop"))
    ) {
      // Prevent the error from propagating
      event.stopImmediatePropagation?.();
      event.preventDefault?.();
      console.warn("Suppressed ResizeObserver loop error");
      return true; // Prevent default
    }
    return false;
  };

  window.addEventListener("error", errorHandler, true);
  window.addEventListener("unhandledrejection", errorHandler, true);

  return () => {
    window.removeEventListener("error", errorHandler, true);
    window.removeEventListener("unhandledrejection", errorHandler, true);
  };
};

/**
 * Throttles ResizeObserver callbacks to prevent infinite loops
 * @param {Function} callback - Original ResizeObserver callback
 * @returns {Function} Throttled callback
 */
function throttleResizeObserverCallback(callback) {
  let frames = [];
  let frameId = null;

  const throttledCallback = (entries, observer) => {
    // Store the entries to process later
    frames.push({ entries, observer });

    // If we're not already processing frames, start doing so
    if (!frameId) {
      frameId = requestAnimationFrame(() => {
        const processEntries = frames;
        frames = [];
        frameId = null;

        // Group entries by observer
        const entriesByObserver = new Map();
        processEntries.forEach(({ entries, observer }) => {
          if (!entriesByObserver.has(observer)) {
            entriesByObserver.set(observer, []);
          }
          entriesByObserver.get(observer).push(...entries);
        });

        // Call the original callback with deduplicated entries
        entriesByObserver.forEach((entries, observer) => {
          // Remove duplicates (keep only the last entry for each target)
          const uniqueEntries = [];
          const targets = new Set();

          // Process entries in reverse to keep most recent
          for (let i = entries.length - 1; i >= 0; i--) {
            const entry = entries[i];
            if (!targets.has(entry.target)) {
              targets.add(entry.target);
              uniqueEntries.unshift(entry); // Add to beginning to maintain order
            }
          }

          try {
            callback(uniqueEntries, observer);
          } catch (error) {
            console.error("Error in ResizeObserver callback:", error);
          }
        });
      });
    }
  };

  return throttledCallback;
}
