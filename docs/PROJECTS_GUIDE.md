# Projects Guide — Code Quest Campaign

This guide walks through every top-level project in the repository, explains purpose and relationships, and gives direct comparisons so you know where to start and how parts differ.

## Quick map

- Frontend (Nx apps):
  - `apps/web/shell` — developer shell/dashboard
  - `apps/web/website` — learner host container (composes website MFEs)
  - `apps/web/admin` — admin host container (composes admin MFEs)
  - `apps/web/website/*` — website feature microfrontends (MFEs)
  - `apps/web/admin/*` — admin feature MFEs
- Backend (services): `services/*` — Go microservice stubs
- Shared UI: `packages/shared-ui`
- Tools: `tools/scripts/*` — runtime generator, cleanup and helpers
- Docs:
  - `docs/ONBOARDING.md`
  - `docs/frontend/README.md`
  - `docs/backend/README.md`
  - `docs/database/README.md`
  - `docs/ci-cd/README.md`
  - `docs/PROJECTS_GUIDE.md` (this file)

## Category readmes

- Frontend: [docs/frontend/README.md](frontend/README.md)
- Backend: [docs/backend/README.md](backend/README.md)
- Database: [docs/database/README.md](database/README.md)

## CI/CD summary

- Frontend: use the Vercel matrix workflow in [.github/workflows/frontend-vercel.yml](../.github/workflows/frontend-vercel.yml) so each host and MFE has its own build-and-deploy path.
- Backend: keep GitHub Actions for CI and use a free-first runtime strategy described in [docs/backend/README.md](backend/README.md).
- Database: keep schema changes in [infra/migrations](../infra/migrations) and validate them with the backend workflow and local compose stack.
- Full walkthrough: see [docs/ci-cd/README.md](ci-cd/README.md).

---

## How to read this file

- Each entry lists: path, role (host | microfrontend | service | package), dev serve port, runtime role, and notes.
- "Host" apps compose MFEs (in local dev via iframe). "MFE" apps are standalone apps that can be mounted by hosts.
- Use `npm run prepare:web-runtime:dev` before running local dev servers so apps get consistent `webRuntime` values.
- Use `npm run prepare:web-runtime:prod` when you want the runtime files to reflect production-like env values.

---

## Frontend hosts

### `apps/web/shell` (host)
- Purpose: developer shell and quick-launch registry.
- Role: host/dashboard for inspecting surfaces and service probes.
- Serve port: `4201` (package.json script)
- Runtime: `webRuntime.surface === 'shell'` and `containerRole === 'host'`.
- Notes: small, intended for developers to open MFEs/hosts directly and view health probes.

### `apps/web/website` (host)
- Purpose: learner-facing host that composes multiple website MFEs.
- Role: host container; in local dev it mounts MFEs via `iframe`.
- Serve port: `4200`
- MFEs served on ports: `4210`..`4214` (learning-path, lessons, hearts-gems, league-social, profile-settings)
- Runtime: `webRuntime.surface === 'website'`, `containerRole === 'standalone'`.
- Notes: good starting point to trace learner flows. The host maps feature ids → dev URLs.

### `apps/web/admin` (host)
- Purpose: admin host container for ops, content and moderation.
- Role: host container (iframe composition).
- Serve port: `4202`
- MFEs served on ports: `4220`..`4223` (users, moderation, analytics, content-editor)
- Runtime: `webRuntime.surface === 'admin'`, `containerRole === 'standalone'`.
- Notes: similar to `website` host but focused on admin surfaces.

---

## Website microfrontends (MFEs)

Each MFE is an independent Nx application with its own `project.json`, `tsconfig`, and `src/main.tsx` entry.
They run on dedicated dev ports and can be mounted by the website host via iframe.

- `apps/web/website/learning-path` — port `4210`
  - Role: path map and progression UI. Good example for migrating monolithic features.
- `apps/web/website/lessons` — port `4211`
  - Role: lesson player, question flow.
- `apps/web/website/hearts-gems` — port `4212`
  - Role: lives/currency UI.
- `apps/web/website/league-social` — port `4213`
  - Role: leaderboards and social feed.
- `apps/web/website/profile-settings` — port `4214`
  - Role: profile and account preferences.

Common MFE notes:
- Each MFE imports `./runtime.generated.ts` to read `webRuntime` (phase, serviceMode, apiBaseUrls).
- They should own their UI, routing, and local state. Network calls should use `webRuntime.apiBaseUrls`.

---

## Admin microfrontends (MFEs)

- `apps/web/admin/users` — port `4220` — user management UI.
- `apps/web/admin/moderation` — port `4221` — moderation queues.
- `apps/web/admin/analytics` — port `4222` — dashboards.
- `apps/web/admin/content-editor` — port `4223` — authoring tools.

