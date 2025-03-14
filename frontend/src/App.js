import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  AppBar,
  Toolbar,
} from "@mui/material";
import QueryInterface from "./components/QueryInterface";
import SchemaViewer from "./components/SchemaViewer";
import SettingsDialog from "./components/SettingsDialog";
import SnackbarStack from "./components/SnackbarStack"; // Import the SnackbarStack
import { useLocalStorage } from "./hooks/useLocalStorage";
import axios from "axios";

function App() {
  const [openSettings, setOpenSettings] = useState(false);
  const [apiKey, setApiKey] = useLocalStorage("github-token", "");
  const [selectedModel, setSelectedModel] = useLocalStorage(
    "copilot-model",
    "copilot-4",
  );
  // Store validation state in local storage
  const [isValidToken, setIsValidToken] = useLocalStorage(
    "token-is-valid",
    Boolean(apiKey),
  );

  // Function to validate GitHub token
  const validateGitHubToken = async (token) => {
    if (!token) {
      setIsValidToken(false);
      return false;
    }

    try {
      // Make a simple request to GitHub API to check if token is valid
      await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIsValidToken(true);
      return true;
    } catch (error) {
      console.error("Token validation failed:", error);
      setIsValidToken(false);
      return false;
    }
  };

  const handleSaveToken = async (token) => {
    setApiKey(token);
    // Only update validation status when explicitly validating
    await validateGitHubToken(token);
  };

  // Handle model change from the settings dialog
  const handleModelChange = (model) => {
    setSelectedModel(model);
    // Ensure it's immediately saved to localStorage
    localStorage.setItem("copilot-model", JSON.stringify(model));
  };

  // Toggle settings dialog
  const handleToggleSettings = () => {
    setOpenSettings(!openSettings);
  };

  // Handle events from child components
  const handleOpenSettings = (event) => {
    if (event?.type === "modelChange" && event.model) {
      handleModelChange(event.model);
    }
    handleToggleSettings();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#222222",
        }}
      >
        <Toolbar>
          {" "}
          <img
            src={require("./assets/toddle.png")}
            alt="Toddle Logo"
            style={{
              height: 40,
              marginRight: 16,
              background: "transparent",
              objectFit: "contain",
            }}
          />{" "}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            Query Tool
          </Typography>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: 1, sm: 2 },
          mb: { xs: 1, sm: 2 },
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          px: { xs: 1, sm: 2, md: 3 },
          overflow: "hidden", // Prevent container overflow
          width: "100%", // Ensures container takes full width on small screens
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 2, sm: 3 },
            height: { xs: "auto", md: "calc(100vh - 100px)" }, // Adjusted height calculation
            overflow: { xs: "visible", md: "hidden" },
          }}
        >
          <Paper
            sx={{
              p: { xs: 1, sm: 2 },
              flexBasis: { xs: "100%", md: "25%" },
              minWidth: { md: "250px" },
              maxHeight: { xs: "300px", md: "calc(100vh - 120px)" }, // Reduced height on mobile
              overflow: "auto",
            }}
          >
            <SchemaViewer />
          </Paper>

          <Paper
            sx={{
              p: { xs: 0, sm: 1 },
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              height: { xs: "auto", md: "calc(100vh - 120px)" }, // Changed maxHeight to height
              overflow: { xs: "visible", md: "auto" }, // Changed from hidden to auto
            }}
          >
            <QueryInterface
              onOpenSettings={handleOpenSettings}
              selectedModel={selectedModel}
            />
          </Paper>
        </Box>
      </Container>

      <SettingsDialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        apiKey={apiKey}
        onSave={handleSaveToken}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        isValidToken={isValidToken}
        validateToken={validateGitHubToken}
        disableEnforceFocus={false}
        disableAutoFocus={false}
        keepMounted={false}
      />

      <SnackbarStack />
    </Box>
  );
}

export default App;
