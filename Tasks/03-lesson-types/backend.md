# Feature 03: Lesson Types — Backend Tasks

**Owner:** Backend Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 4 backend tasks  
**Tech Stack:** Go 1.20+, Chi router, PostgreSQL, error handling  

---

## Task 3.5: POST /lessons Endpoint (Create Lesson)

### Description
Implement lesson creation endpoint with support for all question types. Validate using Zod schemas converted to Go validators.

### Endpoint Specification

```
POST /lessons
Content-Type: application/json
Authorization: Bearer {accessToken}

Request Body:
{
  "courseId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Introduction to Arrays",
  "description": "Learn array fundamentals",
  "type": "MULTIPLE_CHOICE",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "question": "What is an array?",
      "difficulty": "easy",
      "points": 10,
      "options": [
        { "text": "A collection of elements", "isCorrect": true },
        { "text": "A single value", "isCorrect": false }
      ],
      "singleSelect": true
    }
  ],
  "status": "draft"
}

Response (201 Created):
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "courseId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Introduction to Arrays",
  "description": "Learn array fundamentals",
  "type": "MULTIPLE_CHOICE",
  "questions": [...],
  "status": "draft",
  "createdAt": "2026-05-29T10:00:00Z",
  "updatedAt": "2026-05-29T10:00:00Z"
}

Error Responses:
- 400 Bad Request: Invalid question format
- 401 Unauthorized: Missing/invalid token
- 403 Forbidden: Not authorized to create lessons
- 422 Unprocessable Entity: Validation error
```

### Implementation

**File:** `services/content/internal/handler/lesson_handler.go`

```go
package handler

import (
	"encoding/json"
	"net/http"
	"services/content/internal/models"
	"services/content/internal/usecase"
	"services/content/internal/validation"
)

type LessonHandler struct {
	lessonUsecase usecase.LessonUsecase
}

func NewLessonHandler(lessonUsecase usecase.LessonUsecase) *LessonHandler {
	return &LessonHandler{
		lessonUsecase: lessonUsecase,
	}
}

func (h *LessonHandler) CreateLesson(w http.ResponseWriter, r *http.Request) {
	var req models.CreateLessonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if errs := validation.ValidateLessonRequest(&req); len(errs) > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"errors": errs,
		})
		return
	}

	// Extract user from context
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Create lesson
	lesson, err := h.lessonUsecase.CreateLesson(r.Context(), userID, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(lesson)
}
```

**File:** `services/content/internal/usecase/lesson_usecase.go`

```go
package usecase

import (
	"context"
	"fmt"
	"services/content/internal/models"
	"services/content/internal/repository"
)

type LessonUsecase interface {
	CreateLesson(ctx context.Context, userID string, req *models.CreateLessonRequest) (*models.Lesson, error)
	GetLesson(ctx context.Context, lessonID string) (*models.Lesson, error)
}

type lessonUsecaseImpl struct {
	lessonRepo repository.LessonRepository
}

func NewLessonUsecase(lessonRepo repository.LessonRepository) LessonUsecase {
	return &lessonUsecaseImpl{
		lessonRepo: lessonRepo,
	}
}

func (u *lessonUsecaseImpl) CreateLesson(
	ctx context.Context,
	userID string,
	req *models.CreateLessonRequest,
) (*models.Lesson, error) {
	// Validate course ownership (if needed)
	// TODO: Check user can create lessons in this course

	// Create lesson domain model
	lesson := &models.Lesson{
		ID:          generateUUID(),
		CourseID:    req.CourseID,
		Title:       req.Title,
		Description: req.Description,
		Type:        req.Type,
		Questions:   req.Questions,
		Status:      "draft",
	}

	// Persist to database
	if err := u.lessonRepo.CreateLesson(ctx, lesson); err != nil {
		return nil, fmt.Errorf("failed to create lesson: %w", err)
	}

	return lesson, nil
}

func (u *lessonUsecaseImpl) GetLesson(
	ctx context.Context,
	lessonID string,
) (*models.Lesson, error) {
	lesson, err := u.lessonRepo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, fmt.Errorf("failed to get lesson: %w", err)
	}
	return lesson, nil
}
```

**File:** `services/content/internal/validation/lesson_validation.go`

```go
package validation

import (
	"fmt"
	"services/content/internal/models"
)

func ValidateLessonRequest(req *models.CreateLessonRequest) []string {
	var errors []string

	if req.Title == "" || len(req.Title) < 3 {
		errors = append(errors, "title must be at least 3 characters")
	}

	if req.Description == "" || len(req.Description) < 10 {
		errors = append(errors, "description must be at least 10 characters")
	}

	if len(req.Questions) == 0 {
		errors = append(errors, "lesson must have at least one question")
	}

	for i, q := range req.Questions {
		if err := ValidateQuestion(q, i); err != nil {
			errors = append(errors, err...)
		}
	}

	return errors
}

func ValidateQuestion(q models.LessonQuestion, index int) []string {
	var errors []string

	if q.Question == "" || len(q.Question) < 5 {
		errors = append(errors, fmt.Sprintf("question %d must be at least 5 characters", index+1))
	}

	switch q := q.(type) {
	case *models.MultipleChoiceQuestion:
		if len(q.Options) < 2 {
			errors = append(errors, fmt.Sprintf("question %d must have at least 2 options", index+1))
		}
		hasCorrect := false
		for _, opt := range q.Options {
			if opt.IsCorrect {
				hasCorrect = true
			}
		}
		if !hasCorrect {
			errors = append(errors, fmt.Sprintf("question %d must have at least one correct option", index+1))
		}
	case *models.FillInBlankQuestion:
		if len(q.Answers) == 0 {
			errors = append(errors, fmt.Sprintf("question %d must have at least one answer", index+1))
		}
	}

	return errors
}
```

