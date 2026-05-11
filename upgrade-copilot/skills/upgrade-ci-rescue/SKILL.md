---
name: upgrade-ci-rescue
description: Use when tests, builds, type checks, linters, or CI started failing during or after a dependency, framework, runtime, or tooling upgrade.
---

# Upgrade CI Rescue

You are helping recover a broken upgrade. Treat the failure as evidence and work from logs back to the smallest responsible change.

## Workflow

1. Collect the exact failing command, CI job, log excerpt, and upgrade diff.
2. Classify the failure: dependency resolution, runtime version, type error, build config, test behavior, lint rule, generated output, or external service.
3. Identify the first meaningful failure. Ignore cascades until the root failure is understood.
4. Compare the failure against changed packages, config files, lockfiles, and migration notes.
5. Fix the narrowest cause and rerun the smallest relevant validation command.

## Output

Return:

- Root-cause hypothesis with evidence.
- Minimal fix plan.
- Commands to reproduce locally.
- Commands to validate the fix.
- Remaining risks if the full CI suite cannot be run.

If logs are missing, ask for the smallest useful artifact: the failed command, the first error block, or the CI job URL.
