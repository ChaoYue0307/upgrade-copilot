# Upgrade Copilot

Upgrade Copilot is a Codex plugin for one of the highest-value developer workflows: helping teams plan and execute framework, dependency, language, and platform upgrades.

The commercial thesis is simple: companies already pay engineers and consultants to reduce migration risk. A plugin that turns upgrade work into assessed, testable, reviewable batches can become a paid product once Codex plugin distribution and billing mature.

## What It Does

- Assesses upgrade readiness across package manifests, configs, CI, tests, and deployment files.
- Finds likely breaking changes and maps them to repository risk.
- Produces a migration plan that can be split into small pull requests.
- Guides Codex through implementation batches with validation after each step.

## Included Skills

- `upgrade-assessment`: Audit a repository before a migration.
- `migration-executor`: Implement an upgrade in small, safe batches.
- `migration-pr-splitter`: Split large migration work into reviewable PRs.

## Suggested Future Paid Features

- Hosted migration intelligence: curated breaking-change rules for popular stacks.
- License-gated MCP server: account, quota, and paid plan checks.
- GitHub integration: scan repos, open migration PRs, track rollout status.
- Team dashboard: migration inventory, risk score, and upgrade backlog.
- Premium playbooks: Next.js, React, Node, Python, Rails, Django, Terraform, Kubernetes, and database upgrades.

## Local Testing

To test this plugin through a local marketplace later, create a marketplace entry that points to this folder. The plugin itself starts at:

```text
upgrade-copilot/.codex-plugin/plugin.json
```

In Codex, try prompts like:

```text
Use Upgrade Copilot to assess this repo for a React upgrade.
Use Upgrade Copilot to plan a safe Next.js migration.
Use Upgrade Copilot to split this dependency upgrade into small PRs.
```
