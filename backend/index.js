const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { createServer } = require("http");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(
   cors({
      origin: process.env.FRONTEND_SERVICE_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      maxAge: 86400, // 24 hrs
   })
);

// Body parser with size limits
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Essential security headers
app.use((req, res, next) => {
   res.setHeader("X-Content-Type-Options", "nosniff");
   res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
   );
   next();
});

// Connect to MongoDB
mongoose
   .connect(process.env.MONGODB_URI)
   .then(() => console.log("Connected to MongoDB"))
   .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({
      message: "Something went wrong!",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
   });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
   console.log("SIGTERM received. Shutting down gracefully...");
   httpServer.close(() => {
      mongoose.connection.close(false, () => {
         console.log("MongoDB connection closed.");
         process.exit(0);
      });
   });
});
