# Monetization Placeholder

Upgrade Copilot is free to install today. The business model should live behind optional hosted services so the plugin stays useful even before a paid Codex marketplace exists.

## Free Layer

- Repository upgrade assessment.
- Dependency triage.
- Breaking-change mapping.
- CI rescue guidance.
- Migration PR splitting.

This layer should be good enough to earn trust and distribution.

## Premium Layer

Future paid features can be exposed through a license-gated MCP server, GitHub App, or hosted dashboard:

- Curated migration intelligence for popular stacks.
- Repo risk scoring across many repositories.
- GitHub PR automation for safe upgrade batches.
- CI failure clustering after dependency changes.
- Team dashboard for upgrade backlog, risk, status, and ownership.
- Premium playbooks for Next.js, React, Node, Python, Rails, Django, Terraform, Kubernetes, and database clients.

## Suggested Pricing Tests

- Solo developer: $10-$20/month for premium playbooks and hosted scans.
- Small team: $49-$199/month for repo dashboards and PR automation.
- Company or agency: $500+/month for multi-repo upgrade programs.
- One-off migration package: fixed price per framework upgrade.

## Future MCP Contract

The example file at `../.mcp.example.json` is intentionally not enabled by default. When a real paid service exists, the plugin can add a production `.mcp.json` that exposes tools like:

- `scan_repository`: produce dependency, framework, runtime, and CI risk scores.
- `lookup_breaking_changes`: query curated migration rules for a version range.
- `plan_upgrade_batches`: generate paid, stack-specific PR batches.
- `check_license`: verify account, plan, and usage limits.

Keep the paid service optional. The free plugin should remain a useful top-of-funnel product.
