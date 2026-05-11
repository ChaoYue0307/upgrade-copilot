# Case Study: React/Vite Starter Upgrade Triage

Repository: [`CodingGarden/react-ts-starter`](https://github.com/CodingGarden/react-ts-starter)

This case study shows Upgrade Copilot's value on a modern frontend starter where the migration risk is mostly tooling coordination rather than legacy framework debt.

## Repository Snapshot

The repo is a Vite + React + TypeScript starter with Vitest, Testing Library, React Router, ESLint, Prettier, and Airbnb lint rules. At the time of review, it had 214 GitHub stars and was last updated on 2026-03-19.

Evidence from `package.json`:

- `react` / `react-dom`: `^18.3.1`
- `react-router-dom`: `^6.26.2`
- `vite`: `^5.4.8`
- `vitest`: `^2.1.2`
- `typescript`: `^5.6.3`
- `eslint`: `^8.54.0`
- `@typescript-eslint/*`: `^7.14.1`
- `jsdom`: `^25.0.1`

Current package baselines checked during the demo:

- `react`: `19.2.6`
- `react-router-dom`: `7.15.0`
- `vite`: `8.0.12`
- `vitest`: `4.1.5`
- `typescript`: `6.0.3`
- `eslint`: `10.3.0`
- `@typescript-eslint/eslint-plugin`: `8.59.2`
- `jsdom`: `29.1.1`

## Report Summary

- Readiness: **yellow**
- Primary risk: Vite, Vitest, TypeScript, ESLint, and React can create noisy failures if upgraded together
- Best first action: run and preserve baseline `typecheck`, `lint`, `test`, and `build`
- Recommended shape: tooling batches first, React major later

## What Upgrade Copilot Would Flag

The repo is healthier than the Next.js starter, but still benefits from a staged plan.

High-risk areas:

- Vite 5 to 8 should be validated with build and dev-server smoke checks.
- Vitest 2 to 4 can affect test environment behavior, especially with `globals`, `jsdom`, and setup files.
- ESLint 8 to 10 and `@typescript-eslint` 7 to 8 should be handled with config and rule migration in a dedicated PR.
- React 18 to 19 should be separated from Vite/Vitest/ESLint movement.
- React Router 6 to 7 is an app behavior migration and should not be bundled with tooling updates.

Repository-specific evidence:

- `vite.config.ts` configures Vitest globals, `jsdom`, and `src/setupTests.ts`.
- `tsconfig.json` uses `moduleResolution: "Node"`, `jsx: "react-jsx"`, `strict: true`, and `types: ["vitest/globals"]`.
- Scripts include `build`, `test`, `lint`, and `typecheck`.
- The repo has `.github/FUNDING.yml` but no visible `.github/workflows` directory, so CI readiness is unclear.

## Suggested PR Plan

1. **Baseline validation PR**

   - Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
   - Add CI if this starter is expected to stay maintained.

2. **Vite/Vitest batch**

   - Upgrade Vite, Vitest, `@vitejs/plugin-react`, and `jsdom` together.
   - Validate test environment, setup files, build output, and preview command.

3. **ESLint/TypeScript batch**

   - Upgrade TypeScript, ESLint, and `@typescript-eslint`.
   - Keep runtime packages unchanged.
   - Fix lint and type errors separately from behavior changes.

4. **React Router migration**

   - Upgrade `react-router-dom` separately.
   - Validate route behavior and any loader/action usage if present.

5. **React 19 migration**

   - Upgrade React and React DOM after tooling is stable.
   - Validate rendering, Testing Library behavior, and strict-mode assumptions.

## Why This Is A Good Demo

This repo shows that Upgrade Copilot is not only for old legacy apps. Even a relatively modern starter can produce risky noise if test tooling, linting, TypeScript, routing, and React are upgraded in one PR.
