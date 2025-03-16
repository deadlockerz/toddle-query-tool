import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";

const ApiKeyManager = ({ onSave }) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
  const [availableModels, setAvailableModels] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Load default API key from environment on component mount
    fetchDefaultApiKey();
  }, []);

  const fetchDefaultApiKey = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/config/openai-key");
      if (response.data && response.data.key) {
        setApiKey(response.data.key);
        // Automatically verify the default key if it exists
        verifyApiKey(response.data.key);
      }
    } catch (error) {
      window.snackbarStack?.addSnackbar(
        "Failed to load default OpenAI API key",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyApiKey = async (keyToVerify = apiKey) => {
    if (!keyToVerify) {
      setErrorMessage("API key is required");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post("/api/verify-openai-key", {
        apiKey: keyToVerify,
      });

      if (response.data.valid) {
        setIsVerified(true);
        setAvailableModels(response.data.models || []);
        window.snackbarStack?.addSnackbar(
          "OpenAI API key verified successfully",
          "success",
        );
      } else {
        setIsVerified(false);
        setErrorMessage("Invalid OpenAI API key");
        window.snackbarStack?.addSnackbar("Invalid OpenAI API key", "error");
      }
    } catch (error) {
      setIsVerified(false);
      setErrorMessage(
        error.response?.data?.message || "Error verifying API key",
      );
      window.snackbarStack?.addSnackbar(
        "Failed to verify OpenAI API key",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!isVerified) {
      window.snackbarStack?.addSnackbar(
        "Please verify your OpenAI API key before saving",
        "warning",
      );
      return;
    }

    onSave({ apiKey, model: selectedModel });
    window.snackbarStack?.addSnackbar(
      "OpenAI settings saved successfully",
      "success",
    );
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 500, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        OpenAI API Configuration
      </Typography>

      <TextField
        fullWidth
        label="OpenAI API Key"
        variant="outlined"
        value={apiKey}
        onChange={(e) => {
          setApiKey(e.target.value);
          setIsVerified(false); // Reset verification when key changes
        }}
        error={!!errorMessage}
        helperText={errorMessage}
        margin="normal"
        type="password"
      />

      <Box sx={{ display: "flex", gap: 2, my: 2 }}>
        <Button
          variant="outlined"
          onClick={() => verifyApiKey()}
          disabled={isLoading || !apiKey}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          Test API Key
        </Button>
      </Box>

      {isVerified && (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel>Model</InputLabel>
            <Select
              value={selectedModel}
              label="Model"
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.id}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="gpt-3.5-turbo">gpt-3.5-turbo</MenuItem>
              )}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            sx={{ mt: 2 }}
            disabled={!isVerified}
          >
            Save Settings
          </Button>
        </>
      )}
    </Box>
  );
};

export default ApiKeyManager;