### Testing Checklist
- [ ] Create endpoint accepts valid lesson payload
- [ ] Validation rejects invalid questions
- [ ] Lesson saved to database
- [ ] Response returns 201 with lesson data
- [ ] Authorization check works

---

## Task 3.6: GET /lessons/{id} & GET /lessons (List Lessons)

### Description
Implement lesson retrieval endpoints with caching and filtering.

### Implementation

**File:** `services/content/internal/handler/lesson_handler.go` (additions)

```go
func (h *LessonHandler) GetLesson(w http.ResponseWriter, r *http.Request) {
	lessonID := chi.URLParam(r, "id")

	lesson, err := h.lessonUsecase.GetLesson(r.Context(), lessonID)
	if err != nil {
		http.Error(w, "Lesson not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(lesson)
}

func (h *LessonHandler) ListLessons(w http.ResponseWriter, r *http.Request) {
	courseID := r.URL.Query().Get("courseId")
	if courseID == "" {
		http.Error(w, "courseId query param required", http.StatusBadRequest)
		return
	}

	lessons, err := h.lessonUsecase.ListLessonsByCourse(r.Context(), courseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"lessons": lessons,
		"count":   len(lessons),
	})
}
```

### Testing Checklist
- [ ] GET /lessons/{id} returns lesson with all questions
- [ ] GET /lessons?courseId=X returns all lessons for course
- [ ] 404 returned for non-existent lesson
- [ ] List endpoint filters by course correctly

---

## Task 3.7: Lesson Repository (Database Layer)

### Description
Implement repository functions for lesson CRUD operations.

### Implementation

**File:** `services/content/internal/repository/lesson_repo.go`

```go
package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"services/content/internal/models"
)

type LessonRepository interface {
	CreateLesson(ctx context.Context, lesson *models.Lesson) error
	GetLessonByID(ctx context.Context, id string) (*models.Lesson, error)
	ListLessonsByCourse(ctx context.Context, courseID string) ([]*models.Lesson, error)
}

type lessonRepoImpl struct {
	db *sql.DB
}

func NewLessonRepository(db *sql.DB) LessonRepository {
	return &lessonRepoImpl{db: db}
}

func (r *lessonRepoImpl) CreateLesson(ctx context.Context, lesson *models.Lesson) error {
	questionsJSON, err := json.Marshal(lesson.Questions)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO lessons (id, course_id, title, description, type, questions, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`

	err = r.db.QueryRowContext(ctx, query,
		lesson.ID,
		lesson.CourseID,
		lesson.Title,
		lesson.Description,
		lesson.Type,
		questionsJSON,
		lesson.Status,
		lesson.CreatedAt,
		lesson.UpdatedAt,
	).Scan(&lesson.ID, &lesson.CreatedAt, &lesson.UpdatedAt)

	return err
}

func (r *lessonRepoImpl) GetLessonByID(ctx context.Context, id string) (*models.Lesson, error) {
	query := `
		SELECT id, course_id, title, description, type, questions, status, created_at, updated_at
		FROM lessons
		WHERE id = $1 AND deleted_at IS NULL
	`

	var lesson models.Lesson
	var questionsJSON []byte

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&lesson.ID,
		&lesson.CourseID,
		&lesson.Title,
		&lesson.Description,
		&lesson.Type,
		&questionsJSON,
		&lesson.Status,
		&lesson.CreatedAt,
		&lesson.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(questionsJSON, &lesson.Questions); err != nil {
		return nil, err
	}

	return &lesson, nil
}

func (r *lessonRepoImpl) ListLessonsByCourse(ctx context.Context, courseID string) ([]*models.Lesson, error) {
	query := `
		SELECT id, course_id, title, description, type, questions, status, created_at, updated_at
		FROM lessons
		WHERE course_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lessons []*models.Lesson
	for rows.Next() {
		var lesson models.Lesson
		var questionsJSON []byte

		err := rows.Scan(
			&lesson.ID,
			&lesson.CourseID,
			&lesson.Title,
			&lesson.Description,
			&lesson.Type,
			&questionsJSON,
			&lesson.Status,
			&lesson.CreatedAt,
			&lesson.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(questionsJSON, &lesson.Questions); err != nil {
			return nil, err
		}

		lessons = append(lessons, &lesson)
	}

	return lessons, rows.Err()
}
```

### Testing Checklist
- [ ] CreateLesson saves to database correctly
- [ ] GetLessonByID retrieves with questions parsed
- [ ] ListLessonsByCourse returns all lessons for course
- [ ] Soft deletes respected in queries

---

## Task 3.8: PUT /lessons/{id} (Update Lesson)

### Description
Implement lesson update endpoint with validation and authorization.

### Implementation

**File:** `services/content/internal/handler/lesson_handler.go` (additions)

```go
func (h *LessonHandler) UpdateLesson(w http.ResponseWriter, r *http.Request) {
	lessonID := chi.URLParam(r, "id")

	var req models.UpdateLessonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	lesson, err := h.lessonUsecase.UpdateLesson(r.Context(), userID, lessonID, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(lesson)
}
```

### Testing Checklist
- [ ] Update endpoint accepts modified lesson data
- [ ] Authorization verified before update
- [ ] Validation applied to updated questions
- [ ] Updated_at timestamp changes
- [ ] Response returns updated lesson

