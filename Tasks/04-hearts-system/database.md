# Feature 04: Hearts System — Database Tasks

**Owner:** Database Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 2 database tasks  
**Tech Stack:** PostgreSQL 15+, scheduled triggers  

---

## Task 4.9: Create `hearts_status` Table

### Description
Track current hearts, resets, and recovery for each user.

### SQL Schema

```sql
CREATE TABLE hearts_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Hearts tracking
  current_hearts INTEGER NOT NULL DEFAULT 5,
  max_hearts INTEGER NOT NULL DEFAULT 5,
  
  -- Reset timing
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  next_reset_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_hearts_status_user_id ON hearts_status(user_id);
CREATE INDEX idx_hearts_status_next_reset ON hearts_status(next_reset_at);

-- Check constraint
ALTER TABLE hearts_status ADD CONSTRAINT ck_hearts_positive 
  CHECK (current_hearts >= 0 AND current_hearts <= max_hearts);
```

### Migration File

**File:** `infra/migrations/005_create_hearts_status_table.up.sql`

```sql
CREATE TABLE IF NOT EXISTS hearts_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_hearts INTEGER NOT NULL DEFAULT 5,
  max_hearts INTEGER NOT NULL DEFAULT 5,
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  next_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hearts_status_user_id ON hearts_status(user_id);
CREATE INDEX IF NOT EXISTS idx_hearts_status_next_reset ON hearts_status(next_reset_at);

ALTER TABLE hearts_status ADD CONSTRAINT ck_hearts_positive 
  CHECK (current_hearts >= 0 AND current_hearts <= max_hearts);
```

**File:** `infra/migrations/005_create_hearts_status_table.down.sql`

```sql
DROP TABLE IF EXISTS hearts_status;
```

---

## Task 4.10: Create `hearts_events` Table

### Description
Track all hearts-related events (damage, recovery, resets).

### SQL Schema

```sql
CREATE TABLE hearts_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID,  -- NULL for non-quest events
  
  -- Event details
  event_type VARCHAR(50) NOT NULL,  -- damage, recovery, reset, gem_recovery
  amount INTEGER NOT NULL,  -- Damage/recovery amount
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_hearts_events_user_id ON hearts_events(user_id);
CREATE INDEX idx_hearts_events_type ON hearts_events(event_type);
CREATE INDEX idx_hearts_events_created ON hearts_events(created_at DESC);

-- Partition by month for large data
CREATE TABLE hearts_events_2026_05 PARTITION OF hearts_events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```

### Migration File

**File:** `infra/migrations/006_create_hearts_events_table.up.sql`

```sql
CREATE TABLE IF NOT EXISTS hearts_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID,
  event_type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hearts_events_user_id ON hearts_events(user_id);
CREATE INDEX IF NOT EXISTS idx_hearts_events_type ON hearts_events(event_type);
CREATE INDEX IF NOT EXISTS idx_hearts_events_created ON hearts_events(created_at DESC);
```

**File:** `infra/migrations/006_create_hearts_events_table.down.sql`

```sql
DROP TABLE IF EXISTS hearts_events;
```

