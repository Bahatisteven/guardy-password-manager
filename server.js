import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "./middleware/rateLimit.js";
import { metricsMiddleware, metricsRoute } from "./middleware/metricsMiddleware.js";
import logger from "./utils/logger.js";
import router from "./routes/index.js";


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
   origin: process.env.FRONTEND_URL,
   credentials: true,
   }));

app.use(morgan("combined"));

app.use(compression());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  logger.info("Health check route hit");
  res.status(200).json({ message: "Server is healthy" });
});

app.use(metricsMiddleware);
app.get("/metrics", metricsRoute);

app.use("/api", router);

app.use("/api", rateLimit);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ message: "An unexpected error occurred"});
});


const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// gracefull shutdown

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});