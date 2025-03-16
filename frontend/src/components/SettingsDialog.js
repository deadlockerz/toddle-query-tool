import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Link,
} from "@mui/material";
import { GitHub } from "@mui/icons-material";
import axios from "axios";

// This component is used in both App.js and QueryInterface.js:
// - In App.js: For global GitHub token and model selection settings
// - In QueryInterface.js: For per-query settings when generating SQL

function SettingsDialog({
  open,
  onClose,
  apiKey,
  onSave,
  onModelChange,
  selectedModel,
  disableEnforceFocus,
  disableAutoFocus,
  keepMounted,
  validateToken, // added validateToken prop from parent (App.js)
}) {
  const [token, setToken] = useState(apiKey);
  const [model, setModel] = useState(selectedModel || "copilot-4");
  const [saveToEnv, setSaveToEnv] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  // Update local state when props change
  useEffect(() => {
    if (open) {
      // Only reset values when dialog opens
      if (apiKey !== undefined) setToken(apiKey);
      if (selectedModel !== undefined) setModel(selectedModel);
    }
  }, [apiKey, selectedModel, open]);

  // Removed automatic token validation useEffect

  // New function for manual token validation
  const handleTestToken = async () => {
    if (token) {
      const valid = await validateToken(token);
      setTokenValid(valid);
    }
  };

  const handleSave = async () => {
    try {
      const modelChanged = onModelChange && model !== selectedModel;
      if (modelChanged) {
        onModelChange(model);
      }
      await onSave(token);
      // Remove the extra model update message and always push a single message
      let messages = [
        {
          message: "Settings saved",
          severity: "success",
        },
      ];

      if (saveToEnv) {
        await axios.post("/api/config/github-token", { token });
        messages.push({
          message: "Token saved to environment successfully!",
          severity: "success",
        });
      }

      if (window.snackbarStack) {
        messages.forEach((msg, index) => {
          setTimeout(() => {
            window.snackbarStack.addSnackbar(msg.message, msg.severity);
          }, index * 300);
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar("Failed to save settings", "error");
      }
    }
  };

  // Handle model change in the dialog - now applies immediately if configured to do so
  const handleModelChange = (event) => {
    const newModel = event.target.value;
    setModel(newModel);
  };

  // Update model options for OpenAI
  const modelOptions = [
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus={disableEnforceFocus}
      disableAutoFocus={disableAutoFocus}
      disablePortal // Added to avoid placing the dialog in a different layer which causes aria-hidden on #root
      keepMounted={keepMounted}
      aria-labelledby="settings-dialog-title"
    >
      <DialogTitle id="settings-dialog-title">
        <Box display="flex" alignItems="center">
          <GitHub sx={{ mr: 1 }} />
          GitHub Copilot Settings
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 2, mt: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Please enter your GitHub access token with Copilot permissions.
                This token will be used for generating and explaining SQL
                queries.
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Your token must have access to GitHub Copilot features.
              </Typography>
              <Link
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener"
                sx={{ display: "block", mb: 2 }}
              >
                Create a token at GitHub
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="GitHub Access Token"
              fullWidth
              value={token}
              onChange={(e) => setToken(e.target.value)}
              margin="dense"
              type="password"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleTestToken}
              color={
                tokenValid === true
                  ? "success"
                  : tokenValid === false
                  ? "error"
                  : "primary"
              }
            >
              Test Token
            </Button>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth margin="dense">
              <InputLabel id="copilot-model-label">Copilot Model</InputLabel>
              <Select
                labelId="copilot-model-label"
                id="copilot-model-select"
                value={model}
                label="Copilot Model"
                onChange={handleModelChange}
              >
                <MenuItem value="copilot-4">
                  GitHub Copilot 4{" "}
                  {selectedModel === "copilot-4" && <span>(current)</span>}
                </MenuItem>
                <MenuItem value="copilot-3.5">
                  GitHub Copilot 3.5{" "}
                  {selectedModel === "copilot-3.5" && <span>(current)</span>}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={saveToEnv}
                  onChange={(e) => setSaveToEnv(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  Also save to server environment (requires admin privileges)
                </Typography>
              }
            />
          </Grid>

          {saveToEnv && (
            <Grid item xs={12}>
              <Alert severity="info">
                This will update the server's environment configuration. The
                token will be available for all users.
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<GitHub />}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SettingsDialog;
