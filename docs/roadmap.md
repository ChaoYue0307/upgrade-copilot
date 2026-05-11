# Upgrade Copilot Roadmap

This roadmap turns the plugin into a product that could eventually make money.

## Phase 1: Prove The Workflow

- Test the plugin on real repositories.
- Collect screenshots and before/after examples.
- Tighten skill instructions based on real failures.
- Publish 2-3 case studies on the landing page.

## Phase 2: Capture Demand

- Use the waitlist issue form to collect interested users.
- Ask what upgrade problem they would pay to solve.
- Prioritize stacks with urgent migration pain, such as Next.js, React, Node, Python, Rails, Terraform, and Kubernetes.

## Phase 3: First Premium Prototype

Build the smallest paid feature:

> Paste a GitHub repo URL and receive an upgrade risk report.

The report should include:

- dependency risk score
- risky major upgrades
- abandoned or vulnerable packages
- CI and test readiness
- suggested PR batches
- next recommended command for Codex

## Phase 4: GitHub Automation

- GitHub App installation.
- Repository scan job.
- Upgrade PR generation.
- CI failure clustering.
- Dashboard for owners, status, and rollout.

## Phase 5: License-Gated MCP

Expose paid features through a hosted MCP server:

- `check_license`
- `scan_repository`
- `lookup_breaking_changes`
- `plan_upgrade_batches`
- `analyze_ci_failure`

The free plugin should remain useful. The paid service should add hosted intelligence, automation, persistence, and team visibility.
