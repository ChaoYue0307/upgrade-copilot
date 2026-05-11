import http from "node:http";
import { createHash } from "node:crypto";
import { scanRepository } from "./scanner.js";
import { generateLlmAnalysis } from "./llm.js";
import { getReport, listReports, saveReport, toReportSummary } from "./reports.js";

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

    const reportIdMatch = req.url.match(/^\/api\/reports\/(ucr_[a-f0-9]{16,32})$/);
    if (req.method === "GET" && reportIdMatch) {
      const report = await getReport(reportIdMatch[1]);
      if (!report) {
        sendJson(res, 404, { ok: false, error: "Report not found" });
        return;
      }
      sendJson(res, 200, { ok: true, report });
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/reports")) {
      const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
      const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
      sendJson(res, 200, { ok: true, reports: await listReports(limit) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/scan") {
      const body = await readJsonBody(req);
      const scan = await scanRepository({ repoUrl: body.repoUrl });
      const llm = body.includeLlm ? await generateLlmAnalysis(scan) : { enabled: false, markdown: null };
      const reportId = createReportId(scan);
      const report = {
        ok: true,
        reportId,
        reportUrl: body.save ? `/api/reports/${reportId}` : null,
        saved: false,
        createdAt: new Date().toISOString(),
        scan,
        llm
      };
      const payload = body.save ? await saveReport(report) : report;
      sendJson(res, 200, { ...payload, summary: toReportSummary(payload) });
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

function createReportId(scan) {
  const seed = [
    scan.metadata?.fullName,
    scan.metadata?.defaultBranch,
    scan.readiness,
    scan.summary?.dependencies,
    scan.summary?.findings,
    new Date().toISOString(),
    Math.random().toString(16).slice(2)
  ].join(":");
  return `ucr_${createHash("sha256").update(seed).digest("hex").slice(0, 16)}`;
}
