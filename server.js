import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";

dotenv.config();


app.use(express.json());


app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*"}));
app.use(morgan("combined"));


app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use("/api/auth", authRoutes());
app.use("/api/vault", vaultRoutes());





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));