const MANIFESTS = {
  "package.json": { ecosystem: "npm", label: "JavaScript / npm" },
  "requirements.txt": { ecosystem: "pypi", label: "Python requirements" },
  "pyproject.toml": { ecosystem: "pypi", label: "Python pyproject" },
  "Pipfile": { ecosystem: "pypi", label: "Python Pipenv" },
  "Gemfile": { ecosystem: "rubygems", label: "Ruby Bundler" },
  "go.mod": { ecosystem: "go", label: "Go modules" },
  "Cargo.toml": { ecosystem: "crates", label: "Rust Cargo" },
  "composer.json": { ecosystem: "packagist", label: "PHP Composer" },
  "pom.xml": { ecosystem: "maven", label: "Java Maven" },
  "build.gradle": { ecosystem: "maven", label: "Java Gradle" },
  "build.gradle.kts": { ecosystem: "maven", label: "Java Gradle" }
};

const COMMON_WORKSPACE_DIRS = new Set(["apps", "packages", "services", "frontend", "backend", "examples", "example", "demo", "api", "web", "client", "server"]);
const MANIFEST_NAMES = new Set(Object.keys(MANIFESTS));
const MAX_MANIFESTS = 35;
const MAX_REGISTRY_LOOKUPS = 90;

const LOCKFILE_NAMES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "Pipfile.lock",
  "poetry.lock",
  "requirements.lock",
  "Gemfile.lock",
  "go.sum",
  "Cargo.lock",
  "composer.lock",
  "gradle.lockfile"
]);

const RULE_PACKS = {
  npm: {
    validation: ["npm run build", "npm test", "npm run lint", "npm run typecheck"],
    packages: {
      react: { family: "React", risk: "React major upgrades should be separated from routing, rendering, and test-library changes.", related: ["react-dom", "@testing-library/react", "react-router-dom"] },
      "react-dom": { family: "React", risk: "React DOM should move with React and UI rendering validation.", related: ["react"] },
      "react-router-dom": { family: "React Router", risk: "Router major upgrades can change navigation and data-loading behavior.", related: ["react"] },
      next: { family: "Next.js", risk: "Next.js major upgrades often touch routing, server rendering, config, images, and build output.", related: ["react", "eslint-config-next"] },
      vite: { family: "Vite", risk: "Vite major upgrades should be validated with build, dev server, and preview smoke checks.", related: ["vitest", "@vitejs/plugin-react"] },
      vitest: { family: "Vitest", risk: "Vitest major upgrades can affect jsdom, globals, snapshots, and setup files.", related: ["vite", "jsdom"] },
      eslint: { family: "ESLint", risk: "ESLint major upgrades should be isolated from runtime package changes.", related: ["typescript", "@typescript-eslint/parser"] },
      typescript: { family: "TypeScript", risk: "TypeScript upgrades can expose latent type errors and build-tool config issues.", related: ["@typescript-eslint/parser"] },
      tailwindcss: { family: "Tailwind", risk: "Tailwind major upgrades can change config shape, content scanning, and generated CSS.", related: ["postcss", "autoprefixer"] },
      webpack: { family: "Build tooling", risk: "Webpack major upgrades can affect loaders, plugins, and asset output.", related: ["webpack-cli"] },
      jest: { family: "Testing", risk: "Jest major upgrades can affect transforms, environments, fake timers, and snapshots.", related: ["babel-jest", "ts-jest"] },
      jsdom: { family: "Testing", risk: "jsdom changes can break browser-like test assumptions.", related: ["vitest", "jest"] }
    }
  },
  pypi: {
    validation: ["python -m pytest", "python manage.py test", "python manage.py check", "python manage.py collectstatic --noinput"],
    packages: {
      django: { family: "Django", risk: "Django major jumps should usually move through the current LTS target first.", related: ["djangorestframework", "django-debug-toolbar", "django-extensions"] },
      djangorestframework: { family: "Django REST Framework", risk: "DRF upgrades can change serializer, router, and authentication behavior.", related: ["django"] },
      flask: { family: "Flask", risk: "Flask major upgrades can affect app factories, config, routing, and extensions.", related: ["werkzeug", "jinja2"] },
      fastapi: { family: "FastAPI", risk: "FastAPI upgrades should be validated with Pydantic and OpenAPI behavior.", related: ["pydantic", "starlette"] },
      pydantic: { family: "Pydantic", risk: "Pydantic major upgrades can change validation semantics and model APIs.", related: ["fastapi"] },
      sqlalchemy: { family: "SQLAlchemy", risk: "SQLAlchemy major upgrades can affect sessions, query APIs, and migrations.", related: ["alembic"] },
      gunicorn: { family: "Deployment", risk: "Gunicorn upgrades should be tested separately from framework semantics.", related: [] },
      whitenoise: { family: "Static files", risk: "WhiteNoise upgrades should be validated with collectstatic and production settings.", related: ["django"] },
      pytest: { family: "Testing", risk: "pytest upgrades can affect plugin compatibility and fixtures.", related: [] }
    }
  },
  rubygems: {
    validation: ["bundle exec rails test", "bundle exec rspec", "bundle exec rake"],
    packages: {
      rails: { family: "Rails", risk: "Rails major upgrades affect framework defaults, autoloading, ActiveRecord, assets, and test behavior.", related: ["actionpack", "activerecord"] },
      rspec: { family: "Testing", risk: "RSpec upgrades can affect matchers, mocks, and spec helper setup.", related: ["rspec-rails"] },
      puma: { family: "Deployment", risk: "Puma upgrades should be validated with production server config.", related: [] }
    }
  },
  go: {
    validation: ["go test ./...", "go vet ./...", "go mod tidy"],
    packages: {
      "github.com/gin-gonic/gin": { family: "Go web", risk: "Gin upgrades can affect middleware, binding, and routing behavior.", related: [] },
      "github.com/gorilla/mux": { family: "Go routing", risk: "Router upgrades should be validated with HTTP integration tests.", related: [] },
      "gorm.io/gorm": { family: "Go ORM", risk: "GORM upgrades can affect query behavior and migrations.", related: [] }
    }
  },
  crates: {
    validation: ["cargo test", "cargo clippy", "cargo build --release"],
    packages: {
      tokio: { family: "Rust async", risk: "Tokio upgrades should be validated with async runtime and integration tests.", related: [] },
      axum: { family: "Rust web", risk: "Axum upgrades can affect handlers, routing, extractors, and tower compatibility.", related: ["tower", "hyper"] },
      serde: { family: "Serialization", risk: "Serde upgrades should be validated where wire formats are stable interfaces.", related: [] }
    }
  },
  packagist: {
    validation: ["composer test", "phpunit", "composer validate"],
    packages: {
      "laravel/framework": { family: "Laravel", risk: "Laravel major upgrades affect framework defaults, service providers, queues, config, and tests.", related: [] },
      "symfony/symfony": { family: "Symfony", risk: "Symfony upgrades can affect components, config, routing, and service wiring.", related: [] },
      phpunit: { family: "Testing", risk: "PHPUnit major upgrades can require assertion and test bootstrap changes.", related: [] }
    }
  },
  maven: {
    validation: ["mvn test", "mvn verify", "./gradlew test"],
    packages: {
      "org.springframework.boot:spring-boot-starter-web": { family: "Spring Boot", risk: "Spring Boot upgrades can affect framework defaults, dependency management, config, and tests.", related: [] },
      "org.junit.jupiter:junit-jupiter": { family: "Testing", risk: "JUnit upgrades should be validated with test runtime and build plugin config.", related: [] }
    }
  }
};

