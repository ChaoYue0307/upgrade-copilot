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

const MANIFEST_NAMES = new Set(Object.keys(MANIFESTS));
const COMMON_WORKSPACE_DIRS = new Set(["apps", "packages", "services", "frontend", "backend", "examples", "example", "demo", "api", "web", "client", "server"]);
const COMMON_SOURCE_DIRS = new Set(["src", "app", "pages", "components", "lib", "utils", "tests", "test", "spec", "config", "settings"]);
const MAX_MANIFESTS = 50;
const MAX_REGISTRY_LOOKUPS = 140;
const MAX_CI_FILES = 12;
const MAX_SOURCE_FILES = 40;
const MAX_SOURCE_FILE_BYTES = 180_000;
const MAX_AFFECTED_FILES = 30;

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

const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".php",
  ".java",
  ".kt",
  ".kts",
  ".scala",
  ".vue",
  ".svelte"
]);

const RULE_PACKS = {
  npm: {
    validation: ["npm run build", "npm test", "npm run lint", "npm run typecheck"],
    packages: {
      react: { family: "React", risk: "React major upgrades should be separated from routing, rendering, and test-library changes." },
      "react-dom": { family: "React", risk: "React DOM should move with React and UI rendering validation." },
      "react-router-dom": { family: "React Router", risk: "Router major upgrades can change navigation and data-loading behavior." },
      next: { family: "Next.js", risk: "Next.js upgrades often touch routing, server rendering, config, images, and React compatibility." },
      vite: { family: "Vite", risk: "Vite major upgrades should be validated with build, dev server, and preview smoke checks." },
      vitest: { family: "Vitest", risk: "Vitest major upgrades can affect jsdom, globals, snapshots, and setup files." },
      eslint: { family: "ESLint", risk: "ESLint major upgrades should be isolated from runtime package changes." },
      typescript: { family: "TypeScript", risk: "TypeScript upgrades can expose latent type errors and build-tool config issues." },
      tailwindcss: { family: "Tailwind", risk: "Tailwind major upgrades can change config shape, content scanning, and generated CSS." },
      webpack: { family: "Build tooling", risk: "Webpack major upgrades can affect loaders, plugins, and asset output." },
      jest: { family: "Testing", risk: "Jest major upgrades can affect transforms, environments, fake timers, and snapshots." },
      jsdom: { family: "Testing", risk: "jsdom changes can break browser-like test assumptions." }
    }
  },
  pypi: {
    validation: ["python -m pytest", "python manage.py test", "python manage.py check", "python manage.py collectstatic --noinput"],
    packages: {
      django: { family: "Django", risk: "Django major jumps should usually move through the current LTS target first." },
      djangorestframework: { family: "Django REST Framework", risk: "DRF upgrades can change serializer, router, and authentication behavior." },
      flask: { family: "Flask", risk: "Flask major upgrades can affect app factories, config, routing, and extensions." },
      fastapi: { family: "FastAPI", risk: "FastAPI upgrades should be validated with Pydantic and OpenAPI behavior." },
      pydantic: { family: "Pydantic", risk: "Pydantic major upgrades can change validation semantics and model APIs." },
      sqlalchemy: { family: "SQLAlchemy", risk: "SQLAlchemy upgrades can affect sessions, query APIs, and migrations." },
      gunicorn: { family: "Deployment", risk: "Gunicorn upgrades should be tested separately from framework semantics." },
      whitenoise: { family: "Static files", risk: "WhiteNoise upgrades should be validated with collectstatic and production settings." },
      pytest: { family: "Testing", risk: "pytest upgrades can affect plugin compatibility and fixtures." }
    }
  },
  rubygems: {
    validation: ["bundle exec rails test", "bundle exec rspec", "bundle exec rake"],
    packages: {
      rails: { family: "Rails", risk: "Rails upgrades affect framework defaults, autoloading, ActiveRecord, assets, and tests." },
      rspec: { family: "Testing", risk: "RSpec upgrades can affect matchers, mocks, and spec helper setup." },
      puma: { family: "Deployment", risk: "Puma upgrades should be validated with production server config." }
    }
  },
  go: {
    validation: ["go test ./...", "go vet ./...", "go mod tidy"],
    packages: {
      "github.com/gin-gonic/gin": { family: "Go web", risk: "Gin upgrades can affect middleware, binding, and routing behavior." },
      "github.com/gorilla/mux": { family: "Go routing", risk: "Router upgrades should be validated with HTTP integration tests." },
      "gorm.io/gorm": { family: "Go ORM", risk: "GORM upgrades can affect query behavior and migrations." }
    }
  },
  crates: {
    validation: ["cargo test", "cargo clippy", "cargo build --release"],
    packages: {
      tokio: { family: "Rust async", risk: "Tokio upgrades should be validated with async runtime and integration tests." },
      axum: { family: "Rust web", risk: "Axum upgrades can affect handlers, routing, extractors, and tower compatibility." },
      serde: { family: "Serialization", risk: "Serde upgrades should be validated where wire formats are stable interfaces." }
    }
  },
  packagist: {
    validation: ["composer test", "phpunit", "composer validate"],
    packages: {
      "laravel/framework": { family: "Laravel", risk: "Laravel upgrades affect framework defaults, service providers, queues, config, and tests." },
      "symfony/symfony": { family: "Symfony", risk: "Symfony upgrades can affect components, config, routing, and service wiring." },
      phpunit: { family: "Testing", risk: "PHPUnit major upgrades can require assertion and test bootstrap changes." }
    }
  },
  maven: {
    validation: ["mvn test", "mvn verify", "./gradlew test"],
    packages: {
      "org.springframework.boot:spring-boot-starter-web": { family: "Spring Boot", risk: "Spring Boot upgrades can affect framework defaults, dependency management, config, and tests." },
      "org.junit.jupiter:junit-jupiter": { family: "Testing", risk: "JUnit upgrades should be validated with test runtime and build plugin config." }
    }
  }
};

