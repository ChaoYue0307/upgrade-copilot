import { scanRepository } from "../src/scanner.js";

const repoUrl = process.argv[2] || "CodingGarden/react-ts-starter";
const scan = await scanRepository({ repoUrl });

if (!scan.metadata.fullName) {
  throw new Error("Smoke scan did not return repository metadata.");
}

if (!scan.unsupported && scan.summary.dependencies === 0) {
  throw new Error("Smoke scan found manifests but no dependencies.");
}

console.log(JSON.stringify({
  repo: scan.metadata.fullName,
  readiness: scan.readiness,
  manifests: scan.summary.manifests,
  dependencies: scan.summary.dependencies,
  findings: scan.summary.findings,
  registry: scan.evidence.registry,
  unsupported: scan.unsupported
}, null, 2));
