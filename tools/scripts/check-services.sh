#!/usr/bin/env bash
# Simple health-check script for local service stubs.
# Exits non-zero if any check fails.
set -euo pipefail

echo "Checking services..."

check() {
  local name=$1
  local url=$2
  echo -n "- $name: "
  if curl -fsS "$url" >/dev/null 2>&1; then
    echo "OK ($url)"
  else
    echo "FAILED ($url)"
    return 1
  fi
}

# Service endpoints (adjust if you run services on different ports)
check "leaderboard" "http://localhost:8080/healthz" || check "leaderboard-root" "http://localhost:8080/"
check "auth" "http://localhost:8081/health" || check "auth-root" "http://localhost:8081/"
check "content" "http://localhost:8082/health" || check "content-paths" "http://localhost:8082/paths"
check "gamification" "http://localhost:8083/healthz" || check "gamification-root" "http://localhost:8083/"
check "spaced-repetition" "http://localhost:8084/healthz" || check "spaced-root" "http://localhost:8084/"

echo "All checks passed."