const registryCache = new Map();

export async function scanRepository({ repoUrl, githubToken = process.env.GITHUB_TOKEN } = {}) {
  const parsed = parseRepo(repoUrl);
  if (!parsed) {
    throw new Error("Expected a GitHub repository URL such as https://github.com/owner/repo or owner/repo.");
  }

  const metadata = await fetchGitHubJson(`/repos/${parsed.owner}/${parsed.repo}`, githubToken);
  const tree = await fetchGitHubJson(`/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(metadata.default_branch)}?recursive=1`, githubToken);
  const paths = new Set((tree.tree || []).filter((item) => item.type === "blob").map((item) => item.path));
  const manifestPaths = findManifestPaths(paths);
  const lockfiles = findLockfiles(paths);
  const ciFiles = findCiFiles(paths);

  if (!manifestPaths.length) {
    return buildUnsupportedReport(metadata, lockfiles, ciFiles);
  }

  const files = [];
  for (const path of manifestPaths.slice(0, MAX_MANIFESTS)) {
    const text = await fetchGitHubFile(parsed.owner, parsed.repo, metadata.default_branch, path, githubToken);
    if (text) {
      files.push({ path, name: basename(path), text, ...MANIFESTS[basename(path)] });
    }
  }

  const dependencies = files.flatMap(parseDependencyFile).filter((dep) => dep.name);
  const enriched = await enrichDependencies(dependencies);
  const sourceImpact = await mapSourceImpact({
    owner: parsed.owner,
    repo: parsed.repo,
    branch: metadata.default_branch,
    paths,
    dependencies: enriched,
    githubToken
  });
  const findings = buildFindings(files, enriched, lockfiles, ciFiles);
  const majorCount = enriched.filter((dep) => dep.majorGap > 0).length;
  const outdatedCount = enriched.filter((dep) => dep.outdated).length;
  const readiness = calculateReadiness(findings, majorCount, outdatedCount);
  const lookupStats = {
    attempted: enriched.filter((dep) => dep.lookupAttempted).length,
    succeeded: enriched.filter((dep) => dep.latest).length,
    failed: enriched.filter((dep) => dep.lookupAttempted && !dep.latest).length
  };

  return {
    metadata: normalizeMetadata(metadata),
    readiness,
    summary: {
      manifests: files.length,
      dependencies: dependencies.length,
      findings: findings.length,
      majorCandidates: majorCount,
      outdatedCandidates: outdatedCount,
      affectedFiles: sourceImpact.affectedFiles.length
    },
    evidence: {
      files: files.map(({ path, ecosystem, label }) => ({ path, ecosystem, label })),
      lockfiles,
      ciFiles,
      registry: lookupStats,
      scannerDepth: "root + shallow common workspace folders",
      sourceFilesScanned: sourceImpact.scannedFiles
    },
    dependencies: sortNotable(enriched).slice(0, 40).map(publicDependency),
    affectedFiles: sourceImpact.affectedFiles,
    findings,
    prPlan: getPlanItems({ files, dependencies: enriched, unsupported: false }),
    validationCommands: validationCommandsFor(enriched),
    unsupported: false
  };
}

