// server.js
// Node 18+ recommended (has global fetch)
// Run: npm install && npm start

import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { URL } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Simple logging
app.use(morgan("dev"));

// Serve static frontend
app.use(express.static("public"));

// Body parsing for JSON and urlencoded
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "5mb" }));

/*
 SECURITY RECOMMENDATION:
 Replace or extend this whitelist with domains you trust.
 If left empty (allowedHosts.length === 0) the proxy will accept any hostname.
 */
const allowedHosts = [
  // example: "example.com", "api.example.org"
  // keep this list non-empty in production
  "example.com"
];

// Helper: check allowed host
function isHostAllowed(targetUrl) {
  if (!allowedHosts || allowedHosts.length === 0) return false; // require configuration
  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase();
    return allowedHosts.some(h => hostname === h || hostname.endsWith("." + h));
  } catch (e) {
    return false;
  }
}

/*
 Basic proxy endpoint:
 - Expects a JSON body { url, method?, headers?, body? } OR query param ?url=
 - Forwards request, returns response body and status, and content-type.
 - Streams binary data as arrayBuffer -> Buffer.
*/
app.all("/proxy", async (req, res) => {
  const target = req.method === "GET" && req.query.url ? req.query.url : (req.body && req.body.url);
  if (!target) {
    return res.status(400).json({ error: "Missing 'url' parameter in query or JSON body." });
  }

  // Basic validation
  let parsed;
  try {
    parsed = new URL(target);
  } catch (e) {
    return res.status(400).json({ error: "Invalid URL." });
  }

  // Enforce allowlist
  if (!isHostAllowed(target)) {
    return res.status(403).json({ error: "Host not allowed by server configuration." });
  }

  // Build fetch options
  const method = (req.body && req.body.method) || req.query.method || req.method || "GET";
  const headers = (req.body && req.body.headers) || {};
  // Prevent hop-by-hop headers being forwarded in ways that break things
  delete headers["host"];
  delete headers["connection"];
  delete headers["content-length"];

  let body = undefined;
  if (["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
    if (req.body && req.body.body) {
      // If frontend sends a body field (string or object)
      if (typeof req.body.body === "object") {
        body = JSON.stringify(req.body.body);
        headers["content-type"] = headers["content-type"] || "application/json";
      } else {
        body = req.body.body;
      }
    } else if (req._readableState && !Object.keys(req.body || {}).length) {
      // No JSON parsed body, maybe raw body was sent
      // For simplicity, we don't stream raw here.
    }
  }

  try {
    const fetchOptions = {
      method,
      headers,
      body
    };

    const upstream = await fetch(target, fetchOptions);

    // copy status and selected headers back
    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);

    // Stream the response body back:
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (err) {
    console.error("Proxy fetch error:", err);
    res.status(502).json({ error: "Bad gateway", details: String(err) });
  }
});

// Quick API to check server health
app.get("/_health", (req, res) => res.json({ status: "ok", time: Date.now() }));

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}/`);
  if (!allowedHosts || allowedHosts.length === 0) {
    console.warn("WARNING: allowedHosts is empty — proxy is disabled until you configure allowedHosts in server.js");
  } else {
    console.log("Allowed hosts:", allowedHosts);
  }
});
