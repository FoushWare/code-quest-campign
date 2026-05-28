# Feature 01: User Onboarding & Registration — Infrastructure Tasks

**Owner:** DevOps/Infra Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** Infrastructure setup (1-2 tasks)  
**Tech Stack:** Docker, Docker Compose, PostgreSQL, environment variables  

---

## Task: Docker Compose Setup for Local Development

### Description
Setup Docker Compose with PostgreSQL + Redis for local development environment.

### docker-compose.yml

```yaml
version: '3.9'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: code_quest_postgres
    environment:
      POSTGRES_USER: localdev
      POSTGRES_PASSWORD: localdev_pass
      POSTGRES_DB: code_quest
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U localdev"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - code_quest

  # Redis (for leaderboards, caching)
  redis:
    image: redis:7-alpine
    container_name: code_quest_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - code_quest

  # Auth Service (Go)
  auth_service:
    build:
      context: ./services/auth
      dockerfile: Dockerfile
    container_name: code_quest_auth
    environment:
      DATABASE_URL: postgres://localdev:localdev_pass@postgres:5432/code_quest?sslmode=disable
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-dev_secret_key}
      PORT: 8081
    ports:
      - "8081:8081"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - code_quest

volumes:
  postgres_data:
  redis_data:

networks:
  code_quest:
    driver: bridge
```

### Commands

**Start services:**
```bash
cd infra
docker-compose up -d
```

**Stop services:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f postgres
docker-compose logs -f auth_service
```

**Access PostgreSQL:**
```bash
docker exec -it code_quest_postgres psql -U localdev -d code_quest
```

**Access Redis:**
```bash
docker exec -it code_quest_redis redis-cli
```

---

## Task: Environment Configuration

### .env.local (Development)

```bash
# Database
DATABASE_URL=postgres://localdev:localdev_pass@localhost:5432/code_quest?sslmode=disable
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=dev_secret_key_change_in_prod
JWT_ACCESS_EXPIRY=900  # 15 minutes
JWT_REFRESH_EXPIRY=604800  # 7 days

# OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Server
PORT=8081
ENV=development

# Logging
LOG_LEVEL=debug
```

### .env.production

```bash
DATABASE_URL=${DATABASE_URL}  # Set from GitHub Secrets
DATABASE_POOL_SIZE=50
REDIS_URL=${REDIS_URL}
JWT_SECRET=${JWT_SECRET}

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}

PORT=8081
ENV=production
LOG_LEVEL=info
```

---

## Task: CI/CD Pipeline (GitHub Actions)

### .github/workflows/auth-service.yml

```yaml
name: Auth Service CI/CD

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'services/auth/**'
      - '.github/workflows/auth-service.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'services/auth/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: code_quest_test
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
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.20'
    
    - name: Run tests
      working-directory: ./services/auth
      env:
        DATABASE_URL: postgres://testuser:testpass@localhost:5432/code_quest_test?sslmode=disable
        REDIS_URL: redis://localhost:6379
      run: |
        go test -v -race -coverprofile=coverage.out ./...
        go tool cover -func coverage.out
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./services/auth/coverage.out

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Build Docker image
      working-directory: ./services/auth
      run: |
        docker build -t code_quest_auth:latest .
        docker build -t code_quest_auth:${{ github.sha }} .

  lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.20'
    
    - name: Run golangci-lint
      uses: golangci/golangci-lint-action@v3
      with:
        working-directory: ./services/auth
```

---

## Task: Database Migrations in CI

### Auto-run migrations on deployment

Update Dockerfile to run migrations:

```dockerfile
# services/auth/Dockerfile
FROM golang:1.20-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o auth ./cmd/main.go

FROM alpine:3.18
RUN apk add --no-cache postgresql-client
COPY --from=builder /app/auth /app/auth
COPY --from=builder /app/infra/migrations /app/migrations

# Install migrate tool
RUN apk add --no-cache curl
RUN curl -L https://github.com/golang-migrate/migrate/releases/download/v4.15.2/migrate.linux-amd64.tar.gz | tar xz -C /usr/local/bin

WORKDIR /app

# Run migrations then start server
CMD ["sh", "-c", "migrate -path /app/migrations -database $DATABASE_URL up && ./auth"]
```

---

## Task: Health Checks & Monitoring

### Health Check Endpoint

The auth service should implement:

```go
// services/auth/internal/handler/health.go
func (h *AuthHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
    health := map[string]interface{}{
        "status": "ok",
        "timestamp": time.Now(),
        "database": h.checkDatabaseHealth(r.Context()),
        "redis": h.checkRedisHealth(r.Context()),
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(health)
}
```

Endpoint: `GET /health`

---

## Testing Checklist

- [ ] Docker Compose starts all services without errors
- [ ] PostgreSQL is accessible on port 5432
- [ ] Redis is accessible on port 6379
- [ ] Auth service connects to PostgreSQL successfully
- [ ] Migrations run automatically on service startup
- [ ] Environment variables load from .env.local
- [ ] CI/CD pipeline runs tests on PRs
- [ ] Docker images build successfully
- [ ] Health check endpoint responds correctly
