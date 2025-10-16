import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { URL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging and body parsing
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "5mb" }));

// Whitelist domains you trust
const allowedHosts = [
  "example.com" // change or add more domains here
];

// Helper: check allowed host
function isHostAllowed(targetUrl) {
  if (!allowedHosts || allowedHosts.length === 0) return false;
  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase();
    return allowedHosts.some(h => hostname === h || hostname.endsWith("." + h));
  } catch (e) {
    return false;
  }
}

// Proxy route
app.all("/proxy", async (req, res) => {
  const target = req.query.url || (req.body && req.body.url);
  if (!target) return res.status(400).json({ error: "Missing 'url' parameter." });

  if (!isHostAllowed(target)) return res.status(403).json({ error: "Host not allowed." });

  const method = (req.body && req.body.method) || req.method || "GET";
  const headers = (req.body && req.body.headers) || {};
  delete headers["host"];
  delete headers["connection"];
  delete headers["content-length"];

  let body;
  if (["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
    if (req.body && req.body.body) {
      if (typeof req.body.body === "object") {
        body = JSON.stringify(req.body.body);
        headers["content-type"] = headers["content-type"] || "application/json";
      } else {
        body = req.body.body;
      }
    }
  }

  try {
    const upstream = await fetch(target, { method, headers, body });
    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("Proxy fetch error:", err);
    res.status(502).json({ error: "Bad gateway", details: String(err) });
  }
});

// Serve proxy.html manually
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "proxy.html"));
});

app.listen(PORT, () => {
  console.log(`Proxy server running → http://localhost:${PORT}/`);
});
