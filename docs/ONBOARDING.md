# Code Quest Campaign — Onboarding

This document helps a new engineer understand and navigate the monorepo, with emphasis on the microfrontend layout.

## High-level architecture

- Monorepo managed with Nx.
- Frontend surfaces:
  - `apps/web/shell`: lightweight developer shell/dashboard.
  - `apps/web/website`: learner host container (composes learner MFEs via iframe in local dev).
  - `apps/web/admin`: admin host container (composes admin MFEs via iframe in local dev).
  - `apps/web/website/*`: website microfrontends (learning-path, lessons, hearts-gems, league-social, profile-settings).
  - `apps/web/admin/*`: admin microfrontends (users, moderation, analytics, content-editor).
- Backend services: Go microservice stubs under `services/*` (auth, content, gamification, leaderboard, spaced-repetition).
- Shared UI/components: `packages/shared-ui` (used by hosts and MFEs).

## Key developer flows

1. Regenerate runtime values (writes `apps/web/*/src/runtime.generated.ts`):

```bash
npm run prepare:web-runtime
```

2. Kill stale dev servers (if you see port-in-use errors):

```bash
npm run dev:cleanup
```

3. Start local services (Go stubs):

```bash
npm run dev:services:local:mock
```

4. Start host and one or more MFEs (example):

```bash
npm run serve:web-website       # host at http://localhost:4200
npm run serve:web-website-learning-path  # MFE at http://localhost:4210
```

Open the host and the MFE in the browser and compare — hosts mount MFEs via `iframe` for local composition.

## Where to start reading code

1. `apps/web/*/src/runtime.generated.ts` — contains `webRuntime` constants (phase, serviceMode, apiBaseUrls).
2. `apps/web/shell/src/main.tsx` — developer shell; lists hosts/MFEs and service probes.
3. `apps/web/website/src/main.tsx` — website host: see `websiteFeatures` mapping and iframe composition.
4. `apps/web/admin/src/main.tsx` — admin host: same composition pattern for admin MFEs.
5. Pick a microfrontend (e.g., `apps/web/website/learning-path`) and open its `src/main.tsx`, then follow imports to local components.
6. Services: check `services/*/cmd/main.go` for endpoints and `openapi.yaml` if present.

## Recommendations for migration

- Keep iframe composition until the feature MFE is stable and shared dependencies are aligned.
- When ready to integrate more tightly, consider Module Federation and share `react`, `react-dom`, and `@code-quest/shared-ui` as singletons.

## Next steps I can take for you

- Add `postMessage` bridge for host↔MFE communication.
- Migrate one feature (`learning-path`) into its MFE and wire messaging/state.
- Produce a full repo-wide automated comment sweep (large change).

If you want me to continue, tell me which next step to take.
