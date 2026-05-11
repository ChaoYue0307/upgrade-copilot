# Upgrade Copilot Backend Prototype

This is the first backend version of Upgrade Copilot's paid scan engine. It is intentionally separate from the static GitHub Pages prototype.

## What It Does

- Accepts a GitHub repository URL through `POST /api/scan`.
- Fetches repository metadata and tree data server-side.
- Scans root plus shallow workspace folders for dependency manifests.
- Detects lockfiles and common CI config.
- Looks up latest package versions from public registries.
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

## Deploy On Render

This repo includes a root-level `render.yaml` and a backend `Dockerfile`.

1. Create a new Render Blueprint from the GitHub repo.
2. Set `GITHUB_TOKEN` for higher GitHub API limits and private repo access when authorized.
3. Set `OPENAI_API_KEY` if you want `includeLlm: true` to produce premium Markdown analysis.
4. Keep `ALLOWED_ORIGIN` pointed at the GitHub Pages origin or your custom frontend domain.
5. After deployment, copy the backend URL into `docs/assets/config.js`:

```js
window.UPGRADE_COPILOT_CONFIG = {
  backendApiUrl: "https://upgrade-copilot-backend.onrender.com",
  enableLlm: false
};
```

You can also test a backend without editing the file by opening:

```text
https://chaoyue0307.github.io/upgrade-copilot/risk-report.html?backend=https://your-backend.example.com
```

## Environment Variables

- `GITHUB_TOKEN`: optional, improves rate limits and can scan private repos the token can access.
- `OPENAI_API_KEY`: optional, enables LLM report generation.
- `OPENAI_MODEL`: optional, defaults to `gpt-4.1-mini`.
- `PORT`: optional, defaults to `8787`.
- `ALLOWED_ORIGIN`: optional CORS origin, defaults to `*`.

## Current Limits

- Does not clone repos or run tests yet.
- Does not read full source code deeply yet.
- Does not create GitHub issues or PRs yet.
- Private repo support depends on a valid `GITHUB_TOKEN`.
- LLM analysis is optional and only runs when requested.

## Next Backend Milestones

1. Persist saved scan reports.
2. Add GitHub OAuth/App installation.
3. Add source-code search for affected files.
4. Fetch release notes and migration docs.
5. Create GitHub issues from the PR plan.
6. Add Stripe checkout and account limits.