function parseRepo(value = "") {
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

async function fetchGitHubJson(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: githubHeaders(token)
  });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${path}`);
  }
  return response.json();
}

async function fetchGitHubFile(owner, repo, branch, path, token) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`, {
    headers: { ...githubHeaders(token), Accept: "application/vnd.github.raw" }
  });
  if (!response.ok) return null;
  return response.text();
}

function githubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "upgrade-copilot-backend",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
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

function findCiFiles(paths) {
  return Array.from(paths)
    .filter((path) => path.startsWith(".github/workflows/") || [".circleci/config.yml", "Jenkinsfile", ".gitlab-ci.yml", "azure-pipelines.yml"].includes(path))
    .sort()
    .slice(0, MAX_CI_FILES);
}

function findSourcePaths(paths) {
  return Array.from(paths)
    .filter((path) => hasSourceExtension(path) && isSourceCandidate(path))
    .sort((a, b) => scoreSourcePath(a) - scoreSourcePath(b) || a.localeCompare(b))
    .slice(0, MAX_SOURCE_FILES);
}

function isShallowCandidate(path) {
  const parts = path.split("/");
  if (parts.length === 1) return true;
  if (parts.length <= 3 && COMMON_WORKSPACE_DIRS.has(parts[0])) return true;
  return false;
}

function isSourceCandidate(path) {
  const parts = path.split("/");
  if (parts.some((part) => ["node_modules", "vendor", "dist", "build", "coverage", ".git", ".next", "target"].includes(part))) return false;
  if (parts.length <= 2) return true;
  if (parts.length <= 5 && (COMMON_SOURCE_DIRS.has(parts[0]) || COMMON_WORKSPACE_DIRS.has(parts[0]))) return true;
  return false;
}

function hasSourceExtension(path) {
  return SOURCE_EXTENSIONS.has(extension(path));
}

function extension(path) {
  const file = basename(path).toLowerCase();
  const dot = file.lastIndexOf(".");
  return dot >= 0 ? file.slice(dot) : "";
}

function scoreSourcePath(path) {
  const parts = path.split("/");
  if (COMMON_SOURCE_DIRS.has(parts[0])) return 0;
  if (COMMON_WORKSPACE_DIRS.has(parts[0])) return 1;
  return parts.length;
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
  return ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"].flatMap((section) =>
    Object.entries(json[section] || {}).map(([name, version]) => ({ name, version: String(version), section }))
  );
}

