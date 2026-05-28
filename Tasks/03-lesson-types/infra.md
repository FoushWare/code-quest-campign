# Feature 03: Lesson Types — Infrastructure Tasks

**Owner:** DevOps/Infra Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 2-3 infrastructure tasks  
**Tech Stack:** Docker, PostgreSQL, GitHub Actions  

---

## Task 3.11: Update docker-compose.yml with Lesson Service

### Description
Update Docker Compose to include lesson migrations and ensure PostgreSQL is ready.

### Implementation

**File:** `infra/docker-compose.yml` (additions/updates)

```yaml
services:
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
      - ./infra/migrations:/docker-entrypoint-initdb.d
      - ./infra/init.sql:/docker-entrypoint-initdb.d/00-init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U localdev"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - code_quest

  # Content Service (Go) — handles lessons
  content_service:
    build:
      context: ./services/content
      dockerfile: Dockerfile
    container_name: code_quest_content
    environment:
      DATABASE_URL: postgres://localdev:localdev_pass@postgres:5432/code_quest?sslmode=disable
      PORT: 8082
    ports:
      - "8082:8082"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - code_quest
    volumes:
      - ./services/content:/app
    command: go run ./cmd/main.go
```

### Commands

**Run migrations:**
```bash
cd infra
docker-compose up postgres -d
# Wait for PostgreSQL to be ready
docker-compose exec postgres psql -U localdev -d code_quest -f /docker-entrypoint-initdb.d/001_create_users_table.up.sql
```

**Start all services:**
```bash
docker-compose up -d
```

---

## Task 3.12: GitHub Actions CI Pipeline for Lesson Service

### Description
Add CI pipeline that runs Go tests and validates migrations for content service.

### Implementation

**File:** `.github/workflows/content-service-ci.yml`

```yaml
name: Content Service CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/content/**'
      - 'infra/migrations/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'services/content/**'
      - 'infra/migrations/**'

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
      
      - name: Cache Go modules
        uses: actions/cache@v3
        with:
          path: ~/go/pkg/mod
          key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
          restore-keys: |
            ${{ runner.os }}-go-
      
      - name: Run migrations
        working-directory: services/content
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/code_quest_test?sslmode=disable
        run: |
          # Run migration scripts (using migrate tool or custom script)
          for migration in ../../infra/migrations/*.up.sql; do
            psql $DATABASE_URL -f "$migration"
          done
      
      - name: Run tests
        working-directory: services/content
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/code_quest_test?sslmode=disable
        run: go test -v -race -coverprofile=coverage.out ./...
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./services/content/coverage.out
          flags: content-service
      
      - name: Build Docker image
        run: docker build -t content-service:${{ github.sha }} ./services/content
```

### Testing Checklist
- [ ] Go tests pass with PostgreSQL
- [ ] Migrations run successfully
- [ ] Docker image builds without errors
- [ ] Coverage reports upload to Codecov