const form = document.querySelector("#reportForm");
const input = document.querySelector("#repoUrl");
const button = document.querySelector("#submitButton");
const result = document.querySelector("#result");
const shareUrlInput = document.querySelector("#shareUrl");
const waitlistForm = document.querySelector("#waitlistForm");
const waitlistStatus = document.querySelector("#waitlistStatus");
const scanMode = document.querySelector("#scanMode");
let currentReport = null;
let currentMarkdown = "";
const registryCache = new Map();
const configuredBackendApiUrl = getBackendApiUrl();
const backendTimeoutMs = Number(window.UPGRADE_COPILOT_CONFIG?.backendTimeoutMs || 7000);

updateScanMode(configuredBackendApiUrl ? "hosted backend" : "browser");

document.querySelectorAll("[data-demo]").forEach((demo) => {
  demo.addEventListener("click", () => {
    input.value = demo.dataset.demo;
    form.requestSubmit();
  });
});

document.querySelector("#copyShareUrl").addEventListener("click", async () => {
  await copyText(shareUrlInput.value);
  shareUrlInput.focus();
  shareUrlInput.select();
});

document.querySelector("#copyMarkdown").addEventListener("click", async () => {
  if (currentMarkdown) await copyText(currentMarkdown);
});

document.querySelector("#downloadMarkdown").addEventListener("click", () => {
  if (!currentReport || !currentMarkdown) return;
  const slug = currentReport.metadata.full_name.replace(/[^\w.-]+/g, "-").toLowerCase();
  const blob = new Blob([currentMarkdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug}-upgrade-risk-report.md`;
  link.click();
  URL.revokeObjectURL(url);
});

waitlistForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const parsedRepo = parseRepo(input.value);
  const repo = currentReport?.metadata.full_name || (parsedRepo ? `${parsedRepo.owner}/${parsedRepo.repo}` : "unknown repo");
  const body = [
    "## Contact",
    document.querySelector("#contactName").value || "(not provided)",
    "",
    "## Email or GitHub handle",
    document.querySelector("#contactEmail").value || "(not provided)",
    "",
    "## Buyer type",
    document.querySelector("#buyerType").value,
    "",
    "## Most useful premium feature",
    document.querySelector("#interest").value,
    "",
    "## Repository scanned",
    repo,
    "",
    "## Shareable report URL",
    shareUrlInput.value || window.location.href,
    "",
    "## Upgrade problem",
    document.querySelector("#context").value || "(not provided)"
  ].join("\n");
  const issueUrl = new URL("https://github.com/ChaoYue0307/upgrade-copilot/issues/new");
  issueUrl.searchParams.set("title", `Premium waitlist: ${repo}`);
  issueUrl.searchParams.set("body", body);
  window.open(issueUrl.toString(), "_blank", "noopener");
  waitlistStatus.textContent = "Opened a prefilled GitHub issue in a new tab.";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const parsed = parseRepo(input.value);
  if (!parsed) {
    renderUnsupportedReport("Please enter a GitHub repository URL like https://github.com/owner/repo.", null);
    return;
  }
  button.disabled = true;
  button.textContent = "Scanning...";
  try {
    const report = await runScan(parsed);
    updateRepoParam(parsed);
    renderReport(report);
  } catch (error) {
    renderUnsupportedReport(error.message || "Could not scan this repository.", null);
  } finally {
    button.disabled = false;
    button.textContent = "Generate report";
  }
});

const initialRepo = new URLSearchParams(window.location.search).get("repo");
if (initialRepo) {
  input.value = initialRepo;
  form.requestSubmit();
}

async function runScan(parsed) {
  const backendApiUrl = getBackendApiUrl();
  updateScanMode(backendApiUrl ? "hosted backend" : "browser");
  if (!backendApiUrl) return scanRepo(parsed.owner, parsed.repo);

  let timeout = null;
  try {
    const controller = new AbortController();
    timeout = window.setTimeout(() => controller.abort(), backendTimeoutMs);
    const response = await fetch(`${backendApiUrl.replace(/\/$/, "")}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        repoUrl: `${parsed.owner}/${parsed.repo}`,
        includeLlm: Boolean(window.UPGRADE_COPILOT_CONFIG?.enableLlm)
      })
    });
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Backend scan failed");
    }
    return normalizeBackendReport(payload);
  } catch (error) {
    console.warn("Hosted backend scan failed; falling back to browser scanner.", error);
    updateScanMode("browser fallback");
    return scanRepo(parsed.owner, parsed.repo);
  } finally {
    if (timeout) window.clearTimeout(timeout);
  }
}

function getBackendApiUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("backend");
  if (fromQuery === "browser") {
    localStorage.removeItem("upgradeCopilotBackendApiUrl");
    return "";
  }
  if (fromQuery) {
    localStorage.setItem("upgradeCopilotBackendApiUrl", fromQuery);
    return fromQuery;
  }
  return window.UPGRADE_COPILOT_CONFIG?.backendApiUrl || localStorage.getItem("upgradeCopilotBackendApiUrl") || "";
}

function updateScanMode(mode) {
  if (!scanMode) return;
  scanMode.innerHTML = `Scan mode: <strong>${escapeHtml(mode)}</strong>`;
}

function parseRepo(value) {
  try {
    const url = new URL(value.trim());
    const [, owner, repo] = url.pathname.split("/");
    if (url.hostname !== "github.com" || !owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    const match = value.trim().match(/^([\w.-]+)\/([\w.-]+)$/);
    return match ? { owner: match[1], repo: match[2] } : null;
  }
}

async function scanRepo(owner, repo) {
  const metadata = await fetchJson(`https://api.github.com/repos/${owner}/${repo}`);
  const tree = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(metadata.default_branch)}?recursive=1`);
  const treeItems = tree.tree || [];
  const availablePaths = new Set(treeItems.filter((item) => item.type === "blob").map((item) => item.path));
  const candidatePaths = findManifestPaths(availablePaths);
  const lockfiles = findLockfiles(availablePaths);
  const searched = Array.from(MANIFEST_NAMES).sort();

  if (!candidatePaths.length) {
    return buildUnsupportedReport(metadata, searched, lockfiles);
  }

  const files = [];
  for (const path of candidatePaths.slice(0, MAX_MANIFESTS)) {
    const text = await fetchRaw(owner, repo, metadata.default_branch, path);
    if (text) files.push({ path, name: basename(path), branch: metadata.default_branch, text, ...MANIFESTS[basename(path)] });
  }

  const dependencies = files.flatMap(parseDependencyFile).filter((dep) => dep.name);
  const enriched = await enrichDependencies(dependencies);
  const findings = buildFindings(files, enriched, lockfiles, searched);
  const majorCount = enriched.filter((dep) => dep.majorGap > 0).length;
  const outdatedCount = enriched.filter((dep) => dep.outdated).length;
  const readiness = calculateReadiness(findings, majorCount, outdatedCount);
  const lookupStats = {
    attempted: enriched.filter((dep) => dep.lookupAttempted).length,
    succeeded: enriched.filter((dep) => dep.latest).length,
    failed: enriched.filter((dep) => dep.lookupAttempted && !dep.latest).length
  };

  return { metadata, files, dependencies, notable: sortNotable(enriched), findings, majorCount, outdatedCount, readiness, lockfiles, searched, lookupStats, unsupported: false };
}

function findManifestPaths(paths) {
  return Array.from(paths)
    .filter((path) => MANIFEST_NAMES.has(basename(path)) && isShallowCandidate(path))
    .sort((a, b) => scorePath(a) - scorePath(b) || a.localeCompare(b));
}

function findLockfiles(paths) {
  return Array.from(paths)
    .filter((path) => LOCKFILE_NAMES.has(basename(path)) && isShallowCandidate(path))
    .sort();
}

function isShallowCandidate(path) {
  const parts = path.split("/");
  if (parts.length === 1) return true;
  if (parts.length <= 3 && COMMON_WORKSPACE_DIRS.has(parts[0])) return true;
  if (parts.length <= 2 && parts[0].startsWith(".")) return false;
  return false;
}

function scorePath(path) {
  const parts = path.split("/");
  if (parts.length === 1) return 0;
  if (["apps", "packages", "services"].includes(parts[0])) return 1;
  return 2;
}

function basename(path) {
  return path.split("/").pop();
}

async function enrichDependencies(dependencies) {
  const unique = [];
  const seen = new Set();
  for (const dep of dependencies) {
    const key = `${dep.ecosystem}:${dep.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(dep);
    }
  }

  const lookupTargets = unique.slice(0, MAX_REGISTRY_LOOKUPS);
  await Promise.all(lookupTargets.map(async (dep) => {
    const latest = await lookupLatest(dep.ecosystem, dep.name);
    dep.lookupAttempted = supportsRegistryLookup(dep.ecosystem);
    dep.latest = latest?.version || null;
    dep.registryUrl = latest?.url || null;
  }));

  return unique.map((dep) => {
    const rule = getRule(dep);
    const majorGap = calculateMajorGap(dep.version, dep.latest);
    const outdated = Boolean(dep.latest && compareVersions(dep.version, dep.latest) < 0);
    const pinned = isPinned(dep.version, dep.ecosystem);
    return { ...dep, rule, family: rule?.family || ecosystemLabel(dep.ecosystem), majorGap, outdated, pinned };
  });
}

