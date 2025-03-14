import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// API endpoints
export const fetchSchema = async () => {
  const response = await api.get("/schema");
  return response.data;
};

export const generateQuery = async (prompt, model = "copilot-4") => {
  // Get GitHub token from local storage
  const token = localStorage.getItem("github-token")
    ? JSON.parse(localStorage.getItem("github-token"))
    : "";

  if (!token) {
    throw new Error(
      "GitHub token is required. Please configure it in settings.",
    );
  }

  // Use provided model or get from localStorage
  const useModel =
    model || JSON.parse(localStorage.getItem("copilot-model") || '"copilot-4"');

  const response = await api.post("/ai/generate-query", {
    prompt,
    apiKey: token,
    model: useModel,
  });
  return response.data;
};

export const executeQuery = async (query) => {
  const response = await api.post("/query/execute", { query });
  return response.data;
};

export const explainQuery = async (query, model = "copilot-4") => {
  // Get GitHub token from local storage
  const token = localStorage.getItem("github-token")
    ? JSON.parse(localStorage.getItem("github-token"))
    : "";

  if (!token) {
    throw new Error(
      "GitHub token is required. Please configure it in settings.",
    );
  }

  // Use provided model or get from localStorage
  const useModel =
    model || JSON.parse(localStorage.getItem("copilot-model") || '"copilot-4"');

  const response = await api.post("/ai/explain-query", {
    query,
    apiKey: token,
    model: useModel,
  });
  return response.data;
};

export default api;
