import React from "react";
import { Container, Typography, Box, Divider } from "@mui/material";
import ApiKeyManager from "../components/ApiKeyManager";
import axios from "axios";

function Settings() {
  const handleSaveApiConfig = async (config) => {
    try {
      await axios.post("/api/config/save-openai-config", config);
    } catch (error) {
      window.snackbarStack?.addSnackbar(
        "Failed to save OpenAI configuration",
        "error",
      );
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h5" gutterBottom>
          AI Configuration
        </Typography>

        <ApiKeyManager onSave={handleSaveApiConfig} />
      </Box>
    </Container>
  );
}

export default Settings;
