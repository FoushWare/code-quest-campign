# Feature 02: Learning Path Map — Database Tasks

## Overview
Feature 02 database breaks down into 2 tasks: creating path templates and tracking user progress.

---

## Task 2.3.1: CREATE TABLE paths and path_lessons

### Description
Design and migrate PostgreSQL tables for learning path templates and lesson associations.

### SQL Schema

```sql
-- infra/migrations/002_create_paths_table.up.sql

-- Path templates table
CREATE TABLE IF NOT EXISTS path_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  estimated_hours DECIMAL(5,2) NOT NULL,
  daily_minutes INT NOT NULL DEFAULT 30,
  topics TEXT[] NOT NULL DEFAULT '{}',
  prerequisites UUID[] DEFAULT '{}',
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_path_templates_difficulty ON path_templates(difficulty);
CREATE INDEX idx_path_templates_topics ON path_templates USING GIN(topics);
CREATE INDEX idx_path_templates_is_published ON path_templates(is_published);
CREATE INDEX idx_path_templates_created_at ON path_templates(created_at DESC);

-- Path lessons (lessons within a path)
CREATE TABLE IF NOT EXISTS path_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES path_templates(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(path_id, lesson_id),
  UNIQUE(path_id, order_index)
);

CREATE INDEX idx_path_lessons_path_id ON path_lessons(path_id);
CREATE INDEX idx_path_lessons_lesson_id ON path_lessons(lesson_id);

-- User path progress tracking
CREATE TABLE IF NOT EXISTS user_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES path_templates(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  progress_percent INT DEFAULT 0,
  hours_spent DECIMAL(6,2) DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE(user_id, path_id)
);

CREATE INDEX idx_user_path_progress_user_id ON user_path_progress(user_id);
CREATE INDEX idx_user_path_progress_path_id ON user_path_progress(path_id);
CREATE INDEX idx_user_path_progress_completed_at ON user_path_progress(completed_at);

-- User lesson completion within path
CREATE TABLE IF NOT EXISTS user_path_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES path_templates(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP NULL,
  attempts INT DEFAULT 0,
  best_score INT DEFAULT 0,
  time_spent_minutes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, path_id, lesson_id)
);

CREATE INDEX idx_user_path_lesson_progress_user_id ON user_path_lesson_progress(user_id);
CREATE INDEX idx_user_path_lesson_progress_path_id ON user_path_lesson_progress(path_id);
CREATE INDEX idx_user_path_lesson_progress_completed_at ON user_path_lesson_progress(completed_at);
```

### Down Migration

```sql
-- infra/migrations/002_create_paths_table.down.sql
DROP INDEX IF EXISTS idx_user_path_lesson_progress_completed_at;
DROP INDEX IF EXISTS idx_user_path_lesson_progress_path_id;
DROP INDEX IF EXISTS idx_user_path_lesson_progress_user_id;
DROP TABLE IF EXISTS user_path_lesson_progress;

DROP INDEX IF EXISTS idx_user_path_progress_completed_at;
DROP INDEX IF EXISTS idx_user_path_progress_path_id;
DROP INDEX IF EXISTS idx_user_path_progress_user_id;
DROP TABLE IF EXISTS user_path_progress;

DROP INDEX IF EXISTS idx_path_lessons_lesson_id;
DROP INDEX IF EXISTS idx_path_lessons_path_id;
DROP TABLE IF EXISTS path_lessons;

DROP INDEX IF EXISTS idx_path_templates_created_at;
DROP INDEX IF EXISTS idx_path_templates_is_published;
DROP INDEX IF EXISTS idx_path_templates_topics;
DROP INDEX IF EXISTS idx_path_templates_difficulty;
DROP TABLE IF EXISTS path_templates;
```

### Repository Functions (Go)

