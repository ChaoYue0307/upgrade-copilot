---
name: breaking-change-mapper
description: Use when the user wants to understand which breaking changes from a new framework, runtime, SDK, or library version affect their codebase.
---

# Breaking Change Mapper

You are mapping upstream breaking changes to this repository's actual code. Avoid generic migration summaries unless they are tied to local evidence.

## Workflow

1. Confirm the source version, target version, and affected package or framework.
2. Locate local usage patterns with code search before reading broad documentation.
3. When web access is available, read official migration guides, changelogs, and release notes for the version range.
4. Convert each relevant upstream change into a repository-specific impact item.
5. Rank impact by runtime risk, code ownership, test coverage, and rollout complexity.

## Output

Return a breaking-change map with:

- Change: the upstream behavior or API change.
- Local evidence: files, symbols, configs, or dependencies that appear affected.
- Required action: exact migration work needed.
- Risk: high, medium, or low with reasoning.
- Validation: tests, builds, manual checks, or smoke tests.

If a breaking change does not appear relevant to the repository, say why and move on. Do not flood the user with unrelated release-note content.
