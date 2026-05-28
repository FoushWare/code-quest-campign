# Feature 03: Lesson Types — Database Tasks

**Owner:** Database Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 2 database tasks  
**Tech Stack:** PostgreSQL 15+, JSON storage, migrations  

---

## Task 3.9: Create `lessons` Table

### Description
Schema for storing lessons with different question types using JSONB for flexible question storage.

### SQL Schema

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Lesson metadata
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,  -- MULTIPLE_CHOICE, TRUE_FALSE, etc.
  
  -- Questions stored as JSONB for flexibility
  questions JSONB NOT NULL DEFAULT '[]',
  
  -- Status & metadata
  status VARCHAR(50) DEFAULT 'draft',  -- draft, published
  order_index INTEGER,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_lessons_course_id ON lessons(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_status ON lessons(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_created_by ON lessons(created_by_user_id);
CREATE INDEX idx_lessons_type ON lessons(type);

-- Check constraint for valid status
ALTER TABLE lessons ADD CONSTRAINT ck_lessons_status 
  CHECK (status IN ('draft', 'published'));
```

### Migration File

**File:** `infra/migrations/003_create_lessons_table.up.sql`

```sql
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'draft',
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_id 
  ON lessons(course_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_status 
  ON lessons(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_created_by 
  ON lessons(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_lessons_type 
  ON lessons(type);

ALTER TABLE lessons ADD CONSTRAINT ck_lessons_status 
  CHECK (status IN ('draft', 'published'));
```

**File:** `infra/migrations/003_create_lessons_table.down.sql`

```sql
DROP TABLE IF EXISTS lessons;
```

### Key Design Decisions

1. **JSONB for Questions** — Allows flexible storage of different question types without schema changes
2. **Type Field** — Index by type for efficient filtering
3. **Status Enum** — Draft/Published for workflow control
4. **Order Index** — Determine lesson sequence in course
5. **Created By** — Track lesson author for attribution
6. **Soft Deletes** — Safe data recovery without deletion

---

## Task 3.10: Create `lesson_attempts` Table

### Description
Track student attempts at lessons with answers and scores.

### SQL Schema

```sql
CREATE TABLE lesson_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  
  -- Attempt data
  answers JSONB NOT NULL,  -- Store all user answers
  score INTEGER,  -- Calculated score 0-100
  max_score INTEGER NOT NULL,  -- Total possible points
  correct_count INTEGER,
  total_count INTEGER,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'in_progress',  -- in_progress, completed, abandoned
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_lesson_attempts_user_id ON lesson_attempts(user_id);
CREATE INDEX idx_lesson_attempts_lesson_id ON lesson_attempts(lesson_id);
CREATE INDEX idx_lesson_attempts_user_lesson ON lesson_attempts(user_id, lesson_id);
CREATE INDEX idx_lesson_attempts_status ON lesson_attempts(status);
CREATE INDEX idx_lesson_attempts_completed ON lesson_attempts(completed_at) WHERE completed_at IS NOT NULL;
```

### Migration File

**File:** `infra/migrations/004_create_lesson_attempts_table.up.sql`

```sql
CREATE TABLE IF NOT EXISTS lesson_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER,
  max_score INTEGER NOT NULL,
  correct_count INTEGER,
  total_count INTEGER,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status VARCHAR(50) DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user_id ON lesson_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_lesson_id ON lesson_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user_lesson ON lesson_attempts(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_status ON lesson_attempts(status);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_completed 
  ON lesson_attempts(completed_at) WHERE completed_at IS NOT NULL;
```

**File:** `infra/migrations/004_create_lesson_attempts_table.down.sql`

```sql
DROP TABLE IF EXISTS lesson_attempts;
```

### Key Design Decisions

1. **JSONB Answers** — Store all question-answer pairs flexibly
2. **Score Tracking** — Track raw score and percentage
3. **Status Field** — Differentiate between in-progress and completed
4. **Duration** — Track time spent for analytics
5. **Composite Index** — user_id + lesson_id for quick user progress queries

