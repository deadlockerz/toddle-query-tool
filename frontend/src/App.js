import React, { useState, useEffect } from "react";
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
import { validateAPIKey } from "./api"; // Import validateAPIKey from api

function App() {
  const [openSettings, setOpenSettings] = useState(false);
  const [apiKey, setApiKey] = useLocalStorage("openai-api-key", "");
  const [selectedModel, setSelectedModel] = useLocalStorage(
    "openai-model",
    "gpt-3.5-turbo",
  );
  // Store validation state in local storage
  const [isValidToken, setIsValidToken] = useLocalStorage(
    "token-is-valid",
    Boolean(apiKey),
  );

  // Function to validate OpenAI API key
  const validateOpenAIKey = async (token) => {
    setIsValidToken(false);
    if (!token) return false;

    try {
      const isValid = await validateAPIKey(token);
      setIsValidToken(isValid);
      return isValid;
    } catch (error) {
      console.error("Error validating token:", error);
      setIsValidToken(false);
      return false;
    }
  };

  const handleSaveToken = async (token) => {
    setApiKey(token);
    // Only update validation status when explicitly validating
    await validateOpenAIKey(token);
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

  // Inside App component, we can add a useEffect to initialize empty database structure if needed
  useEffect(() => {
    // Check if databases exist in localStorage, if not, initialize with empty array
    if (!localStorage.getItem("databases")) {
      localStorage.setItem("databases", JSON.stringify([]));
    }
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        // Add position relative to prevent sizing loops
        position: "relative",
      }}
    >
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
          // Add position to create a new stacking context
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 2, sm: 3 },
            // Use fixed heights instead of calculated values where possible
            height: { xs: "auto", md: "calc(100vh - 120px)" },
            // Change overflow handling to prevent ResizeObserver loops
            overflow: { xs: "visible", md: "auto" },
            // Add containment to prevent layout shifts
            contain: "layout size",
          }}
        >
          <Paper
            sx={{
              p: { xs: 1, sm: 2 },
              flexBasis: { xs: "100%", md: "30%" },
              minWidth: { md: "300px" },
              // Use more stable sizing
              height: { xs: "300px", md: "100%" },
              maxHeight: { md: "100%" },
              overflow: "auto",
              // Add contain property to isolate layout changes
              contain: "layout paint",
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
              // Use more stable sizing
              height: { xs: "auto", md: "100%" },
              overflow: { xs: "visible", md: "auto" },
              // Add contain property to isolate layout changes
              contain: "layout paint",
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
        validateToken={validateOpenAIKey}
        disableEnforceFocus={false}
        disableAutoFocus={false}
        keepMounted={false}
      />

      <SnackbarStack />
    </Box>
  );
}

export default App;
