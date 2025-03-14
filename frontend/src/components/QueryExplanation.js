import React from "react";
import { Box, Typography, Paper } from "@mui/material";

function QueryExplanation({ explanation }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Query Explanation
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
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: "0.875rem", // Reduced font size
          }}
        >
          {explanation}
        </pre>
      </Paper>
    </Box>
  );
}

export default QueryExplanation;
