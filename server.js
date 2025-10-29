import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import session from "express-session";
import { apiLimiter } from "./middleware/rateLimit.js";
import { metricsMiddleware, metricsRoute } from "./middleware/metricsMiddleware.js";
import logger from "./utils/logger.js";
import router from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";


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
import requestLogger from "./middleware/requestLogger.js";

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(requestLogger);

app.get("/api/health", (req, res) => {
  logger.info("Health check route hit");
  res.status(200).json({ message: "Server is healthy" });
});

app.use(metricsMiddleware);
app.get("/metrics", metricsRoute);

app.use("/api", apiLimiter, router);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);


const server = app.listen(PORT, () => logger.info(`Server started on port ${PORT}`));

// gracefull shutdown

process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
  });
});