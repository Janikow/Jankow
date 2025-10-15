import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { main as runAI } from "./AI.js"; // Import your AI model function

dotenv.config(); // loads .env file if present
const app = express();
app.use(cors());
app.use(express.json());

// POST /api/chat
app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;
    if (!message) return res.status(400).json({ error: "Missing message" });

    // Run your AI model (modify AI.js to return the reply instead of just logging it)
    const reply = await runAI(message);
    res.json({ reply });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Serve your frontend (optional)
app.use(express.static("."));
app.get("/", (req, res) => res.sendFile("index.html", { root: "." }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
