# Upgrade Copilot

Upgrade Copilot is a Codex plugin for developers who need to upgrade dependencies, frameworks, runtimes, SDKs, and build systems without turning the repo into one giant risky PR.

The product bet: teams already spend expensive engineering time on upgrades that feel boring until they break CI, production behavior, or release timelines. A useful Codex plugin should make those moments less painful by turning upgrade work into evidence, batches, validation, and clear reviewer context.

## Jobs It Should Win

- "Which dependencies can I safely update this week?"
- "What breaking changes affect this codebase before we upgrade?"
- "CI broke after a package update. What actually caused it?"
- "Split this framework migration into PRs a reviewer can understand."
- "Help me implement the next migration batch and prove it works."

## Included Skills

- `dependency-upgrade-triage`: Prioritize outdated, vulnerable, risky, and safe dependency updates.
- `breaking-change-mapper`: Map upstream migration notes to local files, configs, and symbols.
- `upgrade-ci-rescue`: Diagnose CI, build, test, lint, and type failures caused by upgrades.
- `upgrade-assessment`: Audit readiness before a framework, runtime, dependency, or platform migration.
- `migration-executor`: Implement upgrade batches with focused validation.
- `migration-pr-splitter`: Split migration work into reviewable PRs with rollback notes.
- `team-upgrade-program`: Turn upgrade work into a ranked team backlog and 30/60/90-day roadmap.

## Example Prompts

```text
Use Upgrade Copilot to find the safest dependency upgrades in this repo.
Use Upgrade Copilot to map breaking changes for upgrading Next.js.
Use Upgrade Copilot to diagnose why CI started failing after this dependency update.
Use Upgrade Copilot to split this migration into small PRs with validation commands.
Use Upgrade Copilot to implement the first low-risk upgrade batch.
Use Upgrade Copilot to build a team upgrade backlog for this repository.
```

## What Makes It Useful

- It starts from repository evidence, not generic migration advice.
- It treats tests and CI as first-class upgrade inputs.
- It separates safe patches, risky majors, abandoned packages, framework-coupled upgrades, and cleanup work.
- It asks Codex to produce reviewer-ready plans with validation and rollback notes.
- It creates a clear path to paid features without blocking the free plugin.

## Future Paid Features

- Hosted migration intelligence: curated breaking-change rules for popular stacks.
- License-gated MCP server: account, quota, and paid plan checks.
- GitHub integration: scan repos, open migration PRs, and track rollout status.
- Team dashboard: migration inventory, risk score, upgrade backlog, and SLA tracking.
- Premium playbooks: Next.js, React, Node, Python, Rails, Django, Terraform, Kubernetes, and database upgrades.

See `docs/monetization.md` for the paid-product placeholder and `.mcp.example.json` for the future premium MCP shape. The MCP example is not enabled by default, so the plugin remains installable without a paid backend.

## Local Testing

Validation:

- Plugin manifest schema checks run in CI via `.github/workflows/validate-plugin.json.yml` when the plugin folder is used as a standalone repo.
- This marketplace repo also includes a root workflow at `.github/workflows/validate-plugin.yml`.
- You can run the same check locally from this marketplace repo root with:

```bash
jq empty upgrade-copilot/.codex-plugin/plugin.json
jq -e '.name and .version and .description and .skills and .author and .author.url and .interface and .interface.displayName and .interface.defaultPrompt and .interface.capabilities' upgrade-copilot/.codex-plugin/plugin.json
```

The plugin itself starts at:

```text
upgrade-copilot/.codex-plugin/plugin.json
```
