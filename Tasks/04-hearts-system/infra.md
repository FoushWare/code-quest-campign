# Feature 04: Hearts System — Infrastructure Tasks

**Owner:** DevOps/Infra Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 2 infrastructure tasks  
**Tech Stack:** Docker, PostgreSQL, Cron jobs  

---

## Task 4.11: Add User Service & Cron Job to Docker Compose

### Description
Update Docker Compose to include user service with background hearts reset job.

### Implementation

**File:** `infra/docker-compose.yml` (additions)

```yaml
services:
  user_service:
    build:
      context: ./services/user
      dockerfile: Dockerfile
    container_name: code_quest_user
    environment:
      DATABASE_URL: postgres://localdev:localdev_pass@postgres:5432/code_quest?sslmode=disable
      PORT: 8083
      HEARTS_RESET_HOUR: 6  # UTC hour to reset hearts daily
    ports:
      - "8083:8083"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - code_quest
    volumes:
      - ./services/user:/app
    command: go run ./cmd/main.go
```

### Commands

**Start user service:**
```bash
docker-compose up user_service -d
```

---

## Task 4.12: GitHub Actions: User Service Tests

### Description
CI pipeline for user service including hearts reset job tests.

### Implementation

**File:** `.github/workflows/user-service-ci.yml`

```yaml
name: User Service CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/user/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'services/user/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: code_quest_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.20'
      
      - name: Run migrations
        working-directory: services/user
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/code_quest_test?sslmode=disable
        run: |
          for migration in ../../infra/migrations/*.up.sql; do
            psql $DATABASE_URL -f "$migration"
          done
      
      - name: Run tests
        working-directory: services/user
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/code_quest_test?sslmode=disable
        run: go test -v -race -coverprofile=coverage.out ./...
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./services/user/coverage.out
          flags: user-service
```

