import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  Paper,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Send as SendIcon,
  Code as CodeIcon,
  GitHub as GitHubIcon,
  Settings as SettingsIcon,
  CompareArrows as CompareArrowsIcon,
} from "@mui/icons-material";
import { useMutation } from "@tanstack/react-query";
import { explainQuery, validateAPIKey } from "../api"; // Import validateAPIKey and only keep explainQuery
import SettingsDialog from "./SettingsDialog";
import { useLocalStorage } from "../hooks/useLocalStorage";

function QueryInterface({ onOpenSettings, selectedModel = "gpt-3.5-turbo" }) {
  const [prompt, setPrompt] = useState("");
  const [query, setQuery] = useState("");
  const [outputContent, setOutputContent] = useState("");
  const [outputType, setOutputType] = useState(""); // Can be "sql", "explanation", "knex"
  const [openSettings, setOpenSettings] = useState(false);
  const [localSelectedModel, setLocalSelectedModel] = useLocalStorage(
    "copilot-model",
    selectedModel,
  );
  // Store token in state but don't use setter directly (using validateOpenAIKey instead)
  const [apiKey] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("github-token")) || "";
    } catch {
      return "";
    }
  });
  const [isValidToken, setIsValidToken] = useLocalStorage(
    "token-is-valid",
    Boolean(apiKey),
  );
  const [validating, setValidating] = useState(false);
  const [skipModelChangeNotification, setSkipModelChangeNotification] =
    useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // New states for the Knex conversion two-box layout
  const [sqlInputForKnex, setSqlInputForKnex] = useState("");
  const [knexOutput, setKnexOutput] = useState("");
  const [showKnexBoxes, setShowKnexBoxes] = useState(false);

  useEffect(() => {
    if (selectedModel && selectedModel !== localSelectedModel) {
      setLocalSelectedModel(selectedModel);
    }
  }, [selectedModel, localSelectedModel, setLocalSelectedModel]);

  // Show Knex conversion boxes when a SQL query is available or manually toggled
  useEffect(() => {
    if (query && outputType === "sql") {
      setSqlInputForKnex(query);
    }
  }, [query, outputType]);

  // Direct GitHub API connection for streaming results
  const streamResponse = async (promptText) => {
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const apiKey = localStorage.getItem("openai-api-key")
        ? JSON.parse(localStorage.getItem("openai-api-key"))
        : "";

      if (!apiKey) {
        throw new Error(
          "OpenAI API key is required. Please configure it in settings.",
        );
      }

      // Make a request to OpenAI API through our backend
      const response = await fetch("/api/ai/generate-query-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          apiKey: apiKey,
          model: localSelectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error connecting to API: ${response.statusText}`);
      }

      // Handle the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        setStreamingContent(result);
      }

      // When streaming completes, set the full content
      setQuery(result);
      setOutputContent(result);
      setOutputType("sql");
    } catch (error) {
      console.error("Streaming error:", error);
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(`Error: ${error.message}`, "error");
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const generateMutation = useMutation({
    mutationFn: async (promptText) => {
      // Use streaming for better UX
      await streamResponse(promptText);
      // The actual result will be set by streamResponse
      return { query: streamingContent };
    },
    onError: (error) => {
      console.error("Query generation failed:", error);
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          `Error generating query: ${error.message}`,
          "error",
        );
      }
      if (query) {
        setOutputType("sql");
      }
    },
  });

  const explainMutation = useMutation({
    mutationFn: (queryText) => explainQuery(queryText, localSelectedModel),
    onSuccess: (data) => {
      setOutputContent(data.explanation);
      setOutputType("explanation");
    },
    onError: (error) => {
      console.error("Explanation failed:", error);
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          `Error explaining query: ${error.message}`,
          "error",
        );
      }
    },
  });

  const knexConversionMutation = useMutation({
    mutationFn: (sqlQuery) => {
      return explainQuery(
        `Convert this SQL query to Knex.js format: ${sqlQuery}`,
        localSelectedModel,
      );
    },
    onSuccess: (data) => {
      setOutputContent(data.explanation);
      setOutputType("knex");
      setKnexOutput(data.explanation);
    },
    onError: (error) => {
      console.error("Knex conversion failed:", error);
      if (window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          `Error converting to Knex: ${error.message}`,
          "error",
        );
      }
    },
  });

  const handleGenerateQuery = () => {
    if (!prompt.trim()) return;
    generateMutation.mutate(prompt);
  };

  const handleExplainQuery = () => {
    if (!query.trim()) return;
    explainMutation.mutate(query);
  };

  const handleKnexConversion = () => {
    if (!query.trim() || outputType !== "sql") return;
    knexConversionMutation.mutate(query);
  };

  const handleKnexTwoBoxConversion = () => {
    if (!sqlInputForKnex.trim()) return;
    knexConversionMutation.mutate(sqlInputForKnex);
    setShowKnexBoxes(true);
  };

  const toggleKnexBoxes = () => {
    setShowKnexBoxes(!showKnexBoxes);
    if (!showKnexBoxes && query) {
      setSqlInputForKnex(query);
    }
  };

  // Function to validate OpenAI API key
  const validateAPIKey = async (token) => {
    try {
      const response = await fetch("/api/ai/validate-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: token }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isValid;
    } catch (error) {
      console.error("API key validation error:", error);
      return false;
    }
  };

  const validateOpenAIKey = async (token) => {
    setValidating(true);
    try {
      const isValid = await validateAPIKey(token);
      setIsValidToken(isValid);
      if (!isValid && window.snackbarStack) {
        window.snackbarStack.addSnackbar(
          "Invalid OpenAI API key. Please check your key and try again.",
          "error",
        );
      }
      return isValid;
    } catch (error) {
      console.error("Error validating token:", error);
      setIsValidToken(false);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSaveToken = async (newToken) => {
    return await validateOpenAIKey(newToken);
  };

  const handleModelChange = (model, applyImmediately = true) => {
    if (applyImmediately) {
      setLocalSelectedModel(model);
    }

    if (onOpenSettings) {
      onOpenSettings({ type: "modelChange", model });
    }

    if (!skipModelChangeNotification && window.snackbarStack) {
      window.snackbarStack.addSnackbar(`Model updated to ${model}`, "success");
    }

    setSkipModelChangeNotification(false);
  };

  const renderOutput = () => {
    if (isStreaming) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            borderRadius: 1,
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            fontSize: "0.875rem",
            overflow: "auto",
          }}
        >
          {streamingContent}
          <Box sx={{ display: "inline-block", ml: 1 }}>
            <span className="cursor-blink">_</span>
          </Box>
        </Paper>
      );
    }

    if (
      generateMutation.isPending ||
      explainMutation.isPending ||
      knexConversionMutation.isPending
    ) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!outputContent) {
      return (
        <Typography variant="body2" color="textSecondary">
          Generated content will appear here after you submit a prompt.
        </Typography>
      );
    }

    if (outputType === "sql" || outputType === "knex") {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            borderRadius: 1,
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            fontSize: "0.875rem",
            overflow: "auto",
          }}
        >
          {outputContent}
        </Paper>
      );
    }

    return (
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 2,
          whiteSpace: "pre-wrap",
          overflow: "auto",
        }}
      >
        {outputContent}
      </Paper>
    );
  };

  const showKnexButton =
    query.trim() &&
    (outputType === "sql" ||
      (!outputType && query.toLowerCase().includes("select")));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        p: { xs: 1, sm: 2, md: 2 },
        overflow: "visible",
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
            Ask what you want with selected Database
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
          rows={3}
          sx={{ "& textarea": { minHeight: { xs: "20px", sm: "30px" } } }}
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
      <Divider sx={{ mb: 2 }} />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto", // Changed from "hidden" to "auto"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">
            {outputType === "sql"
              ? "Generated SQL"
              : outputType === "explanation"
              ? "Explanation"
              : outputType === "knex"
              ? "Knex.js Code"
              : "Output"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {outputType === "sql" && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleExplainQuery}
                  disabled={!query.trim() || explainMutation.isPending}
                >
                  Explain
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={toggleKnexBoxes}
                  startIcon={<CompareArrowsIcon />}
                >
                  Knex Converter
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            maxHeight: "calc(100vh - 500px)", // Reduced from 450px to leave more room
            borderRadius: 1,
            border: "1px solid rgba(0, 0, 0, 0.12)",
            p: 2,
          }}
        >
          {renderOutput()}
        </Box>

        {showKnexButton && !showKnexBoxes && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 2,
              mb: 1,
              minHeight: "48px",
              position: "sticky", // Make the button sticky
              bottom: 0, // Stick to the bottom
              backgroundColor: "background.paper", // Match background
              zIndex: 1, // Ensure it's above other content
              py: 1, // Add padding
            }}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={handleKnexConversion}
              disabled={knexConversionMutation.isPending}
              startIcon={<CodeIcon />}
              sx={{
                py: 1,
                minHeight: "40px",
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              Convert to Knex.js
              {knexConversionMutation.isPending && (
                <CircularProgress size={16} sx={{ ml: 1 }} />
              )}
            </Button>
          </Box>
        )}
      </Box>

      {showKnexBoxes && (
        <Box
          sx={{
            mt: 2,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 1,
            borderTop: "1px solid rgba(0, 0, 0, 0.12)",
            pt: 2,
          }}
        >
          <Typography variant="h6" sx={{ width: "100%", mb: 1 }}>
            Knex.js Converter
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              width: "100%",
              gap: 1,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                SQL Query
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={sqlInputForKnex}
                onChange={(e) => setSqlInputForKnex(e.target.value)}
                placeholder="Paste your SQL query here..."
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "row", md: "column" },
                justifyContent: "center",
                alignItems: "center",
                py: { xs: 1, md: 2 },
              }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={handleKnexTwoBoxConversion}
                disabled={
                  knexConversionMutation.isPending || !sqlInputForKnex.trim()
                }
                sx={{
                  minWidth: { xs: "auto", md: "150px" },
                  px: { xs: 2, md: 3 },
                }}
              >
                {knexConversionMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <>
                    <CompareArrowsIcon sx={{ mr: 1 }} />
                    Convert to Knex
                  </>
                )}
              </Button>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Knex.js Code
              </Typography>
              <Paper
                elevation={0}
                variant="outlined"
                sx={{
                  p: 2,
                  height: "150px",
                  overflow: "auto",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {knexOutput || "Converted Knex.js code will appear here..."}
              </Paper>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
              mt: 1,
            }}
          >
            <Button size="small" onClick={toggleKnexBoxes}>
              Close Converter
            </Button>
          </Box>
        </Box>
      )}

      <SettingsDialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        apiKey={apiKey}
        onSave={handleSaveToken}
        selectedModel={localSelectedModel}
        onModelChange={(model) => handleModelChange(model, false)}
        isValidToken={isValidToken}
        validateToken={validateOpenAIKey}
        validating={validating}
        preventModelChangeNotification={(value) =>
          setSkipModelChangeNotification(value)
        }
      />
      <style jsx global>{`
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        .cursor-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </Box>
  );
}

export default QueryInterface;
