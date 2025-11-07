import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import devicesRoutes from "./routes/devices.js";

dotenv.config();
const app = express();

// Allow requests from frontend
app.use(cors({
  origin: "*", // or "*" for all origins
  credentials: true // if you use cookies
}));

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/devices", devicesRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
