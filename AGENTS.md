# AGENTS.md

Client-only PFAS toxicokinetic simulation SPA: React 19 + TypeScript + Vite, state in Zustand, wrapped by Capacitor for Android.

## Commands

- Install with `npm ci` (npm-only repo, `package-lock.json`). Node 22.12+ is required by Vite 8 / Vitest 5.
- `npm run dev` — Vite dev server.
- `npm run build` — `tsc -b` (typecheck) then `vite build`, then copies `dist/index.html` to `dist/404.html` for static-host SPA fallback. There is no separate typecheck script; use `npx tsc -b`.
- `npm run lint` — `oxlint` first, then `biome check` (lint + format). Use `npm run lint:fix` to auto-fix.
- `npm test` — Vitest one-shot; `npm run test:watch`; `npm run test:coverage`.
- Single test file: `npx vitest run src/simulation/__tests__/toxicokinetics.test.ts`; filter by name with `-t "..."`.
- Tests live in `src/**/__tests__/*.test.ts`. There is no Vitest config; it inherits the `@` alias from `vite.config.ts`.

## Architecture

- `src/simulation/` is framework-free computation. Do not import React, Zustand, or UI code into it.
- Pipeline: sampling engines (`monteCarlo.ts`, `latinHypercube.ts`, `monteCarloLhs.ts`) → `simulationRunner.ts` → `statistics.ts` + `toxicokinetics.ts`.
- UI runs simulations through `runSimulationAsync.ts`, which uses `workers/simulationWorker.ts` and silently falls back to main-thread execution. Keep worker request/response shapes in sync; unit tests should call `runSimulationPipeline` or engines directly.
- `simulation/pfasCompounds.ts` (`PFAS_COMPOUNDS`) is the source of truth for half-life, volume of distribution, MCL, and RfD. `toxicokinetics.ts` owns the canonical formulas for elimination rate, HQ, critical thresholds, and exceedance; don't re-derive them in components.
- `simulation/parameters.ts` (`PARAMETER_KEYS`) defines canonical parameter order shared by sampling, sensitivity, and the sidebar. Adding a parameter requires updating types, presets, and reference data too.
- Sampling is deterministic: Mulberry32 PRNG seeded per run (default 42). Use the PRNG, never `Math.random`, inside simulation paths. Lognormal distributions take arithmetic mean/SD and convert to log-space internally.
- `App.tsx` uses `HashRouter` and `vite.config.ts` uses `base: './'` deliberately for Capacitor/`file://`; don't switch to `BrowserRouter`.

## Conventions and gotchas

- Path alias `@/*` → `src/*` is configured in both Vite and `tsconfig.app.json`; tests and app code may mix alias and relative imports.
- TypeScript enforces `verbatimModuleSyntax` (use `import type`) and `erasableSyntaxOnly` (no enums, namespaces, or parameter properties). `tsc -b` also fails on unused locals/parameters.
- Biome style: single quotes, semicolons, 2-space indent, 100-column width. It ignores `android/`, `dist/`, `coverage/`, `public/`, and `.agents/`.
- Tailwind v4 is loaded via `@tailwindcss/vite` and `@import "tailwindcss"` in `src/index.css`; there is no `tailwind.config.*`.
- Scientific content is duplicated: README.md, `DocsPage.tsx`, `ScientificGuidePage.tsx`, `referenceData.ts`, and `presets.ts` all carry formulas, SOP/hypotheses, or calibrated values. Update all affected copies when numbers or methods change.
- Android: `npm run build && npx cap sync android`, then build with Gradle/Android Studio in `android/`. The native project is tracked; `dist/` and `coverage/` are not.
- No CI workflows exist, so run lint, typecheck/build, and tests locally before finishing.
- `.agents/` and `skills-lock.json` are gitignored local skill tooling, not app code.
