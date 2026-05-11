# Deploy The Backend On Render

Upgrade Copilot includes a deployable backend scan API. The static site can keep running in browser mode, or it can call the hosted backend for server-side scans and optional LLM analysis.

[Deploy to Render](https://render.com/deploy?repo=https://github.com/ChaoYue0307/upgrade-copilot)

## What Render Uses

- [`render.yaml`](https://github.com/ChaoYue0307/upgrade-copilot/blob/main/render.yaml) defines the web service.
- [`backend/Dockerfile`](https://github.com/ChaoYue0307/upgrade-copilot/blob/main/backend/Dockerfile) builds the Node API.
- `/health` is the health check endpoint.
- `/api/scan` is the scan endpoint.

## Required Setup

1. Open the deploy link above while signed in to Render.
2. Connect the GitHub repo if Render asks for access.
3. Create the Blueprint.
4. Set `GITHUB_TOKEN` to a GitHub token with repo read access.
5. Optionally set `OPENAI_API_KEY` to enable premium LLM analysis.
6. Keep `ALLOWED_ORIGIN` as `https://chaoyue0307.github.io` unless the frontend moves to another domain.

## Connect The Frontend

After Render creates the service, copy the backend URL and update [`docs/assets/config.js`](https://github.com/ChaoYue0307/upgrade-copilot/blob/main/docs/assets/config.js):

```js
window.UPGRADE_COPILOT_CONFIG = {
  backendApiUrl: "https://upgrade-copilot-backend.onrender.com",
  enableLlm: false,
  backendTimeoutMs: 7000
};
```

Commit and push that change. GitHub Pages will redeploy the static site.

For temporary testing without changing the file, open:

```text
https://chaoyue0307.github.io/upgrade-copilot/risk-report.html?backend=https://upgrade-copilot-backend.onrender.com
```

To force browser-only mode and clear a saved test backend URL, open:

```text
https://chaoyue0307.github.io/upgrade-copilot/risk-report.html?backend=browser
```

## Verify

```bash
curl https://upgrade-copilot-backend.onrender.com/health
curl -X POST https://upgrade-copilot-backend.onrender.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"repoUrl":"CodingGarden/react-ts-starter","includeLlm":false}'
```

The live risk report page should show `Scan mode: hosted backend`. If the backend is unavailable, the page falls back to browser mode after the configured timeout.