function parseRequirementsTxt(file) {
  return file.text.split("\n").flatMap((line) => {
    const cleaned = line.split("#")[0].trim();
    if (!cleaned || cleaned.startsWith("-") || cleaned.includes("://")) return [];
    const match = cleaned.match(/^([A-Za-z0-9_.-]+)(?:\[[^\]]+])?\s*([=<>!~]{1,2})?\s*([^;,\s]+)?/);
    return match ? [{ name: normalizePythonName(match[1]), version: match[3] || "", section: "requirements.txt" }] : [];
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

  await Promise.all(unique.slice(0, MAX_REGISTRY_LOOKUPS).map(async (dep) => {
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
  if (!registryCache.has(key)) {
    registryCache.set(key, lookupLatestUncached(ecosystem, name).catch(() => null));
  }
  return registryCache.get(key);
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
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Registry returned ${response.status}`);
  return response.json();
}

function buildFindings(files, deps, lockfiles, ciFiles) {
  const findings = [];
  const ecosystems = new Set(deps.map((dep) => dep.ecosystem));
  const byName = new Map(deps.map((dep) => [`${dep.ecosystem}:${dep.name.toLowerCase()}`, dep]));
  const byFamily = new Set(deps.map((dep) => dep.family).filter(Boolean));
  const majorDeps = deps.filter((dep) => dep.majorGap > 0);
  const unpinned = deps.filter((dep) => !dep.pinned && dep.version).slice(0, 6);

  if (files.length > 1) {
    findings.push({ title: "Multiple dependency surfaces found", text: `Found ${files.length} manifest files. Split upgrades by workspace or service.`, severity: "medium" });
  }
  if (!lockfiles.length && deps.length) {
    findings.push({ title: "No nearby lockfile detected", text: "No common lockfile was found near scanned manifests. Validate exact resolved versions before upgrading.", severity: "medium" });
  }
  if (!ciFiles.length) {
    findings.push({ title: "No CI workflow detected", text: "No common CI config was detected. Add or confirm validation before risky upgrades.", severity: "medium" });
  }
  if (majorDeps.length >= 5) {
    findings.push({ title: "Many major-version candidates", text: `${majorDeps.length} dependencies appear to have major-version movement available. Avoid one large upgrade PR.`, severity: "high" });
  }
  if (unpinned.length >= 3) {
    findings.push({ title: "Loose version constraints", text: `Several dependencies use broad constraints, including ${unpinned.map((dep) => dep.name).join(", ")}. Reproducibility should be checked before migration work.`, severity: "medium" });
  }

  if (ecosystems.has("npm")) addJavaScriptFindings(findings, byName, byFamily);
  if (ecosystems.has("pypi")) addPythonFindings(findings, byName);
  if (ecosystems.has("rubygems") && byName.has("rubygems:rails")) {
    findings.push({ title: "Rails framework migration", text: "Rails upgrades should be split by defaults, ActiveRecord behavior, assets, jobs, and test environment.", severity: "high" });
  }

  for (const dep of deps.filter((item) => item.rule && item.majorGap > 0).slice(0, 10)) {
    findings.push({ title: `${dep.name} major candidate`, text: `${dep.version || "unversioned"} -> ${dep.latest}. ${dep.rule.risk}`, severity: dep.majorGap >= 2 ? "high" : "medium" });
  }

  const failedLookups = deps.filter((dep) => dep.lookupAttempted && !dep.latest).length;
  if (failedLookups > 0 && deps.length > 0) {
    findings.push({ title: "Partial registry coverage", text: `${failedLookups} package lookups could not be resolved. Check private packages, renamed packages, or registry availability.`, severity: "low" });
  }

  if (!findings.length && deps.length) {
    findings.push({ title: "Low obvious upgrade risk", text: `Found ${deps.length} dependencies, but no high-signal rule fired. Validate with the project's normal test/build commands.`, severity: "low" });
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

function getPlanItems(report) {
  if (report.unsupported) {
    return ["Confirm whether the repo uses a supported dependency manager.", "Request support for this stack or repo layout.", "For paid scans, allow deeper traversal and custom manifest paths.", "Add source-code and CI inspection in the backend scanner."];
  }
  const ecosystems = new Set(report.dependencies.map((dep) => dep.ecosystem));
  if (ecosystems.has("pypi")) return ["Run baseline tests and framework checks.", "Upgrade framework packages through stable targets first.", "Upgrade deployment and database packages separately.", "Validate lockfiles, CI, and production-like settings.", "Create saved reports and GitHub issues in the premium workflow."];
  if (ecosystems.has("npm")) return ["Run baseline typecheck, lint, tests, and build.", "Upgrade build/test tooling first.", "Handle lint and TypeScript config movement separately.", "Upgrade runtime framework and router packages after tooling is green.", "Create saved reports and GitHub issues in the premium workflow."];
  if (ecosystems.has("rubygems")) return ["Run baseline Bundler and test tasks.", "Upgrade framework gems separately from test and deployment gems.", "Validate database migrations and environment config.", "Split risky majors into reviewable PRs."];
  if (ecosystems.has("go")) return ["Run go test ./... and go vet ./....", "Run go mod tidy in its own PR.", "Upgrade framework/runtime libraries separately.", "Validate integration tests before merging."];
  return ["Run the repository's baseline tests and build.", "Upgrade package-manager/tooling first.", "Separate framework/runtime major upgrades.", "Export this report into an issue and track validation."];
}

function validationCommandsFor(deps) {
  const ecosystems = new Set(deps.map((dep) => dep.ecosystem));
  return Array.from(ecosystems).flatMap((ecosystem) => RULE_PACKS[ecosystem]?.validation || []).slice(0, 10);
}

async function mapSourceImpact({ owner, repo, branch, paths, dependencies, githubToken }) {
  const sourcePaths = findSourcePaths(paths);
  const matchers = buildImpactMatchers(dependencies);
  if (!sourcePaths.length || !matchers.length) {
    return { scannedFiles: sourcePaths.length, affectedFiles: [] };
  }

  const affected = (await Promise.all(sourcePaths.map(async (path) => {
    const text = await fetchGitHubFile(owner, repo, branch, path, githubToken);
    if (!text || text.length > MAX_SOURCE_FILE_BYTES) return null;
    const matches = matchers.filter((matcher) => matcher.regex.test(text));
    if (!matches.length) return null;
    return {
      path,
      packages: unique(matches.map((match) => match.packageName)).slice(0, 8),
      ecosystems: unique(matches.map((match) => match.ecosystem)),
      reasons: unique(matches.map((match) => match.reason)).slice(0, 3),
      score: matches.reduce((total, match) => total + match.weight, 0)
    };
  }))).filter(Boolean);

  return {
    scannedFiles: sourcePaths.length,
    affectedFiles: affected
      .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
      .slice(0, MAX_AFFECTED_FILES)
      .map(({ score, ...file }) => file)
  };
}

function buildImpactMatchers(dependencies) {
  return sortNotable(dependencies)
    .filter((dep) => dep.rule || dep.majorGap > 0 || dep.outdated)
    .slice(0, 35)
    .flatMap((dep) => dependencyMatchers(dep));
}

function dependencyMatchers(dep) {
  const names = impactNames(dep);
  const weight = (dep.rule ? 4 : 0) + Math.min(dep.majorGap || 0, 3) + (dep.outdated ? 1 : 0);
  return names.map((name) => ({
    packageName: dep.name,
    ecosystem: dep.ecosystem,
    reason: dep.rule?.family || ecosystemLabel(dep.ecosystem),
    weight: Math.max(weight, 1),
    regex: impactRegex(dep.ecosystem, name)
  }));
}

function impactNames(dep) {
  const name = dep.name;
  if (dep.ecosystem === "pypi") {
    const aliases = {
      django: ["django"],
      djangorestframework: ["rest_framework"],
      "python-dotenv": ["dotenv"],
      "pillow": ["PIL"],
      "beautifulsoup4": ["bs4"],
      "pyyaml": ["yaml"],
      "psycopg2-binary": ["psycopg2"]
    };
    return aliases[name] || [name.replace(/-/g, "_")];
  }
  if (dep.ecosystem === "maven" && name.includes(":")) {
    const [group, artifact] = name.split(":");
    return [group, artifact].filter(Boolean);
  }
  return [name];
}

function impactRegex(ecosystem, name) {
  const escaped = escapeRegExp(name);
  if (ecosystem === "npm") {
    return new RegExp(`(?:from\\s+['"]${escaped}(?:/[^'"]*)?['"]|require\\(\\s*['"]${escaped}(?:/[^'"]*)?['"]\\s*\\)|import\\(\\s*['"]${escaped}(?:/[^'"]*)?['"]\\s*\\))`, "i");
  }
  if (ecosystem === "pypi") {
    return new RegExp(`(?:^|\\n)\\s*(?:from\\s+${escaped}(?:\\.|\\s+import)|import\\s+${escaped}(?:\\s|\\.|,|$))`, "i");
  }
  if (ecosystem === "rubygems") {
    return new RegExp(`(?:require\\s+['"]${escaped}['"]|gem\\s+['"]${escaped}['"])`, "i");
  }
  if (ecosystem === "go") {
    return new RegExp(`['"]${escaped}(?:/[^'"]*)?['"]`, "i");
  }
  if (ecosystem === "crates") {
    return new RegExp(`(?:use\\s+${escaped.replace(/-/g, "_")}::|extern\\s+crate\\s+${escaped.replace(/-/g, "_")})`, "i");
  }
  if (ecosystem === "packagist") {
    return new RegExp(`(?:${escaped}|${escapeRegExp(name.split("/").pop() || name)})`, "i");
  }
  if (ecosystem === "maven") {
    return new RegExp(`(?:import\\s+${escaped.replace(/\\\./g, "\\.")}|${escaped})`, "i");
  }
  return new RegExp(escaped, "i");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildUnsupportedReport(metadata, lockfiles, ciFiles) {
  return {
    metadata: normalizeMetadata(metadata),
    readiness: "yellow",
    summary: { manifests: 0, dependencies: 0, findings: 2, majorCandidates: 0, outdatedCandidates: 0, affectedFiles: 0 },
    evidence: {
      files: [],
      lockfiles,
      ciFiles,
      registry: { attempted: 0, succeeded: 0, failed: 0 },
      scannerDepth: "root + shallow common workspace folders",
      sourceFilesScanned: 0,
      searchedManifestNames: Array.from(MANIFEST_NAMES).sort()
    },
    dependencies: [],
    affectedFiles: [],
    findings: [
      { title: "No supported manifest found", text: "No supported dependency manifest was found in root or shallow workspace folders.", severity: "medium" },
      { title: "Backend opportunity", text: "A paid scanner can add custom paths, full repo traversal, and source-code inspection for this repo.", severity: "low" }
    ],
    prPlan: getPlanItems({ dependencies: [], unsupported: true }),
    validationCommands: [],
    unsupported: true
  };
}

function calculateReadiness(findings, majorCount, outdatedCount) {
  const high = findings.filter((finding) => finding.severity === "high").length;
  if (high >= 3 || majorCount >= 6 || outdatedCount >= 18) return "red";
  if (high >= 1 || majorCount >= 2 || outdatedCount >= 6 || findings.length >= 4) return "yellow";
  return "green";
}

function sortNotable(deps) {
  return deps
    .slice()
    .sort((a, b) => Number(Boolean(b.rule)) - Number(Boolean(a.rule)) || b.majorGap - a.majorGap || Number(b.outdated) - Number(a.outdated) || a.name.localeCompare(b.name));
}

function publicDependency(dep) {
  return {
    name: dep.name,
    ecosystem: dep.ecosystem,
    file: dep.file,
    section: dep.section,
    current: dep.version || null,
    latest: dep.latest || null,
    registryUrl: dep.registryUrl || null,
    family: dep.family,
    majorGap: dep.majorGap,
    outdated: dep.outdated,
    pinned: dep.pinned,
    risk: dep.rule?.risk || null
  };
}

function normalizeMetadata(metadata) {
  return {
    fullName: metadata.full_name,
    htmlUrl: metadata.html_url,
    description: metadata.description,
    stars: metadata.stargazers_count,
    defaultBranch: metadata.default_branch,
    private: metadata.private,
    archived: metadata.archived,
    pushedAt: metadata.pushed_at
  };
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
