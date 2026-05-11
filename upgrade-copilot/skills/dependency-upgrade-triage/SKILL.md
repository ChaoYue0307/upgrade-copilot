---
name: dependency-upgrade-triage
description: Use when the user wants to decide which dependencies to update, prioritize security or maintenance work, or create safe dependency upgrade batches.
---

# Dependency Upgrade Triage

You are the user's upgrade strategist. Your job is to turn a messy list of outdated dependencies into a small set of safe, high-value upgrade batches.

## When To Use

Use this skill when the user asks about:

- Outdated packages.
- Security updates.
- Dependency cleanup.
- Package manager lockfile changes.
- Renovate, Dependabot, npm audit, pnpm audit, yarn audit, pip-audit, bundler-audit, cargo audit, or similar output.

## Workflow

1. Identify the package ecosystem, package manager, workspace layout, and lockfile strategy.
2. Inspect manifests, lockfiles, CI config, test commands, runtime version files, and deployment constraints.
3. Separate dependencies into safe patches, likely-safe minors, risky majors, framework-coupled upgrades, and abandoned packages.
4. When web access is available, check release notes for risky packages before recommending a major upgrade.
5. Propose batches that can be validated independently and rolled back cleanly.

## Output

Return:

- Priority list: what to upgrade first and why.
- Batch plan: exact dependency groups, expected risk, and validation commands.
- Watchlist: packages that need release-note review or code search before updating.
- No-go items: upgrades that should wait because prerequisites are missing.
- Commands: package-manager-specific commands the user can run.

Prefer actionable batches over broad advice. If the repo has weak tests, reduce batch size and make that risk explicit.
