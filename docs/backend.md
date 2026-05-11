# Backend Prototype

Upgrade Copilot now includes a first backend scan API under [`backend/`](../backend/).

The static risk report page remains the public lead magnet. The backend prototype is the path toward a paid product:

- server-side GitHub repo scans
- better rate limits with `GITHUB_TOKEN`
- private repo support when authorized
- lockfile and CI evidence
- optional LLM-generated premium analysis
- future saved reports and GitHub issue/PR automation

## API Shape

```http
POST /api/scan
Content-Type: application/json

{
  "repoUrl": "CodingGarden/react-ts-starter",
  "includeLlm": false
}
```

The response contains deterministic scanner output and, when requested/configured, an `llm` report:

```json
{
  "ok": true,
  "scan": {
    "metadata": {},
    "readiness": "red",
    "summary": {},
    "evidence": {},
    "dependencies": [],
    "findings": [],
    "prPlan": [],
    "validationCommands": []
  },
  "llm": {
    "enabled": false,
    "markdown": null
  }
}
```

## Local Run

```bash
cd backend
cp .env.example .env
npm run check
npm run smoke
npm start
```

## Why This Matters Commercially

The browser scanner proves interest. The backend is where paid value can be added:

- private repo access
- source-code analysis
- release-note analysis
- saved reports
- team dashboards
- automated GitHub issues and PRs
- account limits and billing
