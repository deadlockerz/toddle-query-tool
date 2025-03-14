import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Send as SendIcon,
  PlayArrow as RunIcon,
  HelpOutline as HelpIcon,
  GitHub as GitHubIcon,
} from "@mui/icons-material";
import { useMutation } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { generateQuery, executeQuery, explainQuery } from "../api";
import ResultsViewer from "./ResultsViewer";
import QueryExplanation from "./QueryExplanation";
import SettingsDialog from "./SettingsDialog";
import { Settings as SettingsIcon } from "@mui/icons-material";
import { useLocalStorage } from "../hooks/useLocalStorage";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`query-tabpanel-${index}`}
      aria-labelledby={`query-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function QueryInterface({ onOpenSettings, selectedModel = "copilot-4" }) {
  const [prompt, setPrompt] = useState("");
  const [query, setQuery] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [results, setResults] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [openSettings, setOpenSettings] = useState(false);
  const [localSelectedModel, setLocalSelectedModel] = useLocalStorage(
    "copilot-model",
    selectedModel,
  );
  const [apiKey, setApiKey] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("github-token")) || "";
    } catch {
      return "";
    }
  });
  // Use stored validation state
  const [isValidToken, setIsValidToken] = useLocalStorage(
    "token-is-valid",
    Boolean(apiKey),
  );
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    // Only update the local model if the parent's selected model changes
    // and is different from our current local model
    if (selectedModel && selectedModel !== localSelectedModel) {
      setLocalSelectedModel(selectedModel);
    }
  }, [selectedModel, localSelectedModel, setLocalSelectedModel]);

  const generateMutation = useMutation({
    mutationFn: (promptText) => generateQuery(promptText, localSelectedModel),
    onSuccess: (data) => {
      setQuery(data.query);
    },
  });

  const executeMutation = useMutation({
    mutationFn: executeQuery,
    onSuccess: (data) => {
      setResults(data.results);
      setTabValue(1);
    },
  });

  const explainMutation = useMutation({
    mutationFn: (queryText) => explainQuery(queryText, localSelectedModel),
    onSuccess: (data) => {
      setExplanation(data.explanation);
      setTabValue(2);
    },
  });

  const handleGenerateQuery = () => {
    if (!prompt.trim()) return;
    generateMutation.mutate(prompt);
  };

  const handleExecuteQuery = () => {
    if (!query.trim()) return;
    executeMutation.mutate(query);
  };

  const handleExplainQuery = () => {
    if (!query.trim()) return;
    explainMutation.mutate(query);
  };

  const validateGitHubToken = async (token) => {
    if (!token) {
      setIsValidToken(false);
      return false;
    }

    setValidating(true);
    try {
      // Updated headers to use Bearer format which is GitHub's preferred format
      const response = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const valid = response.status === 200;
      // Store validation result in local storage
      setIsValidToken(valid);
      return valid;
    } catch (error) {
      console.error("Error validating token:", error);
      setIsValidToken(false);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSaveToken = async (newToken) => {
    if (!newToken) {
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar("Token cannot be empty", "error");
      }
      return false;
    }

    // Validate the token before saving
    const isValid = await validateGitHubToken(newToken);

    if (isValid) {
      setApiKey(newToken);
      localStorage.setItem("github-token", JSON.stringify(newToken));
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          "GitHub token validated and saved",
          "success",
        );
      }
      return true;
    } else {
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          "Invalid GitHub token. Make sure it has the correct permissions.",
          "error",
        );
      }
      return false;
    }
  };

  // Add a new flag to track whether model changes should trigger snackbar notifications
  const [skipModelChangeNotification, setSkipModelChangeNotification] =
    useState(false);

  // This will be passed to the SettingsDialog
  const handleModelChange = (model, applyImmediately = true) => {
    // Only update the model if applyImmediately is true
    if (applyImmediately) {
      setLocalSelectedModel(model);
    }

    // Notify parent component about model change
    if (onOpenSettings) {
      onOpenSettings({ type: "modelChange", model });
    }

    // Only show snackbar notification if not skipped
    if (!skipModelChangeNotification && window.snackbarStack) {
      window.snackbarStack.addSnackbar(
        `Model updated to ${model.replace("copilot-", "")}`,
        "success",
      );
    }

    // Reset the flag for future changes
    setSkipModelChangeNotification(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%", // Use full height of parent
        p: { xs: 1, sm: 2, md: 2 },
        overflow: "visible", // changed from "auto"
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 1,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Natural Language Query
          </Typography>
          <Chip
            key={localSelectedModel}
            icon={<GitHubIcon />}
            label={`Copilot: ${localSelectedModel.replace("copilot-", "")}`}
            size="small"
            sx={{
              backgroundColor: "grey.400",
              color: "white",
            }}
          />
          <Button
            size="small"
            onClick={() => setOpenSettings(true)}
            variant="outlined"
            sx={{
              color: isValidToken ? "success.main" : "error.main",
              borderColor: "currentColor",
            }}
          >
            <SettingsIcon /> {isValidToken ? "Connected" : "Invalid"}
          </Button>
        </Box>
        <TextField
          fullWidth
          multiline
          rows={4} // Reduced rows from 6 to 4
          sx={{ "& textarea": { minHeight: { xs: "20px", sm: "30px" } } }} // Reduced height
          variant="outlined"
          placeholder="Describe what data you want to query in natural language..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={generateMutation.isPending}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleGenerateQuery}
            disabled={!prompt.trim() || generateMutation.isPending}
            sx={{ mt: 1 }}
            endIcon={
              generateMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <SendIcon />
              )
            }
          >
            Generate
          </Button>
        </Box>
      </Box>
      <Divider sx={{ mb: 1 }} /> {/* Reduced margin */}
      <Box sx={{ mb: 1 }}>
        {" "}
        {/* Reduced margin */}
        <Typography variant="h6" gutterBottom>
          SQL Query
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            height: { xs: 180, sm: 250 }, // increased height for mobile
            mb: 1,
          }}
        >
          <Editor
            height="100%"
            language="sql"
            value={query}
            onChange={setQuery}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </Paper>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            onClick={handleExplainQuery}
            disabled={!query.trim() || explainMutation.isPending}
            startIcon={
              explainMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <HelpIcon />
              )
            }
          >
            Explain Query
          </Button>
          <Button
            variant="contained"
            onClick={handleExecuteQuery}
            disabled={!query.trim() || executeMutation.isPending}
            startIcon={
              executeMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <RunIcon />
              )
            }
          >
            Run Query
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: { xs: "180px", sm: "250px" }, // updated for responsiveness
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="SQL Editor" />
            <Tab label="Results" />
            <Tab label="Explanation" />
          </Tabs>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            overflow: "visible", // changed from overflow:"auto"
            // removed maxHeight so that content pushes downward rather than scrolling
          }}
        >
          <TabPanel value={tabValue} index={0}>
            <Typography variant="body2" color="textSecondary">
              Generated SQL will appear above. Click "Run Query" to execute it.
            </Typography>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {executeMutation.isPending ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResultsViewer results={results} />
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {explainMutation.isPending ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <QueryExplanation explanation={explanation} />
            )}
          </TabPanel>
        </Box>
      </Box>
      <SettingsDialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        apiKey={apiKey}
        onSave={handleSaveToken}
        selectedModel={localSelectedModel}
        onModelChange={(model) => handleModelChange(model, false)}
        isValidToken={isValidToken}
        validateToken={validateGitHubToken}
        validating={validating}
        // Add a new prop to indicate if model change notifications should be handled by the dialog
        preventModelChangeNotification={(value) =>
          setSkipModelChangeNotification(value)
        }
      />
    </Box>
  );
}

export default QueryInterface;