Admin MFE notes: same composition pattern as website MFEs; treat each as independently deployable.

---

## Backend services (stubs)

Services live under `services/*` and are lightweight Go stubs used for local development and as placeholders for API shape.

- `services/auth` — port `8081` (default), endpoints: `/`, `/health`, `/auth/register`, `/auth/login`.
- `services/content` — port `8082`, endpoints: `/`, `/health`, `/paths`, `/lessons/:id`.
- `services/leaderboard` — port `8080`, endpoints: `/`, `/healthz`.
- `services/gamification` — port `8083`, endpoints: `/`, `/healthz`.
- `services/spaced-repetition` — port `8084`, endpoints: `/`, `/healthz`.

Notes:
- The `apiBaseUrls` are generated into `runtime.generated.ts` and referenced by frontends.
- Run stubs with `npm run dev:services:local:mock`.

---

## Shared packages

- `packages/shared-ui` — shared UI components used by hosts and MFEs. Favor using it to keep visual consistency.

---

## Tools and scripts

- `tools/scripts/generate-web-runtime.mjs` — writes `runtime.generated.ts` for each app from env vars.
  - Run: `npm run prepare:web-runtime`.
- `tools/scripts/cleanup-local-dev.mjs` — kills common dev ports to avoid `EADDRINUSE`.
  - Run: `npm run dev:cleanup`.

---

## Comparison: Host vs MFE vs Service

- Host
  - Purpose: composition, navigation, and global UX scaffolding.
  - Can: mount MFEs, provide global shell, orchestrate navigation.
  - Should not: contain heavy feature logic — that belongs to MFEs.

- MFE
  - Purpose: own a single feature (UI + API calls + local state).
  - Can: be deployed independently, run alone in dev, be iframe-mounted by hosts.
  - Should: avoid directly mutating other MFEs' state.

- Service
  - Purpose: provide API for data and business logic.
  - In this repo: stubbed Go services for local development.

---

## Recommended tracing order (for new engineers)

1. `npm run dev:cleanup` (clear ports)
2. `npm run prepare:web-runtime` (generate runtime files)
3. `npm run dev:services:local:mock` (start service stubs)
4. Open `apps/web/shell/src/main.tsx` to see the registry of endpoints
5. Start `apps/web/website` (`npm run serve:web-website`) and `apps/web/website/learning-path` (`npm run serve:web-website-learning-path`) and compare host ↔ MFE.
6. Inspect `apps/web/website/learning-path/src/main.tsx` and follow imports to components and local state.

---

## Migration and next steps

- Keep using iframe composition until MFEs are stable.
- When ready to integrate deeper: migrate to Module Federation for shared runtime imports and direct component sharing.
- Add a small `postMessage` bridge for host↔MFE events (navigation, auth tokens, dark-mode toggle).

---

## Commands summary

```bash
# regenerate runtime
npm run prepare:web-runtime

# cleanup stale processes
npm run dev:cleanup

# run services
npm run dev:services:local:mock

# run host and an example MFE
npm run serve:web-website
npm run serve:web-website-learning-path
```

## Script matrix

Use these scripts to run each container or microfrontend on its own, or as a grouped test run.

### Hosts

- `npm run dev:web:website:host` — website host only (`:4200`)
- `npm run dev:web:admin:host` — admin host only (`:4202`)
- `npm run dev:web:hosts` — shell + website + admin hosts together
- `npm run dev:web:all-hosts` — alias for all hosts

### Website MFEs

- `npm run dev:web:website:learning-path` — learning-path MFE only (`:4210`)
- `npm run dev:web:website:lessons` — lessons MFE only (`:4211`)
- `npm run dev:web:website:hearts-gems` — hearts-gems MFE only (`:4212`)
- `npm run dev:web:website:league-social` — league-social MFE only (`:4213`)
- `npm run dev:web:website:profile-settings` — profile-settings MFE only (`:4214`)
- `npm run dev:web:website:mfes` — all website MFEs together
- `npm run dev:web:website:all` — website host + all website MFEs together

### Admin MFEs

- `npm run dev:web:admin:users` — users MFE only (`:4220`)
- `npm run dev:web:admin:moderation` — moderation MFE only (`:4221`)
- `npm run dev:web:admin:analytics` — analytics MFE only (`:4222`)
- `npm run dev:web:admin:content-editor` — content-editor MFE only (`:4223`)
- `npm run dev:web:admin:mfes` — all admin MFEs together
- `npm run dev:web:admin:all` — admin host + all admin MFEs together

### Full combos