async function lookupLatest(ecosystem, name) {
  if (!supportsRegistryLookup(ecosystem)) return null;
  const key = `${ecosystem}:${name}`;
  if (registryCache.has(key)) return registryCache.get(key);

  const promise = lookupLatestUncached(ecosystem, name).catch(() => null);
  registryCache.set(key, promise);
  return promise;
}

function supportsRegistryLookup(ecosystem) {
  return ["npm", "pypi", "crates", "packagist", "rubygems", "go", "maven"].includes(ecosystem);
}

async function lookupLatestUncached(ecosystem, name) {
  if (ecosystem === "npm") {
    const data = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
    return { version: data["dist-tags"]?.latest, url: `https://www.npmjs.com/package/${name}` };
  }
  if (ecosystem === "pypi") {
    const data = await fetchJson(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
    return { version: data.info?.version, url: `https://pypi.org/project/${name}/` };
  }
  if (ecosystem === "crates") {
    const data = await fetchJson(`https://crates.io/api/v1/crates/${encodeURIComponent(name)}`);
    return { version: data.crate?.max_stable_version || data.crate?.max_version, url: `https://crates.io/crates/${name}` };
  }
  if (ecosystem === "packagist") {
    const data = await fetchJson(`https://repo.packagist.org/p2/${name}.json`);
    return { version: data.packages?.[name]?.[0]?.version, url: `https://packagist.org/packages/${name}` };
  }
  if (ecosystem === "rubygems") {
    const data = await fetchJson(`https://rubygems.org/api/v1/versions/${encodeURIComponent(name)}/latest.json`);
    return { version: data.version, url: `https://rubygems.org/gems/${name}` };
  }
  if (ecosystem === "go") {
    const data = await fetchJson(`https://proxy.golang.org/${name}/@latest`);
    return { version: data.Version, url: `https://pkg.go.dev/${name}` };
  }
  if (ecosystem === "maven") {
    const [groupId, artifactId] = name.split(":");
    if (!groupId || !artifactId) return null;
    const query = encodeURIComponent(`g:"${groupId}" AND a:"${artifactId}"`);
    const data = await fetchJson(`https://search.maven.org/solrsearch/select?q=${query}&rows=1&wt=json`);
    return { version: data.response?.docs?.[0]?.latestVersion, url: `https://search.maven.org/artifact/${groupId}/${artifactId}` };
  }
  return null;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json, application/vnd.github+json" } });
  if (!response.ok) throw new Error(`Registry returned ${response.status}`);
  return response.json();
}

async function fetchRaw(owner, repo, branch, path) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${encodedPath}`;
  const response = await fetch(url);
  return response.ok ? response.text() : null;
}

function parseDependencyFile(file) {
  const parser = {
    "package.json": parsePackageJson,
    "requirements.txt": parseRequirementsTxt,
    "pyproject.toml": parsePyprojectToml,
    Pipfile: parsePipfile,
    Gemfile: parseGemfile,
    "go.mod": parseGoMod,
    "Cargo.toml": parseCargoToml,
    "composer.json": parseComposerJson,
    "pom.xml": parsePomXml,
    "build.gradle": parseGradle,
    "build.gradle.kts": parseGradle
  }[file.name];
  if (!parser) return [];
  return parser(file).map((dep) => ({ ...dep, file: file.path, ecosystem: file.ecosystem }));
}

function parsePackageJson(file) {
  const json = safeJson(file.text);
  if (!json) return [];
  const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  return sections.flatMap((section) => Object.entries(json[section] || {}).map(([name, version]) => ({ name, version: String(version), section })));
}

function parseRequirementsTxt(file) {
  return file.text.split("\n").flatMap((line) => {
    const cleaned = line.split("#")[0].trim();
    if (!cleaned || cleaned.startsWith("-") || cleaned.includes("://")) return [];
    const match = cleaned.match(/^([A-Za-z0-9_.-]+)(?:\[[^\]]+])?\s*([=<>!~]{1,2})?\s*([^;,\s]+)?/);
    if (!match) return [];
    return [{ name: normalizePythonName(match[1]), version: match[3] || "", section: "requirements.txt" }];
  });
}

function parsePyprojectToml(file) {
  const deps = [];
  const lines = file.text.split("\n");
  let section = "";
  let inProjectDeps = false;
  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    const sectionMatch = line.match(/^\[([^\]]+)]$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      inProjectDeps = false;
      continue;
    }
    if (line.startsWith("dependencies = [")) {
      inProjectDeps = true;
      continue;
    }
    if (inProjectDeps) {
      if (line.startsWith("]")) inProjectDeps = false;
      const dep = parsePythonRequirementString(line.replace(/[",]/g, "").trim());
      if (dep) deps.push({ ...dep, section: "project.dependencies" });
      continue;
    }
    if (["tool.poetry.dependencies", "tool.poetry.group.dev.dependencies", "tool.uv.dependencies"].includes(section)) {
      const match = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
      if (match && match[1].toLowerCase() !== "python") {
        deps.push({ name: normalizePythonName(match[1]), version: cleanVersion(match[2]), section });
      }
    }
  }
  return deps;
}

function parsePipfile(file) {
  const deps = [];
  let section = "";
  for (const rawLine of file.text.split("\n")) {
    const line = rawLine.split("#")[0].trim();
    const sectionMatch = line.match(/^\[(.+)]$/);
    if (sectionMatch) section = sectionMatch[1];
    const depMatch = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (depMatch && ["packages", "dev-packages"].includes(section)) {
      deps.push({ name: normalizePythonName(depMatch[1]), version: cleanVersion(depMatch[2]), section });
    }
  }
  return deps;
}

function parseGemfile(file) {
  return file.text.split("\n").flatMap((line) => {
    const match = line.trim().match(/^gem\s+["']([^"']+)["'](?:\s*,\s*["']([^"']+)["'])?/);
    return match ? [{ name: match[1], version: match[2] || "", section: "Gemfile" }] : [];
  });
}

function parseGoMod(file) {
  const deps = [];
  let inRequire = false;
  for (const rawLine of file.text.split("\n")) {
    const line = rawLine.split("//")[0].trim();
    if (line === "require (") {
      inRequire = true;
      continue;
    }
    if (inRequire && line === ")") {
      inRequire = false;
      continue;
    }
    const match = line.match(/^(?:require\s+)?([^\s]+)\s+(v?[0-9][^\s]*)/);
    if (match && (inRequire || rawLine.trim().startsWith("require"))) {
      deps.push({ name: match[1], version: match[2], section: "require" });
    }
  }
  return deps;
}

function parseCargoToml(file) {
  const deps = [];
  let section = "";
  for (const rawLine of file.text.split("\n")) {
    const line = rawLine.split("#")[0].trim();
    const sectionMatch = line.match(/^\[([^\]]+)]$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }
    if (!["dependencies", "dev-dependencies", "build-dependencies"].includes(section)) continue;
    const match = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (match) deps.push({ name: match[1], version: cleanVersion(match[2]), section });
  }
  return deps;
}

function parseComposerJson(file) {
  const json = safeJson(file.text);
  if (!json) return [];
  return ["require", "require-dev"].flatMap((section) =>
    Object.entries(json[section] || {})
      .filter(([name]) => name !== "php" && name.includes("/"))
      .map(([name, version]) => ({ name, version: String(version), section }))
  );
}

function parsePomXml(file) {
  const deps = [];
  const blocks = file.text.match(/<dependency>[\s\S]*?<\/dependency>/g) || [];
  for (const block of blocks) {
    const groupId = xmlTag(block, "groupId");
    const artifactId = xmlTag(block, "artifactId");
    const version = xmlTag(block, "version");
    if (groupId && artifactId) deps.push({ name: `${groupId}:${artifactId}`, version: version || "", section: "dependency" });
  }
  return deps;
}

function parseGradle(file) {
  return file.text.split("\n").flatMap((line) => {
    const match = line.match(/(?:implementation|api|compileOnly|runtimeOnly|testImplementation)\(?\s*["']([^:"']+):([^:"']+):([^"']+)["']/);
    return match ? [{ name: `${match[1]}:${match[2]}`, version: match[3], section: "gradle" }] : [];
  });
}

function buildFindings(files, deps, lockfiles, searched) {
  const findings = [];
  const ecosystems = new Set(deps.map((dep) => dep.ecosystem));
  const byName = new Map(deps.map((dep) => [`${dep.ecosystem}:${dep.name.toLowerCase()}`, dep]));
  const byFamily = new Set(deps.map((dep) => dep.family).filter(Boolean));
  const majorDeps = deps.filter((dep) => dep.majorGap > 0);
  const unpinned = deps.filter((dep) => !dep.pinned && dep.version).slice(0, 6);

  if (files.length > 1) {
    findings.push({ title: "Multiple dependency surfaces found", text: `Found ${files.length} manifest files. Treat this as a shallow monorepo scan and split upgrades by workspace or service.`, severity: "medium" });
  }
  if (!lockfiles.length && deps.length) {
    findings.push({ title: "No nearby lockfile detected", text: "The browser scan did not find common lockfiles near the scanned manifests. Validate exact resolved versions before upgrading.", severity: "medium" });
  }
  if (majorDeps.length >= 5) {
    findings.push({ title: "Many major-version candidates", text: `${majorDeps.length} dependencies appear to have major-version movement available. Avoid one large upgrade PR.`, severity: "high" });
  }
  if (unpinned.length >= 3) {
    findings.push({ title: "Loose version constraints", text: `Several dependencies use broad constraints, including ${unpinned.map((dep) => dep.name).join(", ")}. Reproducibility should be checked before migration work.`, severity: "medium" });
  }

  if (ecosystems.has("npm")) addJavaScriptFindings(findings, byName, byFamily);
  if (ecosystems.has("pypi")) addPythonFindings(findings, byName, byFamily);
  if (ecosystems.has("rubygems")) addRubyFindings(findings, byName);
  if (ecosystems.has("go")) findings.push({ title: "Go module validation", text: "Use go test ./..., go vet ./..., and go mod tidy as the baseline validation batch.", severity: "low" });
  if (ecosystems.has("crates")) findings.push({ title: "Rust dependency validation", text: "Use cargo test, cargo clippy, and cargo build --release before and after upgrade batches.", severity: "low" });
  if (ecosystems.has("packagist")) findings.push({ title: "Composer dependency validation", text: "Use composer validate plus the project's PHPUnit or framework tests before merging upgrades.", severity: "low" });
  if (ecosystems.has("maven")) findings.push({ title: "JVM dependency validation", text: "Use Maven or Gradle test/verify tasks and keep plugin upgrades separate from framework upgrades.", severity: "low" });

  for (const dep of deps.filter((item) => item.rule && item.majorGap > 0).slice(0, 8)) {
    findings.push({ title: `${dep.name} major candidate`, text: `${dep.version || "unversioned"} -> ${dep.latest}. ${dep.rule.risk}`, severity: dep.majorGap >= 2 ? "high" : "medium" });
  }

  const failedLookups = deps.filter((dep) => dep.lookupAttempted && !dep.latest).length;
  if (failedLookups > 0 && deps.length > 0) {
    findings.push({ title: "Partial registry coverage", text: `${failedLookups} package lookups could not be resolved from the browser. A backend scanner can improve registry coverage and rate-limit handling.`, severity: "low" });
  }

  if (!findings.length && deps.length) {
    findings.push({ title: "Low obvious upgrade risk", text: `Found ${deps.length} dependencies across ${files.length} manifest file(s), but no high-signal rule fired. Validate with the project's normal test/build commands.`, severity: "low" });
  }

  return findings;
}

