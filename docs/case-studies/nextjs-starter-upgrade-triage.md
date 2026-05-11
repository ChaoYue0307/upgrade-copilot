# Case Study: Next.js Starter Upgrade Triage

Repository: [`pbteja1998/nextjs-starter`](https://github.com/pbteja1998/nextjs-starter)

This case study shows the kind of upgrade report Upgrade Copilot is meant to produce for a real public repository.

## Repository Snapshot

The repo is a Next.js starter with authentication, Tailwind CSS, React Query, and Fauna DB. At the time of review, the repo had 453 GitHub stars and was last updated on 2026-04-01.

Evidence from `package.json`:

- `next`: `11.1.2`
- `react` / `react-dom`: `17.0.2`
- `next-auth`: `3.29.0`
- `react-query`: `3.21.1`
- `tailwindcss`: `2.2.9`
- `typescript`: `4.4.2`
- `eslint`: `7.32.0`

Current package baselines checked during the demo:

- `next`: `16.2.6`
- `react`: `19.2.6`
- `next-auth`: `4.24.14`
- `@tanstack/react-query`: `5.100.9`
- `tailwindcss`: `4.3.0`
- `typescript`: `6.0.3`
- `eslint`: `10.3.0`

## What Upgrade Copilot Would Flag

Readiness: **yellow/red**.

The upgrade opportunity is real, but this is not a safe single-PR dependency bump.

High-risk areas:

- Next.js is several major versions behind and should not jump directly from 11 to 16 without staged validation.
- React 17 to React 19 changes should be separated from framework migration work.
- NextAuth 3 to 4 touches authentication behavior and callback/session configuration.
- React Query 3 has a product rename and major API path toward `@tanstack/react-query`.
- Tailwind 2 uses `mode: "jit"` and `purge`, while newer Tailwind versions changed configuration conventions.
- TypeScript and ESLint are old enough to create noisy type/lint failures if upgraded together with runtime packages.

Repository-specific evidence:

- `tailwind.config.js` uses `mode: "jit"` and `purge`.
- `tsconfig.json` targets `es5`, enables `strict`, and includes a JS Fauna adapter.
- `package.json` has useful local validation scripts: `check-types`, `check-lint`, `build`, `validate`, and `validate:build`.
- No `.github/workflows` directory was found, so CI readiness is unclear from the repository.

## Suggested PR Plan

1. **Baseline validation PR**
   - Document the current validation commands.
   - Run `yarn check-types`, `yarn check-lint`, and `yarn build`.
   - Add CI before upgrading dependencies if this repo is maintained by a team.

2. **Tooling cleanup PR**
   - Upgrade TypeScript, Prettier, ESLint, and related configs in a focused batch.
   - Keep Next.js, React, auth, Tailwind, and database code unchanged.

3. **Auth migration PR**
   - Upgrade `next-auth` separately from framework changes.
   - Validate GitHub, LinkedIn, passwordless email, and session flows.

4. **Data/query migration PR**
   - Move from `react-query` 3 toward `@tanstack/react-query`.
   - Update imports and query client setup with tests or manual smoke checks.

5. **Tailwind migration PR**
   - Move from Tailwind 2 config conventions to the selected newer Tailwind target.
   - Validate visual regressions and generated CSS.

6. **Framework migration PRs**
   - Upgrade Next.js in stages.
   - Delay React 19 until the selected Next.js target and app code are ready.

## Why This Is A Good Demo

This repo makes the product value concrete. A generic dependency bot might open one large update PR. Upgrade Copilot should instead explain why the upgrade is risky, what to validate first, and how to split the work so a reviewer can understand and roll it back.

This is the shape of a future paid report: repo evidence, version gaps, risk scoring, PR sequencing, and validation commands.
