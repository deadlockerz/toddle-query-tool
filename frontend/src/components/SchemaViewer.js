import React from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Button,
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { fetchSchema } from "../api";

function SchemaViewer() {
  const {
    data: schema,
    isLoading,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["schema"],
    queryFn: fetchSchema,
    retry: 5, // Limit automatic retries to 5
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "150px", // Reduced from 200px
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          Failed to load schema: {error.message}
        </Alert>

        <Typography variant="body2" sx={{ mb: 2 }}>
          The connection to the database failed. Please check your database
          connection or try again.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={handleRetry}
          startIcon={<RefreshIcon />}
          fullWidth
        >
          Reconnect to Database
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
      {" "}
      {/* Reduced padding */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        {" "}
        {/* Reduced margin */}
        <StorageIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Database Schema</Typography>
      </Box>
      {schema && schema.length > 0 ? (
        schema.map((table) => (
          <Accordion key={table.table_name} disableGutters>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 40 }}
            >
              <Typography sx={{ fontWeight: "medium" }}>
                {table.table_name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{ p: 0, maxHeight: "200px", overflow: "auto" }}
            >
              {" "}
              {/* Added max-height and overflow */}
              <List dense disablePadding>
                {table.columns.map((column) => (
                  <ListItem key={column.name} divider>
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
        ))
      ) : (
        <Typography variant="body2" color="textSecondary">
          No tables found in database.
        </Typography>
      )}
    </Box>
  );
}

export default SchemaViewer;
