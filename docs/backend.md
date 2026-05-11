# Backend Prototype

Upgrade Copilot now includes a first backend scan API under [`backend/`](https://github.com/ChaoYue0307/upgrade-copilot/tree/main/backend).

The static risk report page remains the public lead magnet. The backend prototype is a local-first path toward a paid product:

- server-side GitHub repo scans
- better rate limits with `GITHUB_TOKEN`
- private repo support when authorized
- lockfile and CI evidence
- optional LLM-generated premium analysis
- saved reports and future GitHub issue/PR automation

## API Shape

```http
POST /api/scan
Content-Type: application/json

{
  "repoUrl": "CodingGarden/react-ts-starter",
  "includeLlm": false,
  "save": true
}
```

When `save` is true, the backend persists the report under `backend/data/reports/`:

```json
{
  "ok": true,
  "reportId": "ucr_...",
  "reportUrl": null,
  "saved": true,
  "savedAt": "2026-05-11T..."
}
```

Saved report endpoints:

```http
GET /api/reports
GET /api/reports/ucr_your_report_id
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

## Local Frontend Integration

After starting the backend, update [`docs/assets/config.js`](https://github.com/ChaoYue0307/upgrade-copilot/blob/main/docs/assets/config.js):

```js
window.UPGRADE_COPILOT_CONFIG = {
  backendApiUrl: "http://127.0.0.1:8787",
  enableLlm: false,
  saveBackendReports: true,
  backendTimeoutMs: 7000
};
```

For temporary testing, pass the local backend URL in the page URL:

```text
http://127.0.0.1:8768/risk-report.html?backend=http://127.0.0.1:8787
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
