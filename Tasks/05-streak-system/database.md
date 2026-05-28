# Feature 05: Streak System — Database Tasks

**Owner:** Database Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 1 database task  
**Tech Stack:** PostgreSQL 15+  

---

## Task 5.6: Create `streaks` Table

### Description
Track user streaks with current, longest, and activity history.

### SQL Schema

```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Streak data
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_days_active INTEGER NOT NULL DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_streaks_user_id ON streaks(user_id);
CREATE INDEX idx_streaks_current ON streaks(current_streak DESC);
CREATE INDEX idx_streaks_longest ON streaks(longest_streak DESC);
```

### Migration File

**File:** `infra/migrations/007_create_streaks_table.up.sql`

```sql
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_days_active INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_current ON streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_streaks_longest ON streaks(longest_streak DESC);
```

**File:** `infra/migrations/007_create_streaks_table.down.sql`

```sql
DROP TABLE IF EXISTS streaks;
```

