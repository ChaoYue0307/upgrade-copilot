# Upgrade Copilot

Upgrade Copilot is a Codex plugin that helps developers upgrade dependencies, frameworks, runtimes, SDKs, and CI without turning the work into one giant risky PR.

It is designed for the moments developers already feel pain:

- Which dependencies can I safely upgrade this week?
- What breaking changes actually affect this repo?
- Why did CI start failing after an upgrade?
- How do I split this migration into reviewable PRs?
- What upgrade backlog should this team fund next?

![Upgrade Copilot plugin page](docs/assets/plugin-page.png)

## Install In Codex

Open Codex Plugins, choose **Add marketplace**, and enter:

```text
Source: ChaoYue0307/upgrade-copilot
Git ref: main
Sparse paths:
```

Leave `Sparse paths` empty. After the marketplace loads, open **Upgrade Copilot** and choose **Add to Codex**.

This is a public custom marketplace source. It is not an official OpenAI marketplace listing.

## Try It

```text
Use Upgrade Copilot to find the safest dependency upgrades in this repo.
Use Upgrade Copilot to map breaking changes for upgrading Next.js.
Use Upgrade Copilot to diagnose why CI started failing after this dependency update.
Use Upgrade Copilot to split this migration into small PRs with validation commands.
Use Upgrade Copilot to build a team upgrade backlog for this repository.
```

## What Is Included

- `dependency-upgrade-triage`: prioritize outdated, vulnerable, risky, and safe dependency updates.
- `breaking-change-mapper`: map migration guides and release notes to local code.
- `upgrade-ci-rescue`: diagnose upgrade-related CI, build, test, lint, and type failures.
- `upgrade-assessment`: audit readiness before framework, runtime, or platform migrations.
- `migration-executor`: implement migration batches with focused validation.
- `migration-pr-splitter`: split migration work into reviewable PRs.
- `team-upgrade-program`: create an upgrade backlog and 30/60/90-day roadmap.

## Product Direction

The free plugin is the distribution layer. The paid product can become a hosted upgrade service:

- GitHub repo scan and upgrade risk score.
- Curated breaking-change intelligence.
- Automated PR batches for safe upgrades.
- CI failure clustering after dependency updates.
- Team dashboard for upgrade backlog, ownership, and rollout status.

See `upgrade-copilot/docs/monetization.md` and `upgrade-copilot/.mcp.example.json` for the placeholder paid-service shape.

## Landing Page

The static landing page lives in `docs/index.html` and can be published with GitHub Pages from the `main` branch `/docs` folder.