```go
// services/content/internal/repository/path_repository.go
package repository

import (
	"context"
	"database/sql"
	"strings"
	"code-quest/shared-types/go/types"
)

type PathRepository interface {
	GetPaths(ctx context.Context, filters PathFilters) ([]types.PathTemplate, int, error)
	GetPathByID(ctx context.Context, pathID string) (*types.PathTemplate, error)
	CreatePath(ctx context.Context, path *types.PathTemplate) (string, error)
	UpdatePath(ctx context.Context, path *types.PathTemplate) error
}

type PathFilters struct {
	Difficulty string
	Topics     []string
	Search     string
	Page       int
	Limit      int
}

type pathRepository struct {
	db *sql.DB
}

func (pr *pathRepository) GetPaths(ctx context.Context, filters PathFilters) ([]types.PathTemplate, int, error) {
	query := `SELECT id, name, description, difficulty, estimated_hours, daily_minutes, topics, prerequisites, is_published, created_at FROM path_templates WHERE deleted_at IS NULL AND is_published = true`
	args := []interface{}{}
	argIndex := 1

	if filters.Difficulty != "" {
		query += ` AND difficulty = $` + strconv.Itoa(argIndex)
		args = append(args, filters.Difficulty)
		argIndex++
	}

	if len(filters.Topics) > 0 {
		query += ` AND topics && $` + strconv.Itoa(argIndex)
		args = append(args, pq.Array(filters.Topics))
		argIndex++
	}

	if filters.Search != "" {
		query += ` AND (name ILIKE $` + strconv.Itoa(argIndex) + ` OR description ILIKE $` + strconv.Itoa(argIndex) + `)`
		args = append(args, "%"+filters.Search+"%")
		argIndex++
	}

	// Get total count
	countQuery := strings.Replace(query, "SELECT id, name, description, difficulty, estimated_hours, daily_minutes, topics, prerequisites, is_published, created_at", "SELECT COUNT(*)", 1)
	var total int
	if err := pr.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Add pagination and sorting
	query += ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(argIndex) + ` OFFSET $` + strconv.Itoa(argIndex+1)
	args = append(args, filters.Limit, (filters.Page-1)*filters.Limit)

	rows, err := pr.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	paths := make([]types.PathTemplate, 0)
	for rows.Next() {
		var path types.PathTemplate
		if err := rows.Scan(
			&path.ID, &path.Name, &path.Description, &path.Difficulty,
			&path.EstimatedHours, &path.DailyMinutes, pq.Array(&path.Topics),
			pq.Array(&path.Prerequisites), &path.IsPublished, &path.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		paths = append(paths, path)
	}

	return paths, total, rows.Err()
}

func (pr *pathRepository) GetPathByID(ctx context.Context, pathID string) (*types.PathTemplate, error) {
	query := `
		SELECT pt.id, pt.name, pt.description, pt.difficulty, pt.estimated_hours, 
		       pt.daily_minutes, pt.topics, pt.prerequisites, pt.is_published, pt.created_at,
		       ARRAY_AGG(JSONB_BUILD_OBJECT(
		           'id', l.id, 'name', l.name, 'estimatedMinutes', l.estimated_minutes
		       ) ORDER BY pl.order_index) as lessons
		FROM path_templates pt
		LEFT JOIN path_lessons pl ON pt.id = pl.path_id
		LEFT JOIN lessons l ON pl.lesson_id = l.id
		WHERE pt.id = $1 AND pt.deleted_at IS NULL
		GROUP BY pt.id
	`

	var path types.PathTemplate
	var lessonsJSON []byte
	
	if err := pr.db.QueryRowContext(ctx, query, pathID).Scan(
		&path.ID, &path.Name, &path.Description, &path.Difficulty,
		&path.EstimatedHours, &path.DailyMinutes, pq.Array(&path.Topics),
		pq.Array(&path.Prerequisites), &path.IsPublished, &path.CreatedAt, &lessonsJSON,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	// Parse lessons JSON
	if err := json.Unmarshal(lessonsJSON, &path.Lessons); err != nil {
		return nil, err
	}

	return &path, nil
}

// ProgressRepository for user path progress
type ProgressRepository interface {
	GetPathProgress(ctx context.Context, userID string, pathID string) (*types.PathProgress, error)
	StartPath(ctx context.Context, userID string, pathID string) (*types.PathProgress, error)
	UpdatePathProgress(ctx context.Context, progress *types.PathProgress) error
	CompleteLesson(ctx context.Context, userID string, pathID string, lessonID string, score int) error
}

type progressRepository struct {
	db *sql.DB
}

func (pr *progressRepository) GetPathProgress(ctx context.Context, userID string, pathID string) (*types.PathProgress, error) {
	query := `
		SELECT upp.id, upp.user_id, upp.path_id, upp.progress_percent, upp.hours_spent, upp.completed_at,
		       COUNT(CASE WHEN uplp.completed_at IS NOT NULL THEN 1 END)::int as completed_lessons,
		       COUNT(pl.id)::int as total_lessons,
		       ARRAY_AGG(DISTINCT uplp.lesson_id) FILTER (WHERE uplp.completed_at IS NOT NULL) as completed_lesson_ids
		FROM user_path_progress upp
		LEFT JOIN path_lessons pl ON upp.path_id = pl.path_id
		LEFT JOIN user_path_lesson_progress uplp ON upp.user_id = uplp.user_id AND pl.lesson_id = uplp.lesson_id
		WHERE upp.user_id = $1 AND upp.path_id = $2 AND upp.deleted_at IS NULL
		GROUP BY upp.id, upp.user_id, upp.path_id, upp.progress_percent, upp.hours_spent, upp.completed_at
	`

	var progress types.PathProgress
	if err := pr.db.QueryRowContext(ctx, query, userID, pathID).Scan(
		&progress.ID, &progress.UserID, &progress.PathID, &progress.ProgressPercent, &progress.HoursSpent,
		&progress.CompletedAt, &progress.CompletedLessons, &progress.TotalLessons,
		pq.Array(&progress.CompletedLessonIDs),
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &progress, nil
}

func (pr *progressRepository) StartPath(ctx context.Context, userID string, pathID string) (*types.PathProgress, error) {
	// Upsert: if already started, return existing; otherwise create
	query := `
		INSERT INTO user_path_progress (user_id, path_id, started_at, last_accessed_at)
		VALUES ($1, $2, NOW(), NOW())
		ON CONFLICT(user_id, path_id) DO UPDATE SET last_accessed_at = NOW()
		RETURNING id, user_id, path_id, 0, 0, NULL, NOW()
	`

	var progress types.PathProgress
	if err := pr.db.QueryRowContext(ctx, query, userID, pathID).Scan(
		&progress.ID, &progress.UserID, &progress.PathID, &progress.ProgressPercent,
		&progress.HoursSpent, &progress.CompletedAt, &progress.StartedAt,
	); err != nil {
		return nil, err
	}

	return &progress, nil
}

func (pr *progressRepository) CompleteLesson(ctx context.Context, userID string, pathID string, lessonID string, score int) error {
	query := `
		INSERT INTO user_path_lesson_progress (user_id, path_id, lesson_id, completed_at, best_score)
		VALUES ($1, $2, $3, NOW(), $4)
		ON CONFLICT(user_id, path_id, lesson_id) DO UPDATE SET best_score = GREATEST(best_score, EXCLUDED.best_score)
	`

	if _, err := pr.db.ExecContext(ctx, query, userID, pathID, lessonID, score); err != nil {
		return err
	}

	// Update path progress percentage
	updateQuery := `
		UPDATE user_path_progress SET
			progress_percent = (
				SELECT COUNT(CASE WHEN uplp.completed_at IS NOT NULL THEN 1 END)::numeric / COUNT(pl.id) * 100
				FROM path_lessons pl
				LEFT JOIN user_path_lesson_progress uplp ON pl.lesson_id = uplp.lesson_id AND uplp.user_id = $1
				WHERE pl.path_id = $2
			),
			last_accessed_at = NOW()
		WHERE user_id = $1 AND path_id = $2
	`

	_, err := pr.db.ExecContext(ctx, updateQuery, userID, pathID)
	return err
}
```

