# Backend Guide

This guide covers the Go service stubs, how to run them locally, and how to check that they respond correctly.

## What belongs here

- `services/auth`
- `services/content`
- `services/leaderboard`
- `services/gamification`
- `services/spaced-repetition`

These services are lightweight placeholders for local development and API shape testing.

## Run modes

Run all local mock services:

```bash
npm run dev:services:local:mock
```

Run all local database-backed services:

```bash
npm run dev:services:local:db
```

If you want to run a single service manually, use its directory and start command. Example:

```bash
cd services/auth
SERVICE_MODE=mock PORT=8081 go run ./cmd
```

## Service ports

- `auth` - `8081`
- `content` - `8082`
- `leaderboard` - `8080`
- `gamification` - `8083`
- `spaced-repetition` - `8084`

## Health checks

Use the helper script to probe all services:

```bash
bash tools/scripts/check-services.sh
```

You can also test endpoints directly:

```bash
curl -sS http://localhost:8081/health
curl -sS http://localhost:8082/paths
curl -sS http://localhost:8080/healthz
```

## Docker-backed backend

If you want the backend stack with database and cache containers, use:

```bash
docker compose -f infra/docker-compose.yml up --build
```

That compose file starts Postgres, Redis, and the service containers.

## Free CI/CD proposal for Go services

The cheapest practical path for the Go backend is:

1. Keep GitHub Actions for CI.
2. Build and test each service on every pull request.
3. Publish Docker images only if you want release artifacts.
4. Deploy to a free or nearly-free runtime only when you need public hosting.

Recommended free-first options:

- Oracle Cloud Always Free VM with Docker Compose if you want a full backend host at no monthly cost.
- Google Cloud Run if you want managed containers and are okay with billing setup for the free tier.
- A self-hosted runner on an always-on free VM if you already have one.

For this repo, the most conservative approach is:

- CI: GitHub Actions running `go test ./...` and `docker compose config` checks.
- CD: manually or automatically deploy container images to your chosen free VM/runtime.

This keeps the repo provider-neutral and avoids locking you into a paid platform before the backend stabilizes.

## Notes

- The services are intentionally small and should stay easy to start locally.
- If a service exits, read its terminal output first; that usually contains the actual startup error.
- When the frontend uses `webRuntime.apiBaseUrls`, it should point at these local ports in development.
