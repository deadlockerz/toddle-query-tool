const express = require("express");
const path = require("path");
const databaseRoutes = require("./routes/databaseRoutes");
const configRoutes = require("./routes/config");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/build")));

// API Routes
app.use("/api", databaseRoutes);
app.use("/api/config", configRoutes);
app.use("/api/verify-openai-key", configRoutes);

// Serve frontend in production
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
