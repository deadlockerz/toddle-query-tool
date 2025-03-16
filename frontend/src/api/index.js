import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

export const generateQuery = async (prompt, model = "gpt-3.5-turbo") => {
  const apiKey = localStorage.getItem("openai-api-key")
    ? JSON.parse(localStorage.getItem("openai-api-key"))
    : "";

  if (!apiKey) {
    throw new Error(
      "OpenAI API key is required. Please configure it in settings.",
    );
  }

  // Use provided model or get from localStorage
  const useModel =
    model ||
    JSON.parse(localStorage.getItem("openai-model") || '"gpt-3.5-turbo"');

  try {
    const response = await api.post("/ai/generate-query", {
      prompt,
      apiKey,
      model: useModel,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    if (error.response) {
      throw new Error(
        `API Error: ${error.response.data.error || error.message}`,
      );
    } else if (error.request) {
      throw new Error(
        "Network error: Server did not respond. Check your connection.",
      );
    } else {
      throw error;
    }
  }
};

// Add streaming API helper
export const generateQueryStream = async (prompt, model = "gpt-3.5-turbo") => {
  const apiKey = localStorage.getItem("openai-api-key")
    ? JSON.parse(localStorage.getItem("openai-api-key"))
    : "";

  if (!apiKey) {
    throw new Error(
      "OpenAI API key is required. Please configure it in settings.",
    );
  }

  const useModel =
    model ||
    JSON.parse(localStorage.getItem("openai-model") || '"gpt-3.5-turbo"');

  const response = await fetch("/api/ai/generate-query-stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      apiKey,
      model: useModel,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error connecting to API: ${response.statusText}`);
  }

  return response;
};

export const explainQuery = async (query, model = "gpt-3.5-turbo") => {
  // Get OpenAI API key from local storage
  const apiKey = localStorage.getItem("openai-api-key")
    ? JSON.parse(localStorage.getItem("openai-api-key"))
    : "";

  if (!apiKey) {
    throw new Error(
      "OpenAI API key is required. Please configure it in settings.",
    );
  }

  // Use provided model or get from localStorage
  const useModel =
    model ||
    JSON.parse(localStorage.getItem("openai-model") || '"gpt-3.5-turbo"');

  try {
    const response = await api.post("/ai/explain-query", {
      query,
      apiKey,
      model: useModel,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    if (error.response) {
      throw new Error(
        `API Error: ${error.response.data.error || error.message}`,
      );
    } else if (error.request) {
      throw new Error(
        "Network error: Server did not respond. Check your connection.",
      );
    } else {
      throw error;
    }
  }
};

export const validateAPIKey = async (apiKey) => {
  try {
    const response = await api.post("/ai/test-token", { apiKey });
    return response.data.valid;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

export default api;
