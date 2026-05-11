# Upgrade Copilot Backend Prototype

This is the first backend version of Upgrade Copilot's paid scan engine. It is intentionally separate from the static GitHub Pages prototype.

## What It Does

- Accepts a GitHub repository URL through `POST /api/scan`.
- Fetches repository metadata and tree data server-side.
- Scans root plus shallow workspace folders for dependency manifests.
- Detects lockfiles and common CI config.
- Looks up latest package versions from public registries.
- Maps risky dependencies to likely affected source files.
- Produces deterministic findings, a PR plan, and validation commands.
- Optionally calls OpenAI to generate a premium Markdown analysis.

## Supported Manifests

- `package.json`
- `requirements.txt`
- `pyproject.toml`
- `Pipfile`
- `Gemfile`
- `go.mod`
- `Cargo.toml`
- `composer.json`
- `pom.xml`
- `build.gradle`
- `build.gradle.kts`

## Local Setup

```bash
cd backend
cp .env.example .env
npm run check
npm run smoke
npm start
```

Then call:

```bash
curl -X POST http://127.0.0.1:8787/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"repoUrl":"CodingGarden/react-ts-starter","includeLlm":false}'
```

To enable LLM analysis, set `OPENAI_API_KEY` and pass:

```json
{
  "repoUrl": "CodingGarden/react-ts-starter",
  "includeLlm": true
}
```

## Saved Reports

The backend can save scan results locally under `backend/data/reports/`. This directory is ignored by git.

Save a report while scanning:

```bash
curl -X POST http://127.0.0.1:8787/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"repoUrl":"CodingGarden/react-ts-starter","includeLlm":false,"save":true}'
```

Load or list saved reports:

```bash
curl http://127.0.0.1:8787/api/reports
curl http://127.0.0.1:8787/api/reports/ucr_your_report_id
```

To connect the static page to a local backend, update `docs/assets/config.js` or use `?backend=http://127.0.0.1:8787`:

```js
window.UPGRADE_COPILOT_CONFIG = {
  backendApiUrl: "http://127.0.0.1:8787",
  enableLlm: false,
  saveBackendReports: true,
  backendTimeoutMs: 15000
};
```

## Environment Variables

- `GITHUB_TOKEN`: optional, improves rate limits and can scan private repos the token can access.
- `OPENAI_API_KEY`: optional, enables LLM report generation.
- `OPENAI_MODEL`: optional, defaults to `gpt-4.1-mini`.
- `PORT`: optional, defaults to `8787`.
- `ALLOWED_ORIGIN`: optional CORS origin, defaults to `*`.
- `UPGRADE_COPILOT_DATA_DIR`: optional report storage directory, defaults to `backend/data`.

## Source Impact Mapping

The backend scans a capped set of shallow source files and looks for import/use patterns for notable dependencies. Results are returned as `affectedFiles`:

```json
{
  "affectedFiles": [
    {
      "path": "src/App.tsx",
      "packages": ["react", "react-router-dom"],
      "ecosystems": ["npm"],
      "reasons": ["React", "React Router"]
    }
  ]
}
```

This is a review map, not a full static analysis graph.

## Current Limits

- Does not clone repos or run tests yet.
- Source impact mapping is shallow and import-pattern based.
- Does not create GitHub issues or PRs yet.
- Private repo support depends on a valid `GITHUB_TOKEN`.
- LLM analysis is optional and only runs when requested.

## Next Backend Milestones

1. Fetch release notes and migration docs.
2. Create GitHub issues from the PR plan.
3. Add GitHub OAuth/App installation.
4. Add Stripe checkout and account limits.
