// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import path from "path";
import { fileURLToPath } from "url";

// Setup environment + paths
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config ---
const PORT = process.env.PORT || 3000;
const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const model = "deepseek/DeepSeek-R1-0528";

// --- Verify token ---
if (!token) {
  console.error("❌ ERROR: GITHUB_TOKEN not found in .env");
  console.error("Add it like this:\nGITHUB_TOKEN=your_token_here\n");
  process.exit(1);
}

// --- Azure AI client ---
const client = ModelClient(endpoint, new AzureKeyCredential(token));

// --- Express setup ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Serve ai.html from root ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "ai.html"));
});

// --- Chat endpoint ---
app.post("/api/chat", async (req, res) => {
  try {
    const body = req.body || {};
    const messages = body.messages ?? [{ role: "user", content: "Hello" }];
    const max_tokens = body.max_tokens ?? 2048;

    const response = await client.path("/chat/completions").post({
      body: { messages, max_tokens, model },
    });

    if (isUnexpected(response)) {
      const err = response.body?.error ?? { message: "Unknown model error" };
      console.error("Model error:", err);
      return res.status(500).json({ error: err });
    }

    const reply = response.body?.choices?.[0]?.message?.content ?? "(no response)";
    res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`🧠 Open http://localhost:${PORT}/ in your browser to use ai.html`);
});