### Testing Checklist
- ✅ Path templates table created with proper constraints
- ✅ Path lessons junction table created with order integrity
- ✅ User progress tables created with correct indexes
- ✅ Indexes improve query performance for common filters
- ✅ Migrations are reversible (down migration works)
- ✅ Repository functions handle NULL values correctly
- ✅ Aggregation queries return accurate counts

---

## Task 2.3.2: CREATE TABLE path_templates seed data

### Description
Insert seed learning paths into database with standard difficulty levels and topics.

### SQL Seed Data

```sql
-- infra/seeds/002_path_templates.sql

INSERT INTO path_templates (name, description, difficulty, estimated_hours, daily_minutes, topics, is_published) VALUES
-- Beginner Paths
('React Fundamentals', 'Learn React hooks, components, and state management', 'Beginner', 10.0, 45, '{"React", "JavaScript", "Web"}', true),
('JavaScript Basics', 'ES6+, async/await, and functional programming', 'Beginner', 12.0, 50, '{"JavaScript", "Web"}', true),
('HTML & CSS Mastery', 'Semantic HTML5 and modern CSS techniques', 'Beginner', 8.0, 40, '{"HTML", "CSS", "Web"}', true),

-- Intermediate Paths
('Vue.js Essentials', 'Vue 3 composition API and component patterns', 'Intermediate', 15.0, 60, '{"Vue", "JavaScript", "Web"}', true),
('TypeScript Deep Dive', 'Advanced TypeScript patterns and generics', 'Intermediate', 14.0, 55, '{"TypeScript", "JavaScript"}', true),
('REST API Design', 'Building scalable REST APIs with Node.js', 'Intermediate', 16.0, 60, '{"Backend", "API", "Node.js"}', true),

-- Advanced Paths
('Advanced React Patterns', 'Custom hooks, code splitting, performance optimization', 'Advanced', 20.0, 75, '{"React", "JavaScript", "Performance"}', true),
('System Design Fundamentals', 'Scalability, database design, caching strategies', 'Advanced', 24.0, 90, '{"System Design", "Architecture"}', true),
('GraphQL & Apollo', 'Building efficient GraphQL APIs', 'Advanced', 18.0, 70, '{"GraphQL", "Backend", "API"}', true)
ON CONFLICT DO NOTHING;
```

### Testing Checklist
- ✅ Seed data inserts without errors
- ✅ All paths have valid difficulty levels
- ✅ Topics array populated with 2-3 tags per path
- ✅ Estimated hours reasonable for difficulty level
- ✅ Path names are unique
- ✅ is_published flag set to true for discovery

---

## Summary

Feature 02 database includes 2 interconnected tasks:
1. **Path Templates Schema** - Creates path templates, lessons, and progress tracking tables
2. **Seed Data** - Populates database with 9 learning paths across 3 difficulty levels

**Total Database Tasks: 2**
**Estimated Effort: 15 hours**
**Dependencies: Feature 01 schema (users table)**
