import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const defaultDataDir = fileURLToPath(new URL("../data", import.meta.url));
const DATA_DIR = process.env.UPGRADE_COPILOT_DATA_DIR || defaultDataDir;
const REPORTS_DIR = join(DATA_DIR, "reports");

export async function saveReport(report) {
  validateReportId(report.reportId);
  const record = {
    ...report,
    saved: true,
    savedAt: new Date().toISOString()
  };
  const path = reportPath(report.reportId);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return record;
}

export async function getReport(reportId) {
  validateReportId(reportId);
  try {
    const text = await readFile(reportPath(reportId), "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function listReports(limit = 20) {
  await mkdir(REPORTS_DIR, { recursive: true });
  const entries = await readdir(REPORTS_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name);
  const reports = [];
  for (const file of files) {
    const report = await getReport(file.replace(/\.json$/, ""));
    if (report) reports.push(toReportSummary(report));
  }
  return reports
    .sort((a, b) => String(b.savedAt || b.createdAt).localeCompare(String(a.savedAt || a.createdAt)))
    .slice(0, limit);
}

export function toReportSummary(report) {
  return {
    reportId: report.reportId,
    saved: Boolean(report.saved),
    createdAt: report.createdAt,
    savedAt: report.savedAt,
    repo: report.scan?.metadata?.fullName || "unknown",
    readiness: report.scan?.readiness || "unknown",
    dependencies: report.scan?.summary?.dependencies || 0,
    findings: report.scan?.summary?.findings || 0,
    majorCandidates: report.scan?.summary?.majorCandidates || 0
  };
}

function reportPath(reportId) {
  return join(REPORTS_DIR, `${reportId}.json`);
}

function validateReportId(reportId) {
  if (!/^ucr_[a-f0-9]{16,32}$/.test(reportId || "")) {
    throw new Error("Invalid report id.");
  }
}
