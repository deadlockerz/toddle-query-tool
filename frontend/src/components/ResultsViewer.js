import React from "react";
import { Box, Typography, Paper } from "@mui/material";

function ResultsViewer({ results }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Query Results
      </Typography>
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          mt: 0.5, // Reduced margin
          p: 1.5, // Reduced padding
          maxHeight: {
            xs: "calc(100vh - 450px)",
            sm: "calc(100vh - 500px)",
            md: "400px",
          },
          overflow: "auto",
        }}
      >
        <pre style={{ margin: 0, overflowX: "auto", fontSize: "0.875rem" }}>
          {" "}
          {/* Reduced font size */}
          {JSON.stringify(results, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
}

export default ResultsViewer;
