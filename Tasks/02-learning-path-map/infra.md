# Feature 02: Learning Path Map — Infrastructure Tasks

## Overview
Feature 02 infrastructure includes Docker Compose setup for services, GitHub Actions CI/CD pipeline, and environment configuration.

---

## Task 2.4.1: Docker Compose Configuration for Content Service

### Description
Update docker-compose.yml to include content microservice alongside existing auth service and databases.

### Implementation Details

```yaml
# infra/docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: codequest
      POSTGRES_PASSWORD: ${DB_PASSWORD:-dev_password}
      POSTGRES_DB: codequest
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U codequest"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  auth-service:
    build:
      context: .
      dockerfile: services/auth/Dockerfile
    environment:
      PORT: 8081
      DATABASE_URL: postgres://codequest:${DB_PASSWORD:-dev_password}@postgres:5432/codequest?sslmode=disable
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-dev_secret_key_min_32_chars_long}
      OAUTH_GOOGLE_CLIENT_ID: ${OAUTH_GOOGLE_CLIENT_ID}
      OAUTH_GOOGLE_CLIENT_SECRET: ${OAUTH_GOOGLE_CLIENT_SECRET}
    ports:
      - "8081:8081"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  content-service:
    build:
      context: .
      dockerfile: services/content/Dockerfile
    environment:
      PORT: 8082
      DATABASE_URL: postgres://codequest:${DB_PASSWORD:-dev_password}@postgres:5432/codequest?sslmode=disable
      REDIS_URL: redis://redis:6379
      LOG_LEVEL: ${LOG_LEVEL:-info}
    ports:
      - "8082:8082"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8082/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Dockerfile for Content Service

```dockerfile
# services/content/Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git make

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY services/content ./

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/bin/content-service ./cmd/main.go

# Runtime image
FROM alpine:3.18
RUN apk add --no-cache ca-certificates curl

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/bin/content-service ./

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8082/health || exit 1

# Run service
CMD ["./content-service"]
```

### Environment Configuration

```bash
# infra/.env.local
# Database
DB_PASSWORD=dev_password_123456
DATABASE_URL=postgres://codequest:dev_password_123456@localhost:5432/codequest?sslmode=disable

# Redis
REDIS_URL=redis://localhost:6379

# Auth Service
JWT_SECRET=dev_secret_key_min_32_chars_long_for_jwt
JWT_EXPIRATION_MINUTES=15
REFRESH_TOKEN_EXPIRATION_DAYS=7

# OAuth
OAUTH_GOOGLE_CLIENT_ID=<your_google_client_id>
OAUTH_GOOGLE_CLIENT_SECRET=<your_google_client_secret>
OAUTH_GITHUB_CLIENT_ID=<your_github_client_id>
OAUTH_GITHUB_CLIENT_SECRET=<your_github_client_secret>

# Logging
LOG_LEVEL=info

# Content Service
CACHE_TTL_MINUTES=5
```

### Testing Checklist
- ✅ Docker Compose file has valid YAML syntax
- ✅ All services start without errors
- ✅ Health checks pass for all services
- ✅ Databases initialize correctly
- ✅ Services can communicate with each other
- ✅ Environment variables load properly
- ✅ Volumes persist data across restarts

---

## Task 2.4.2: GitHub Actions CI/CD Pipeline for Content Service

### Description
Create GitHub Actions workflow for testing, building, and deploying content service.

### Implementation Details

```yaml
# .github/workflows/content-service-ci.yml
name: Content Service CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/content/**'
      - '.github/workflows/content-service-ci.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'services/content/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: codequest
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: codequest
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Cache Go modules
        uses: actions/cache@v3
        with:
          path: ~/go/pkg/mod
          key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
          restore-keys: |
            ${{ runner.os }}-go-

      - name: Run tests
        working-directory: services/content
        env:
          DATABASE_URL: postgres://codequest:test_password@localhost:5432/codequest?sslmode=disable
          REDIS_URL: redis://localhost:6379
        run: |
          go test -v -race -coverprofile=coverage.out ./...
          go tool cover -func=coverage.out

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./services/content/coverage.out
          flags: content-service

  lint:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: golangci-lint
        uses: golangci/golangci-lint-action@v3
        with:
          working-directory: services/content
          version: latest

  build:
    needs: [test, lint]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          file: services/content/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/content-service:latest
            ${{ secrets.DOCKER_USERNAME }}/content-service:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  sonarcloud:
    needs: [test]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONARCLOUD_TOKEN: ${{ secrets.SONARCLOUD_TOKEN }}
```

### Testing Checklist
- ✅ Tests run in CI and report coverage
- ✅ Linting runs with golangci-lint
- ✅ Build succeeds and produces Docker image
- ✅ Docker image pushes to registry
- ✅ SonarCloud analyzes code quality
- ✅ Workflow triggers on correct paths
- ✅ All secrets configured in GitHub

---

## Task 2.4.3: Database Migration Automation

### Description
Set up automated database migrations on service startup using golang-migrate.

### Implementation Details

```go
// services/content/internal/migration/migrate.go
package migration

import (
	"embed"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
)

//go:embed *.sql
var fs embed.FS

func RunMigrations(databaseURL string) error {
	d, err := iofs.New(fs, ".")
	if err != nil {
		return fmt.Errorf("failed to create migration source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", d, databaseURL)
	if err != nil {
		return fmt.Errorf("failed to create migrator: %w", err)
	}
	defer m.Close()

	// Run all pending migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration failed: %w", err)
	}

	version, dirty, err := m.Version()
	if err != nil {
		return fmt.Errorf("failed to get migration version: %w", err)
	}

	log.Printf("Database migration complete. Version: %d, Dirty: %v\n", version, dirty)
	return nil
}
```

```go
// services/content/cmd/main.go
func main() {
	// Load environment
	databaseURL := os.Getenv("DATABASE_URL")
	
	// Run migrations before starting service
	if err := migration.RunMigrations(databaseURL); err != nil {
		log.Fatalf("Failed to run migrations: %v\n", err)
	}

	// Continue with service startup...
}
```

### Testing Checklist
- ✅ Migrations run automatically on startup
- ✅ Migration version tracked in database
- ✅ All SQL files in migrations folder applied
- ✅ Rollback works with down migrations
- ✅ Idempotent runs (no errors on re-run)
- ✅ Dirty state handled properly

---

## Summary

Feature 02 infrastructure includes 3 interconnected tasks:
1. **Docker Compose** - Orchestrates auth, content services with PostgreSQL and Redis
2. **GitHub Actions CI/CD** - Tests, lints, builds, and publishes Docker images
3. **Database Migrations** - Automated schema versioning on service startup

**Total Infrastructure Tasks: 3**
**Estimated Effort: 20 hours**
**Dependencies: Feature 01 (auth service), Feature 02 backend (content service)**
