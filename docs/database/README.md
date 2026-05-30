# Database Guide

This guide covers the database schema, migrations, and local database setup used by the project.

## What belongs here

- `infra/docker-compose.yml` - local Postgres and Redis stack
- `infra/migrations/*` - SQL migrations for the database schema

## Local database stack

Start the local database and cache containers with Docker Compose:

```bash
docker compose -f infra/docker-compose.yml up postgres redis
```

The compose file configures:

- Postgres on `localhost:5432`
- Redis on `localhost:6379`
- Default Postgres database: `codequest`
- Default user: `codequest`

You can override the database password with `DB_PASSWORD`.

## Migrations

Current migration files:

- `001_create_users_table.up.sql`
- `001_create_users_table.down.sql`
- `002_create_refresh_tokens.up.sql`
- `002_create_refresh_tokens.down.sql`

The schema currently contains:

- `users`
- `refresh_tokens`

### `users`

Stores auth identity information such as:

- UUID primary key
- email
- username
- password hash
- auth provider
- role
- timestamps
- soft delete column

### `refresh_tokens`

Stores refresh token records with:

- UUID primary key
- foreign key to `users`
- token hash
- expiration timestamp
- revocation timestamp
- created timestamp

## How to test the database

1. Start Postgres:

```bash
docker compose -f infra/docker-compose.yml up postgres
```

2. Check that Postgres is alive:

```bash
pg_isready -h localhost -p 5432 -U codequest
```

3. Apply or inspect the SQL migrations manually with your preferred PostgreSQL client.

There is no dedicated migration runner wired into the repo yet, so SQL files are the source of truth for schema changes.

## Notes

- Keep schema changes in `infra/migrations`.
- Update backend services if schema changes affect auth, content, or refresh token handling.
- If you add a migration tool later, document the exact command here.