function addJavaScriptFindings(findings, byName, byFamily) {
  if (byName.has("npm:vite") && byName.has("npm:vitest")) {
    findings.push({ title: "Vite/Vitest tooling batch", text: "Move Vite, Vitest, jsdom, and framework plugins together, then validate tests and builds before runtime upgrades.", severity: "high" });
  }
  if (byName.has("npm:eslint") && (byName.has("npm:typescript") || byFamily.has("ESLint"))) {
    findings.push({ title: "Lint and type noise risk", text: "ESLint, TypeScript, and @typescript-eslint can create noisy failures if bundled with runtime package upgrades.", severity: "medium" });
  }
  if (byName.has("npm:react") && byName.has("npm:react-router-dom")) {
    findings.push({ title: "Separate UI behavior from route behavior", text: "React and React Router major movement should be separate validation surfaces.", severity: "medium" });
  }
  if (byName.has("npm:next")) {
    findings.push({ title: "Framework-coupled Next.js migration", text: "Next.js upgrades should check routing, rendering mode, config, image handling, ESLint config, and React compatibility.", severity: "high" });
  }
}

function addPythonFindings(findings, byName) {
  if (byName.has("pypi:django")) {
    findings.push({ title: "Django framework migration", text: "Move Django through a stable LTS target first, then validate settings, migrations, admin, auth, and static files.", severity: "high" });
  }
  if (byName.has("pypi:fastapi") && byName.has("pypi:pydantic")) {
    findings.push({ title: "FastAPI/Pydantic compatibility", text: "FastAPI and Pydantic upgrades should be planned together because validation semantics can change API behavior.", severity: "high" });
  }
  if (byName.has("pypi:sqlalchemy")) {
    findings.push({ title: "Database layer migration", text: "SQLAlchemy upgrades should be separated from web framework upgrades and validated with integration tests.", severity: "medium" });
  }
}

