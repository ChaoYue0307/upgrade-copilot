# FAQ

## Is Upgrade Copilot an official OpenAI plugin?

No. Upgrade Copilot is a public custom marketplace source for Codex. It is not an official OpenAI marketplace listing.

## Is it free?

Yes. The plugin is free to install and use today. Future premium features may be offered through a hosted service, GitHub App, or license-gated MCP server.

## How is this different from Dependabot or Renovate?

Dependabot and Renovate are great at detecting version updates and opening dependency PRs. Upgrade Copilot is focused on the reasoning around risky upgrades: what will break, how to group changes, what validation to run, and how to split the work for review.

## Does it make code changes automatically?

Only when you ask Codex to implement a migration batch. The plugin itself provides skills and workflow guidance. Codex still follows your normal approval and execution settings.

## Does it need access to my private code?

The free plugin runs inside your Codex workflow. It does not send code to a separate Upgrade Copilot backend because no hosted backend exists yet. If a future premium backend is added, it should have a separate privacy policy, authentication model, and explicit user opt-in.

## What is the premium idea?

The premium product direction is hosted upgrade intelligence: repo risk reports, curated breaking-change data, GitHub PR automation, CI failure clustering, and team dashboards.

## Can I install it from the official marketplace?

Not currently. Add it as a custom marketplace source:

```text
Source: ChaoYue0307/upgrade-copilot
Git ref: main
Sparse paths:
```
