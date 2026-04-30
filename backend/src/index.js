import express from "express";
import cors from "cors";
import { initializeDatabase } from "./db.js";
import routes from "./routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use("/api", routes);

// Initialize DB tables
initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
