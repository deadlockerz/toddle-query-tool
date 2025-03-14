import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
// ...existing code...

const ConnectDialog = ({ open, onClose, onConnect }) => {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // ...existing code...

  const handleModelChange = (event) => {
    // Just update the state, don't trigger any other actions
    setSelectedModel(event.target.value);
  };

  const handleSave = async () => {
    // Only validate and process when Save is clicked
    if (!apiKey.trim()) {
      setError("API Key is required");
      return;
    }

    if (!selectedModel) {
      setError("Please select a model");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Validate the API key and update the model
      const success = await onConnect(apiKey, selectedModel);

      if (success) {
        // Close the dialog only on successful validation
        onClose();
      } else {
        setError("Invalid API key or connection failed");
      }
    } catch (err) {
      setError("Connection failed: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Connect to GitHub</DialogTitle>
      <DialogContent>
        {/* ...existing code... */}
        <TextField
          margin="dense"
          label="GitHub API Key"
          type="password"
          fullWidth
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Model</InputLabel>
          <Select
            value={selectedModel}
            onChange={handleModelChange}
            label="Model"
          >
            <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
            <MenuItem value="gpt-4">GPT-4</MenuItem>
            {/* ...existing model options... */}
          </Select>
        </FormControl>
        {error && <p className="error-message">{error}</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary" disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectDialog;