function addRubyFindings(findings, byName) {
  if (byName.has("rubygems:rails")) {
    findings.push({ title: "Rails framework migration", text: "Rails upgrades should be split by framework defaults, ActiveRecord behavior, assets, jobs, and test environment.", severity: "high" });
  }
}

function calculateReadiness(findings, majorCount, outdatedCount) {
  const high = findings.filter((finding) => finding.severity === "high").length;
  if (high >= 3 || majorCount >= 6 || outdatedCount >= 18) return "red";
  if (high >= 1 || majorCount >= 2 || outdatedCount >= 6 || findings.length >= 4) return "yellow";
  return "green";
}

function buildUnsupportedReport(metadata, searched, lockfiles) {
  const findings = [
    {
      title: "No supported manifest found in shallow scan",
      text: `Searched root and common workspace folders for ${searched.join(", ")}. A backend scanner can support deeper repo traversal and custom paths.`,
      severity: "medium"
    },
    {
      title: "Turn this into demand signal",
      text: "Use the waitlist form to request support for this stack or repo layout.",
      severity: "low"
    }
  ];
  return { metadata, files: [], dependencies: [], notable: [], findings, majorCount: 0, outdatedCount: 0, readiness: "yellow", lockfiles, searched, lookupStats: { attempted: 0, succeeded: 0, failed: 0 }, unsupported: true };
}

function normalizeBackendReport(payload) {
  const scan = payload.scan;
  const metadata = {
    full_name: scan.metadata.fullName,
    html_url: scan.metadata.htmlUrl,
    description: scan.metadata.description,
    stargazers_count: scan.metadata.stars,
    default_branch: scan.metadata.defaultBranch
  };
  const dependencies = (scan.dependencies || []).map((dep) => ({
    name: dep.name,
    ecosystem: dep.ecosystem,
    file: dep.file,
    section: dep.section,
    version: dep.current || "",
    latest: dep.latest || null,
    registryUrl: dep.registryUrl || null,
    family: dep.family,
    majorGap: dep.majorGap || 0,
    outdated: Boolean(dep.outdated),
    pinned: Boolean(dep.pinned),
    rule: dep.risk ? { risk: dep.risk, family: dep.family } : null
  }));
  const files = (scan.evidence.files || []).map((file) => ({
    path: file.path,
    ecosystem: file.ecosystem,
    label: file.label
  }));
  return {
    metadata,
    files,
    dependencies,
    notable: dependencies,
    findings: scan.findings || [],
    majorCount: scan.summary.majorCandidates || 0,
    outdatedCount: scan.summary.outdatedCandidates || 0,
    readiness: scan.readiness,
    lockfiles: scan.evidence.lockfiles || [],
    searched: scan.evidence.searchedManifestNames || Array.from(MANIFEST_NAMES).sort(),
    lookupStats: scan.evidence.registry || { attempted: 0, succeeded: 0, failed: 0 },
    unsupported: Boolean(scan.unsupported),
    backend: true,
    reportId: payload.reportId,
    reportUrl: payload.reportUrl,
    saved: Boolean(payload.saved),
    llm: payload.llm || null,
    backendPrPlan: scan.prPlan || [],
    validationCommands: scan.validationCommands || []
  };
}

function renderUnsupportedReport(message, metadata) {
  const fallbackMetadata = metadata || { full_name: "Unsupported repository", html_url: "", description: message, stargazers_count: 0, default_branch: "unknown" };
  renderReport({ metadata: fallbackMetadata, files: [], dependencies: [], notable: [], findings: [{ title: "Scan unavailable", text: message, severity: "medium" }], majorCount: 0, outdatedCount: 0, readiness: "yellow", lockfiles: [], searched: Array.from(MANIFEST_NAMES).sort(), lookupStats: { attempted: 0, succeeded: 0, failed: 0 }, unsupported: true });
}

