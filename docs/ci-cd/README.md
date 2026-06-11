# CI/CD Guide

This guide explains the current CI/CD layout for the repository, why the pipelines were failing, and how to reason about frontend and backend delivery separately.

## The current failure cause

The frontend GitHub Actions workflows were using `npm ci`, but this repository does not currently include a `package-lock.json` file.

That causes an immediate failure like:

```text
Dependencies lock file is not found ... Supported file patterns: package-lock.json, npm-shrinkwrap.json, yarn.lock
```

### Fix options

You have two valid paths:

1. Add and commit `package-lock.json`, then keep using `npm ci`.
2. Keep the repo lockfile-free for now and switch the workflows to `npm install`.

For this branch, the workflows use `npm install` so the pipeline can run immediately.

---

## Frontend CI/CD

Frontend delivery is split by app so each host and MFE can be validated and deployed independently.

### Validation job

The frontend checks do three things:

- install dependencies
- generate `runtime.generated.ts`
- build each app

Current command pattern:

```bash
npm install
npm run prepare:web-runtime:dev
npm run build:web-website
npm run build:web-admin
npm run build:web-website-learning-path
```

### Vercel deployment model

Use one Vercel project per frontend surface:

- `web-shell`
- `web-website`
- `web-admin`
- `web-website-learning-path`
- `web-website-lessons`
- `web-website-hearts-gems`
- `web-website-league-social`
- `web-website-profile-settings`
- `web-admin-users`
- `web-admin-moderation`
- `web-admin-analytics`
- `web-admin-content-editor`

Recommended flow:

1. Pull requests run build-only validation.
2. Pushes to `main` trigger Vercel deploy hooks for the matching app.
3. Each app keeps its own deployment boundary.

### Files involved

- [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- [.github/workflows/frontend-vercel.yml](../../.github/workflows/frontend-vercel.yml)
- [docs/frontend/README.md](../frontend/README.md)

### Frontend troubleshooting checklist

- If every frontend job fails immediately, check for `npm ci` and missing lockfiles first.
- If a build fails later, run the same build locally with `npm run build:web-<app>`.
- If a runtime error appears, re-run `npm run prepare:web-runtime:dev` before building.
- If Vercel deploys fail, confirm the matching deploy hook secret exists in GitHub.

---

## Backend CI/CD

The backend is Go-based and can stay free-first.

### Current CI model

- `go test ./...` for each service
- `docker compose config` to validate the local compose file

Current command pattern:

```bash
npm run ci:backend
```

### Free-first deployment proposal

Use this sequence:

1. Keep GitHub Actions as the CI gate.
2. Build Docker images only when you want release artifacts.
3. Deploy to a low-cost or free runtime only when the backend is ready.

Recommended hosting options:

- Oracle Cloud Always Free VM with Docker Compose
- Google Cloud Run if managed containers are acceptable
- A self-hosted runner on a free VM if you already have one

### Backend troubleshooting checklist

- If tests fail, run the service command directly in its directory.
- If compose fails, run `docker compose -f infra/docker-compose.yml config` locally.
- If a service starts locally but not in CI, compare `go.mod` and environment variables first.

---

## Database CI/CD

Database changes are controlled through SQL migrations in `infra/migrations`.

Validation approach:

- keep SQL migrations in versioned files
- validate schema changes through backend tests and compose startup
- document every schema change in [docs/database/README.md](../database/README.md)

---

## How to walk through the pipelines together

1. Open the failing GitHub Actions run.
2. Check whether the failure is frontend, backend, or database related.
3. For frontend: confirm dependency install, runtime generation, and build target.
4. For backend: confirm `go test` and environment variables.
5. For database: confirm migrations match the service code.

## Suggested next step

If you want maximum reproducibility, add `package-lock.json` later and switch the frontend jobs back to `npm ci`.
