# Feature 05: Streak System — Infrastructure Tasks

**Owner:** DevOps/Infra Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 1 infrastructure task  

---

## Task 5.7: Add Streak Service to Docker Compose

### Description
Update Docker Compose to include streak functionality in user service.

### Implementation

**File:** `infra/docker-compose.yml` (already includes user_service)

The user service already handles streaks. No additional service needed.

**Environment variables to verify:**

```bash
# Ensure these are set in docker-compose.yml
- STREAK_ENABLED=true
- STREAK_CHECK_INTERVAL=60000  # milliseconds
```

