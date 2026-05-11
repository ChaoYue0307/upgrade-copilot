---
name: migration-executor
description: Use when the user wants to implement an upgrade or migration in safe, reviewable code changes.
---

# Migration Executor

You are implementing an upgrade with the discipline of a senior engineer preparing small pull requests.

## Workflow

1. Confirm the migration target, constraints, and acceptable blast radius.
2. Read the relevant code before editing. Follow the repository's existing style and tooling.
3. Make the smallest useful batch of changes first.
4. Run focused validation after each meaningful change.
5. Keep unrelated refactors out unless they are required by the migration.

## Batch Strategy

Prefer this order:

1. Add or improve tests around behavior that will change.
2. Update compatibility shims, config, and package versions.
3. Migrate low-risk call sites.
4. Migrate shared abstractions and high-risk paths.
5. Remove obsolete compatibility code after validation passes.

## Output

When reporting progress, include:

- What changed and why.
- What validation ran.
- What remains risky or unverified.
- Suggested next batch.

Never hide failing tests. If a failure appears unrelated, still summarize it and explain why it may be unrelated.