function sortNotable(deps) {
  return deps
    .slice()
    .sort((a, b) => Number(Boolean(b.rule)) - Number(Boolean(a.rule)) || b.majorGap - a.majorGap || Number(b.outdated) - Number(a.outdated) || a.name.localeCompare(b.name));
}

function renderReport(report) {
  currentReport = report;
  currentMarkdown = buildMarkdown(report);
  result.hidden = false;
  const status = document.querySelector("#statusBadge");
  status.className = `status ${report.readiness}`;
  status.textContent = report.unsupported ? "Readiness: needs support" : `Readiness: ${report.readiness}`;
  document.querySelector("#reportTitle").textContent = report.unsupported ? `${report.metadata.full_name} scan support report` : `${report.metadata.full_name} upgrade report`;
  const backendNote = report.backend ? ` · report ${report.reportId}` : "";
  document.querySelector("#reportLead").textContent = `${report.metadata.description || "Public GitHub repository"} · ${report.metadata.stargazers_count || 0} stars · default branch ${report.metadata.default_branch || "unknown"}${backendNote}`;
  document.querySelector("#fileCount").textContent = report.files.length;
  document.querySelector("#dependencyCount").textContent = report.dependencies.length;
  document.querySelector("#riskCount").textContent = report.findings.length;
  document.querySelector("#majorCount").textContent = report.majorCount;
  renderFindings(report.findings);
  renderPlan(report);
  renderUpgrades(report.notable);
  renderFilesScanned(report);
  renderRegistryCoverage(report);
  shareUrlInput.value = window.location.href;
  waitlistStatus.textContent = report.unsupported ? "Use this form to request support for this stack or repo layout." : "Opens a prefilled GitHub issue so the request is easy to track.";
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderFindings(findings) {
  const container = document.querySelector("#findings");
  container.innerHTML = findings.length ? "" : "<p>No known high-signal upgrade risks found in this prototype scan.</p>";
  for (const finding of findings) {
    const div = document.createElement("div");
    div.className = "finding";
    div.innerHTML = `<strong>${escapeHtml(finding.title)}</strong><span>${escapeHtml(finding.text)}</span><em class="tag">${escapeHtml(finding.severity)} risk</em>`;
    container.appendChild(div);
  }
}

function renderPlan(report) {
  const plan = document.querySelector("#plan");
  plan.innerHTML = "";
  for (const item of getPlanItems(report)) {
    const li = document.createElement("li");
    li.textContent = item;
    plan.appendChild(li);
  }
}

function getPlanItems(report) {
  if (report.backendPrPlan?.length) return report.backendPrPlan;
  if (report.unsupported) {
    return ["Confirm whether the repo uses a supported dependency manager.", "Request support for this stack or repo layout through the waitlist form.", "For paid scans, allow deeper traversal and custom manifest paths.", "Add source-code and CI inspection in the backend scanner."];
  }
  const ecosystems = new Set(report.dependencies.map((dep) => dep.ecosystem));
  if (ecosystems.has("pypi")) return ["Run baseline tests and framework checks.", "Upgrade framework packages through stable targets first.", "Upgrade deployment and database packages separately.", "Validate lockfiles, CI, and production-like settings.", "Create saved reports and GitHub issues in the premium workflow."];
  if (ecosystems.has("npm")) return ["Run baseline typecheck, lint, tests, and build.", "Upgrade build/test tooling first.", "Handle lint and TypeScript config movement separately.", "Upgrade runtime framework and router packages after tooling is green.", "Create saved reports and GitHub issues in the premium workflow."];
  if (ecosystems.has("rubygems")) return ["Run baseline Bundler and test tasks.", "Upgrade framework gems separately from test and deployment gems.", "Validate database migrations and environment config.", "Split risky majors into reviewable PRs."];
  if (ecosystems.has("go")) return ["Run go test ./... and go vet ./....", "Run go mod tidy in its own PR.", "Upgrade framework/runtime libraries separately.", "Validate integration tests before merging."];
  return ["Run the repository's baseline tests and build.", "Upgrade package-manager/tooling first.", "Separate framework/runtime major upgrades.", "Export this report into an issue and track validation."];
}

function renderUpgrades(notable) {
  const container = document.querySelector("#upgrades");
  container.innerHTML = notable.length ? "" : "<p>No packages matched the scanner's registry or rule catalog. Use the waitlist form if this stack should be supported better.</p>";
  for (const dep of notable.slice(0, 16)) {
    const div = document.createElement("div");
    div.className = "upgrade";
    const latest = dep.latest ? `${dep.version || "unversioned"} -> ${dep.latest}` : `${dep.version || "unversioned"} · latest unavailable`;
    div.innerHTML = `<code>${escapeHtml(dep.name)}</code><span>${escapeHtml(latest)} · ${escapeHtml(dep.ecosystem)}</span>`;
    container.appendChild(div);
  }
}

function renderFilesScanned(report) {
  const container = document.querySelector("#filesScanned");
  container.innerHTML = "";
  if (!report.files.length) {
    container.innerHTML = `<p>Searched for ${escapeHtml(report.searched.join(", "))} in root and common workspace folders.</p>`;
    return;
  }
  for (const file of report.files) {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `<code>${escapeHtml(file.path)}</code><span>${escapeHtml(file.label)}</span>`;
    container.appendChild(div);
  }
}

function renderRegistryCoverage(report) {
  const container = document.querySelector("#registryCoverage");
  const stats = report.lookupStats || { attempted: 0, succeeded: 0, failed: 0 };
  const lockfileText = report.lockfiles?.length ? `${report.lockfiles.length} lockfile(s) found` : "No shallow lockfile found";
  const scanModeText = report.backend ? `hosted backend${report.saved ? " · saved" : " · unsaved"}` : "browser";
  container.innerHTML = "";
  [
    ["Registry lookups", `${stats.succeeded}/${stats.attempted} succeeded`],
    ["Lookup failures", `${stats.failed}`],
    ["Lockfile evidence", lockfileText],
    ["Scanner depth", "root + common workspace folders"],
    ["Report mode", scanModeText]
  ].forEach(([label, value]) => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `<code>${escapeHtml(label)}</code><span>${escapeHtml(value)}</span>`;
    container.appendChild(div);
  });
}

