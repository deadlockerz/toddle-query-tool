require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// Import routes - Updated to ensure correct paths
const schemaRoutes = require("./src/routes/schema");
const queryRoutes = require("./src/routes/query");
const aiRoutes = require("./routes/ai");
const configRoutes = require("./routes/config");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy to fix express-rate-limit warning
app.set("trust proxy", 1);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes - Updated to use the correct route handlers
app.use("/api/schema", schemaRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/config", configRoutes);

app.get("/", (req, res) => {
  res.send("Toddle Query Tool API is running!");
});

// Error handling middleware - Enhanced to provide more details
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: err.message || "Something went wrong!",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Function to find available port
const startServer = (initialPort) => {
  let currentPort = initialPort;

  const server = app
    .listen(currentPort, () => {
      console.log(`Server running on port ${currentPort}`);
      // If we're using a different port than the default, log it clearly
      if (currentPort !== PORT) {
        console.log(
          `(Original port ${PORT} was in use, switched to ${currentPort})`,
        );
      }
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(
          `Port ${currentPort} is busy, trying ${currentPort + 1}...`,
        );
        currentPort++;
        server.close();
        startServer(currentPort);
      } else {
        console.error("Server error:", err);
      }
    });
};

// Start the server with the initial port
startServer(PORT);

module.exports = app;
