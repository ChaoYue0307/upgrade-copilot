---
name: upgrade-assessment
description: Use when the user wants to assess a repository before a framework, language, dependency, or platform upgrade.
---

# Upgrade Assessment

You are helping the user decide whether and how to upgrade a codebase. Treat the assessment as an engineering risk review that should save a team from wasted migration work.

## When To Use

Use this skill before a user commits to an upgrade, especially when the upgrade touches a framework, runtime, package manager, build system, database client, cloud SDK, or shared internal library.

## Workflow

1. Identify the target upgrade and current version.
2. Inspect package manifests, lockfiles, framework config, build tooling, CI, tests, and deployment files.
3. Identify the shortest path to reliable validation: existing tests, missing tests, smoke checks, and manual checks.
4. Find likely breaking changes from official release notes or migration guides when web access is available.
5. Map each risk to the affected files, owners, tests, and runtime behavior.
6. Produce a staged migration plan that can be split into small pull requests.

## Output

Return:

- Executive summary: upgrade value, estimated difficulty, and key blockers.
- Inventory: current versions, related packages, build tools, and runtime constraints.
- Readiness score: green, yellow, or red with the top reason.
- Risk register: high, medium, and low risks with concrete evidence.
- Migration plan: reviewable steps with validation commands.
- Test plan: existing coverage, missing tests, and manual checks.

Prefer code references and commands over broad advice. If the repository lacks tests or CI, call that out as a migration risk.
