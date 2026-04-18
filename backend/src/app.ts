import cors from "cors";
import express from "express";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import evaluationsRoutes from "./routes/evaluationsRoutes.js";
import groupsRoutes from "./routes/groupsRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import tasksRoutes from "./routes/tasksRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import workLogsRoutes from "./routes/workLogsRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", systemRoutes);
app.use("/api", authRoutes);
app.use("/api", usersRoutes);
app.use("/api", groupsRoutes);
app.use("/api", tasksRoutes);
app.use("/api", progressRoutes);
app.use("/api", evaluationsRoutes);
app.use("/api", adminRoutes);
app.use("/api", workLogsRoutes);

export default app;