function updateRepoParam(parsed) {
  const url = new URL(window.location.href);
  url.searchParams.set("repo", `${parsed.owner}/${parsed.repo}`);
  window.history.replaceState({}, "", url);
}

function buildMarkdown(report) {
  const lines = [
    `# Upgrade Risk Report: ${report.metadata.full_name}`,
    "",
    report.metadata.html_url ? `Repository: ${report.metadata.html_url}` : "",
    report.reportId ? `Report ID: ${report.reportId}` : "",
    report.backend ? "Scan mode: hosted backend" : "Scan mode: browser",
    `Readiness: ${report.unsupported ? "needs support" : report.readiness}`,
    `Default branch: ${report.metadata.default_branch || "unknown"}`,
    "",
    "## Summary",
    "",
    `- Dependency files found: ${report.files.length}`,
    `- Dependencies scanned: ${report.dependencies.length}`,
    `- Risk signals: ${report.findings.length}`,
    `- Major-version candidates: ${report.majorCount}`,
    `- Registry lookups: ${report.lookupStats.succeeded}/${report.lookupStats.attempted} succeeded`,
    "",
    "## Files Scanned",
    ""
  ].filter(Boolean);
  if (report.files.length) report.files.forEach((file) => lines.push(`- \`${file.path}\` (${file.label})`));
  else lines.push(`- No supported manifest found. Searched for: ${report.searched.join(", ")}`);
  lines.push("", "## Findings", "");
  report.findings.forEach((finding) => lines.push(`- **${finding.title}** (${finding.severity}): ${finding.text}`));
  lines.push("", "## Suggested PR Plan", "");
  getPlanItems(report).forEach((item, index) => lines.push(`${index + 1}. ${item}`));
  lines.push("", "## Notable Packages", "");
  if (report.notable.length) {
    report.notable.slice(0, 16).forEach((dep) => lines.push(`- \`${dep.name}\` (${dep.ecosystem}): ${dep.version || "unversioned"} -> ${dep.latest || "latest unavailable"}`));
  } else {
    lines.push("- No packages matched the scanner's registry or rule catalog.");
  }
  if (report.validationCommands?.length) {
    lines.push("", "## Validation Commands", "");
    report.validationCommands.forEach((command) => lines.push(`- \`${command}\``));
  }
  if (report.llm?.markdown) {
    lines.push("", "## LLM Analysis", "", report.llm.markdown);
  }
  lines.push("", "Generated by Upgrade Copilot risk report prototype.");
  return `${lines.join("\n")}\n`;
}

function getRule(dep) {
  return RULE_PACKS[dep.ecosystem]?.packages?.[dep.name.toLowerCase()] || RULE_PACKS[dep.ecosystem]?.packages?.[dep.name] || null;
}

function ecosystemLabel(ecosystem) {
  return { npm: "JavaScript", pypi: "Python", rubygems: "Ruby", go: "Go", crates: "Rust", packagist: "PHP", maven: "JVM" }[ecosystem] || ecosystem;
}

function calculateMajorGap(current, latest) {
  const currentMajor = parseVersionParts(current)[0];
  const latestMajor = parseVersionParts(latest)[0];
  if (currentMajor == null || latestMajor == null) return 0;
  return Math.max(0, latestMajor - currentMajor);
}

function compareVersions(current, latest) {
  const a = parseVersionParts(current);
  const b = parseVersionParts(latest);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function parseVersionParts(value) {
  if (!value) return [];
  const cleaned = cleanVersion(value).replace(/^v/, "");
  const match = cleaned.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return [];
  return match.slice(1).filter(Boolean).map(Number);
}

function isPinned(version, ecosystem) {
  if (!version) return false;
  const cleaned = cleanVersion(version);
  if (ecosystem === "pypi") return /^(==)?\d+\.\d+/.test(cleaned);
  if (ecosystem === "go") return /^v?\d+\.\d+/.test(cleaned);
  return /^\d+\.\d+/.test(cleaned);
}

function cleanVersion(value) {
  if (!value) return "";
  const objectVersion = String(value).match(/version\s*=\s*["']([^"']+)["']/);
  if (objectVersion) return objectVersion[1];
  return String(value).replace(/[{}"',]/g, "").replace(/^[\^~<>=!\s]+/, "").trim();
}

function parsePythonRequirementString(value) {
  if (!value) return null;
  const match = value.match(/^([A-Za-z0-9_.-]+)(?:\[[^\]]+])?\s*([=<>!~]{1,2})?\s*([^;,\s]+)?/);
  return match ? { name: normalizePythonName(match[1]), version: match[3] || "" } : null;
}

function normalizePythonName(name) {
  return name.toLowerCase().replace(/_/g, "-");
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function xmlTag(block, tag) {
  return block.match(new RegExp(`<${tag}>([^<]+)</${tag}>`))?.[1]?.trim() || "";
}

async function copyText(value) {
  if (!value) return;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through to the textarea copy path for older or restricted browsers.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