- `npm run dev:web:all-mfes` — all website + all admin MFEs together
- `npm run dev:web:all` — all hosts + all MFEs together

Suggested test order for isolated debugging:
1. Run a single host script.
2. Run the matching MFE script.
3. Open the host in the browser and mount the MFE.
4. Repeat for the next feature/container.

## How to verify apps are working (step-by-step)

Follow these step-by-step checks to validate hosts, MFEs and service stubs locally.

1) Clear ports and generate runtime

```bash
npm run dev:cleanup             # kill stale dev ports
npm run prepare:web-runtime:dev # write runtime.generated.ts for development
```

2) Start service stubs (in a separate terminal)

```bash
npm run dev:services:local:mock
```

What to expect:
- Each service should log "listening on :PORT" (see ports in this guide).
- If any service exits, inspect its logs in the same terminal for a stack trace.

3) Quick health checks (one-liners)

```bash
# auth
curl -sS http://localhost:8081/health || curl -sS http://localhost:8081/ | head -n 1

# content
curl -sS http://localhost:8082/health || curl -sS http://localhost:8082/paths | head -n 5

# leaderboard
curl -sS http://localhost:8080/healthz || curl -sS http://localhost:8080/ | head -n 1
```

4) Start the host(s)

```bash
npm run serve:web-website   # starts website host on :4200
npm run serve:web-shell     # optional developer shell on :4201
npm run serve:web-admin     # admin host on :4202
```

What to expect:
- Webpack dev servers print a local URL and "Project is running at".
- The host UI shows `surface` / `serviceMode` badges (see host header).

5) Start MFEs you want to test (each in its own terminal)

```bash
npm run serve:web-website-learning-path   # :4210
npm run serve:web-website-lessons         # :4211
# etc. use project names from this guide
```

6) Verify composition in browser

- Open http://localhost:4200 and use the host controls to mount the selected MFE.
- The iframe should load the MFE's dev server URL (check the iframe's Network tab).
- If the iframe stays blank, check the MFE terminal for compile or runtime errors.

7) Build-time checks

```bash
# Type-check and build the host + MFE (local validation)
npx nx run web-website:build
npx nx run web-website-learning-path:build
```

8) Inspect `runtime.generated.ts`

- Ensure `apps/<app>/src/runtime.generated.ts` exists and contains correct `apiBaseUrls`.
- If missing, re-run `npm run prepare:web-runtime:dev` and restart the dev server.

9) Automated health-check helper (provided)

- See `tools/scripts/check-services.sh` (simple curl-based script) to probe all service endpoints.
- Run it while service stubs are running:

```bash
bash tools/scripts/check-services.sh
```

10) Troubleshooting checklist

- Port collisions: run `npm run dev:cleanup` then retry.
- Missing runtime: run `npm run prepare:web-runtime:dev`.
- Type errors: inspect the terminal where the dev server prints "Type-checking in progress" and fix the reported TypeScript issues.
- Service crash: open the service terminal to see the Go panic or error; services accept `PORT` and `SERVICE_MODE` env overrides.

---

The guide above is intended as a quick-reference. If you want, I can:
- Add per-project browser test links and file-line references, or
- Add automated `npm` scripts that run the health-check and a headless browser smoke test.


## Run & test service stubs

Start the Go service stubs (they run on ports described above) with:

```bash
npm run dev:services:local:mock
```

Verify each stub is responding using `curl` in a separate terminal (examples):

```bash
# Auth
curl -s http://localhost:8081/ | jq
curl -s http://localhost:8081/health | jq

# Content
curl -s http://localhost:8082/ | jq
curl -s http://localhost:8082/paths | jq
curl -s http://localhost:8082/lessons/1 | jq

# Leaderboard
curl -sS http://localhost:8080/ | jq || echo "leaderboard: raw response"
curl -sS http://localhost:8080/healthz || echo "leaderboard health: raw response"

# Simple health check for any service (HTTP 200 expected when healthy)
curl -I http://localhost:8081/health
```

Expected results:
- The `/` root endpoints return small JSON objects indicating `service` and `status: ready`.
- `/health` or `/healthz` return `200 OK` (and sometimes a small JSON payload). Use `jq` to pretty-print JSON where available.

Notes:
- If ports are in use, run `npm run dev:cleanup` to free them.
- The stubs accept `PORT` and `SERVICE_MODE` env vars (see `package.json` scripts) if you need alternate ports or modes.

---

If you want, I can now:
- Add a `postMessage` bridge and example event handlers in the website host + learning-path MFE, or
- Expand this guide into a quick-reference cheat-sheet with file links and line references.

Tell me which you prefer and I’ll implement it next.
