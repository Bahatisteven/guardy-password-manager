import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "./middleware/rateLimit.js";
import router from "./routes/index.js";


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
   origin: process.env.FRONTEND_URL || "*",
   Credentials: true,
   }));
app.use(morgan("combined"));
app.use(compression());

console.log("Router from index.js",router );
app.use("/api", rateLimit);
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

app.use("/api", router);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An unexpected error occurred"});
});


app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

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