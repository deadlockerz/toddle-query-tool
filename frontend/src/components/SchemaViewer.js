import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { parseCreateTableStatement } from "../utils/sqlParser";

function SchemaViewer() {
  // State for databases and tables
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [createDbDialogOpen, setCreateDbDialogOpen] = useState(false);
  const [createTableDialogOpen, setCreateTableDialogOpen] = useState(false);
  const [newDatabaseName, setNewDatabaseName] = useState("");
  const [sqlSchema, setSqlSchema] = useState("");

  // New state for edit functionality
  const [editDbDialogOpen, setEditDbDialogOpen] = useState(false);
  const [editTableDialogOpen, setEditTableDialogOpen] = useState(false);
  const [editedDatabaseName, setEditedDatabaseName] = useState("");
  const [originalDatabaseName, setOriginalDatabaseName] = useState("");
  const [editedSqlSchema, setEditedSqlSchema] = useState("");
  const [editedTableName, setEditedTableName] = useState("");

  // New state for delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(""); // "database" or "table"
  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);

  // Function to create a new database
  const handleCreateDatabase = () => {
    if (newDatabaseName.trim() === "") return;

    // Check if a database with the same name already exists
    if (databases.some((db) => db.name === newDatabaseName)) {
      // Show error notification for duplicate name
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          `Database "${newDatabaseName}" already exists. Please use a different name.`,
          "error",
        );
      }
      return;
    }

    setDatabases([
      ...databases,
      {
        name: newDatabaseName,
        tables: [],
      },
    ]);
    setNewDatabaseName("");
    setCreateDbDialogOpen(false);

    // Show success notification
    if (window.snackbarStack) {
      window.snackbarStack.addSnackbar(
        `Database "${newDatabaseName}" created successfully!`,
        "success",
      );
    }
  };

  // Function to parse SQL schema and create table
  const handleCreateTable = () => {
    if (!selectedDatabase || sqlSchema.trim() === "") return;

    // Use the utility to parse the SQL
    const newTable = parseCreateTableStatement(sqlSchema);

    if (!newTable) {
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          "Failed to parse SQL schema. Please check your syntax.",
          "error",
        );
      }
      return;
    }

    // Check for duplicate table names
    const currentDatabase = databases.find(
      (db) => db.name === selectedDatabase,
    );
    if (
      currentDatabase &&
      currentDatabase.tables.some(
        (table) => table.table_name === newTable.table_name,
      )
    ) {
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          `Table "${newTable.table_name}" already exists in this database.`,
          "error",
        );
      }
      return;
    }

    setDatabases(
      databases.map((db) => {
        if (db.name === selectedDatabase) {
          return {
            ...db,
            tables: [...db.tables, newTable],
          };
        }
        return db;
      }),
    );

    setSqlSchema("");
    setCreateTableDialogOpen(false);

    // Show success notification
    if (window.snackbarStack) {
      window.snackbarStack.addSnackbar(
        `Table ${newTable.table_name} created successfully!`,
        "success",
      );
    }
  };

  // New function to open edit database dialog
  const handleEditDatabaseInit = (dbName) => {
    setOriginalDatabaseName(dbName);
    setEditedDatabaseName(dbName);
    setEditDbDialogOpen(true);
  };

  // New function to save edited database name
  const handleEditDatabase = async () => {
    if (!editedDatabaseName.trim()) {
      setEditDbDialogOpen(false);
      return;
    }

    // If name hasn't changed, show an informational message and close the dialog
    if (editedDatabaseName === originalDatabaseName) {
      setEditDbDialogOpen(false);
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(`Database name unchanged.`, "info");
      }
      return;
    }

    // Check for duplicate names
    if (databases.some((db) => db.name === editedDatabaseName)) {
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          `Database "${editedDatabaseName}" already exists.`,
          "error",
        );
      }
      return;
    }

    // Update database name in state
    setDatabases(
      databases.map((db) => {
        if (db.name === originalDatabaseName) {
          return { ...db, name: editedDatabaseName };
        }
        return db;
      }),
    );

    // If the edited database is currently selected, update selection
    if (selectedDatabase === originalDatabaseName) {
      setSelectedDatabase(editedDatabaseName);
    }

    setEditDbDialogOpen(false);

    // Show success notification
    if (window.snackbarStack) {
      window.snackbarStack.addSnackbar(
        `Database renamed from "${originalDatabaseName}" to "${editedDatabaseName}"`,
        "success",
      );
    }
  };

  // New function to open edit table dialog
  const handleEditTableInit = (tableName) => {
    const currentDatabase = databases.find(
      (db) => db.name === selectedDatabase,
    );
    if (!currentDatabase) return;

    const table = currentDatabase.tables.find(
      (t) => t.table_name === tableName,
    );
    if (!table) return;

    // Convert table to SQL schema format for editing
    const columnDefinitions = table.columns
      .map((col) => {
        return `  ${col.name} ${col.type}${
          col.isPrimaryKey ? " PRIMARY KEY" : ""
        }`;
      })
      .join(",\n");

    const sqlDef = `CREATE TABLE ${tableName} (\n${columnDefinitions}\n)`;

    setEditedTableName(tableName);
    setEditedSqlSchema(sqlDef);
    setEditTableDialogOpen(true);
  };

  // New function to save edited table schema
  const handleEditTable = () => {
    if (!editedSqlSchema.trim()) {
      setEditTableDialogOpen(false);
      return;
    }

    // Parse the edited SQL schema
    const updatedTable = parseCreateTableStatement(editedSqlSchema);

    if (!updatedTable) {
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          "Failed to parse SQL schema. Please check your syntax.",
          "error",
        );
      }
      return;
    }

    // Check if table name was changed
    const nameChanged = updatedTable.table_name !== editedTableName;

    // Check for duplicate table name if name changed
    const currentDatabase = databases.find(
      (db) => db.name === selectedDatabase,
    );
    if (
      nameChanged &&
      currentDatabase.tables.some(
        (table) => table.table_name === updatedTable.table_name,
      )
    ) {
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          `Table "${updatedTable.table_name}" already exists in this database.`,
          "error",
        );
      }
      return;
    }

    // Update table in state
    setDatabases(
      databases.map((db) => {
        if (db.name === selectedDatabase) {
          return {
            ...db,
            tables: db.tables.map((table) => {
              if (table.table_name === editedTableName) {
                return updatedTable;
              }
              return table;
            }),
          };
        }
        return db;
      }),
    );

    setEditTableDialogOpen(false);

    // Show success notification
    if (window.snackbarStack) {
      window.snackbarStack.addSnackbar(
        nameChanged
          ? `Table renamed from "${editedTableName}" to "${updatedTable.table_name}" and updated`
          : `Table "${editedTableName}" updated successfully`,
        "success",
      );
    }
  };

  // New function to initiate delete confirmation
  const handleDeleteInitiate = (itemName, type) => {
    setItemToDelete(itemName);
    setDeleteType(type);
    setDeleteConfirmOpen(true);
    setDeleteButtonEnabled(false);
    setDeleteCountdown(5);
  };

  // New function to handle actual deletion
  const handleDelete = () => {
    if (!itemToDelete) {
      setDeleteConfirmOpen(false);
      return;
    }

    if (deleteType === "database") {
      // Delete the database
      const updatedDatabases = databases.filter(
        (db) => db.name !== itemToDelete,
      );
      setDatabases(updatedDatabases);

      // If the deleted database was selected, clear selection
      if (selectedDatabase === itemToDelete) {
        setSelectedDatabase(null);
      }

      // Show notification
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          `Database "${itemToDelete}" deleted successfully!`,
          "success",
        );
      }
    } else if (deleteType === "table") {
      // Delete the table from the current database
      const updatedDatabases = databases.map((db) => {
        if (db.name === selectedDatabase) {
          return {
            ...db,
            tables: db.tables.filter(
              (table) => table.table_name !== itemToDelete,
            ),
          };
        }
        return db;
      });
      setDatabases(updatedDatabases);

      // Show notification
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          `Table "${itemToDelete}" deleted successfully!`,
          "success",
        );
      }
    }

    // Reset delete state
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
    setDeleteType("");
  };

  // Effect for countdown timer on delete confirmation
  useEffect(() => {
    let timer;
    if (deleteConfirmOpen && deleteCountdown > 0) {
      timer = setTimeout(() => {
        setDeleteCountdown(deleteCountdown - 1);
      }, 1000);
    }

    if (deleteCountdown === 0) {
      setDeleteButtonEnabled(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [deleteConfirmOpen, deleteCountdown]);

  // Save to localStorage whenever databases change
  useEffect(() => {
    localStorage.setItem("databases", JSON.stringify(databases));

    // Export the data to a local JS file - this won't work in browser environment
    // but we'll keep using localStorage which already handles persistence
  }, [databases]);

  // Load from localStorage on component mount
  useEffect(() => {
    const savedDatabases = localStorage.getItem("databases");
    if (savedDatabases) {
      try {
        setDatabases(JSON.parse(savedDatabases));
      } catch (e) {
        console.error("Error parsing saved databases", e);
      }
    }
  }, []);

  // Render UI for databases list or tables within a database
  return (
    <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <StorageIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            {!selectedDatabase ? "Database Schema" : selectedDatabase}
          </Typography>
        </Box>
      </Box>

      {/* Database list or table view based on selection */}
      {!selectedDatabase ? (
        <>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => setCreateDbDialogOpen(true)}
              startIcon={<AddIcon />}
              fullWidth
            >
              Create Database
            </Button>
          </Box>
          <List>
            {databases.map((db) => (
              <ListItem key={db.name} sx={{ cursor: "pointer" }}>
                <ListItemText
                  primary={db.name}
                  onClick={() => setSelectedDatabase(db.name)}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Edit Database">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDatabaseInit(db.name);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Database">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteInitiate(db.name, "database");
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {databases.length === 0 && (
              <Typography variant="body2" color="textSecondary">
                No databases created yet.
              </Typography>
            )}
          </List>
        </>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => setCreateTableDialogOpen(true)}
              startIcon={<AddIcon />}
              fullWidth
            >
              Create Table
            </Button>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
            <Button
              size="small"
              onClick={() => setSelectedDatabase(null)}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
          </Box>

          {/* Tables in the selected database */}
          {databases
            .find((db) => db.name === selectedDatabase)
            ?.tables.map((table) => (
              <Accordion key={table.table_name} disableGutters>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ minHeight: 40 }}
                >
                  <Typography sx={{ fontWeight: "medium", flexGrow: 1 }}>
                    {table.table_name}
                  </Typography>
                  <Tooltip title="Edit Table">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTableInit(table.table_name);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Table">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteInitiate(table.table_name, "table");
                      }}
                      sx={{ mr: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </AccordionSummary>
                <AccordionDetails
                  sx={{ p: 0, maxHeight: "200px", overflow: "auto" }}
                >
                  <List dense disablePadding>
                    {table.columns.map((column, idx) => (
                      <ListItem key={idx} divider>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: column.isPrimaryKey
                                    ? "bold"
                                    : "regular",
                                }}
                              >
                                {column.name}
                              </Typography>
                              {column.isPrimaryKey && (
                                <Chip
                                  label="PK"
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={column.type}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}

          {databases.find((db) => db.name === selectedDatabase)?.tables
            .length === 0 && (
            <Typography variant="body2" color="textSecondary">
              No tables in this database.
            </Typography>
          )}
        </>
      )}

      {/* Create Database Dialog */}
      <Dialog
        open={createDbDialogOpen}
        onClose={() => setCreateDbDialogOpen(false)}
      >
        <DialogTitle>Create Database</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Database Name"
            fullWidth
            value={newDatabaseName}
            onChange={(e) => setNewDatabaseName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDbDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateDatabase} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Table Dialog */}
      <Dialog
        open={createTableDialogOpen}
        onClose={() => setCreateTableDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Table in {selectedDatabase}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
            Paste your SQL schema definition below:
          </Typography>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={sqlSchema}
            onChange={(e) => setSqlSchema(e.target.value)}
            placeholder="-- auto-generated definition
create table table_name
(
    id                       UUID     default generateUUIDv4(),
    organization_id          UInt64,
    ...
)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTableDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateTable} color="primary">
            Create Table
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Edit Database Dialog */}
      <Dialog
        open={editDbDialogOpen}
        onClose={() => setEditDbDialogOpen(false)}
      >
        <DialogTitle>Rename Database</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Database Name"
            fullWidth
            value={editedDatabaseName}
            onChange={(e) => setEditedDatabaseName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDbDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditDatabase} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Edit Table Dialog */}
      <Dialog
        open={editTableDialogOpen}
        onClose={() => setEditTableDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Table Schema</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
            You can modify the SQL schema definition below:
          </Typography>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={editedSqlSchema}
            onChange={(e) => setEditedSqlSchema(e.target.value)}
            placeholder="-- auto-generated definition
CREATE TABLE table_name
(
    id UUID default generateUUIDv4() PRIMARY KEY,
    column_name VARCHAR,
    ...
)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTableDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditTable} color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete {deleteType} "{itemToDelete}"? This
            action cannot be undone.
          </Typography>
          {!deleteButtonEnabled && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              Delete button will be enabled in {deleteCountdown} seconds...
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={!deleteButtonEnabled}
          >
            {deleteButtonEnabled ? "Delete" : `Wait (${deleteCountdown})`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SchemaViewer;
