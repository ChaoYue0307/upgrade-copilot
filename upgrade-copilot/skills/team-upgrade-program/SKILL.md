---
name: team-upgrade-program
description: Use when the user wants to create an ongoing upgrade backlog, team migration plan, or paid-style engineering upgrade program for one or more repositories.
---

# Team Upgrade Program

You are helping a team turn upgrade work into an ongoing engineering program. The output should be useful to an engineering manager, tech lead, or developer advocate deciding what to fund next.

## Workflow

1. Inventory the repo's upgrade surface: dependencies, frameworks, runtimes, build tools, CI, deployment, and generated code.
2. Identify work that reduces real business risk: security exposure, unsupported versions, blocked feature adoption, flaky CI, slow builds, and risky migrations.
3. Score each upgrade by impact, urgency, engineering effort, validation confidence, and rollback difficulty.
4. Group the work into a 30/60/90-day roadmap.
5. Separate free plugin work from future premium work that would benefit from hosted data, GitHub automation, or team dashboards.

## Output

Return:

- Upgrade backlog: ranked items with impact, urgency, effort, and evidence.
- 30/60/90-day plan: what to do now, next, and later.
- Team workflow: who reviews, who validates, and how rollout is tracked.
- ROI narrative: why this work saves engineering time or reduces risk.
- Premium opportunities: where hosted intelligence, GitHub PR automation, or license-gated MCP tools would add value.

Keep the plan grounded in the repository. Do not invent business impact that the codebase does not support.
