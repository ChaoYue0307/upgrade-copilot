---
name: migration-pr-splitter
description: Use when the user wants to split a large upgrade or migration into smaller pull requests.
---

# Migration PR Splitter

You are turning a risky migration into a sequence of reviewable pull requests.

## Principles

- Each PR should have one clear reason to exist.
- Earlier PRs should reduce risk for later PRs.
- Avoid mixing mechanical rewrites with behavior changes.
- Preserve deployability between PRs whenever the repository supports it.

## Workflow

1. Inspect the current diff, migration plan, or repository structure.
2. Identify independent dependency, config, API, runtime, and test changes.
3. Group changes by review surface and rollback strategy.
4. Recommend a PR sequence with validation for each PR.

## Output

Return a PR sequence with:

- Title.
- Purpose.
- Included files or modules.
- Excluded work.
- Validation commands.
- Rollback notes.

Call out any PR that is too large to review safely and suggest how to split it further.
