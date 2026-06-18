import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import todoRoutes from "./routes/todoRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb://192.168.0.195:27017/node_todo";

/**
 * OPEN CORS CONFIG (ALLOW ALL ORIGINS)
 */
app.use(
  cors({
    origin: "*",        // allow all domains
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// handle preflight requests explicitly
app.options("*", cors());

app.use(express.json());

/**
 * HEALTH CHECK
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * ROUTES
 */
app.use("/api/todos", todoRoutes);

/**
 * ERROR HANDLER
 */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
  });
});

/**
 * START SERVER
 */
async function start() {
  try {
    await mongoose.connect(mongoUri);

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();