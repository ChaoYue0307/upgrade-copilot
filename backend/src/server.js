import http from "node:http";
import { scanRepository } from "./scanner.js";
import { generateLlmAnalysis } from "./llm.js";

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { ok: true, service: "upgrade-copilot-backend" });
      return;
    }

    if (req.method === "POST" && req.url === "/api/scan") {
      const body = await readJsonBody(req);
      const scan = await scanRepository({ repoUrl: body.repoUrl });
      const llm = body.includeLlm ? await generateLlmAnalysis(scan) : { enabled: false, markdown: null };
      sendJson(res, 200, { ok: true, scan, llm });
      return;
    }

    sendJson(res, 404, { ok: false, error: "Not found" });
  } catch (error) {
    const status = /Expected a GitHub/.test(error.message) ? 400 : 500;
    sendJson(res, status, { ok: false, error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Upgrade Copilot backend listening on http://127.0.0.1:${PORT}`);
});

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}
