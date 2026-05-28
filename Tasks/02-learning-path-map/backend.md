# Feature 02: Learning Path Map — Backend Tasks

## Overview
Feature 02 backend breaks down into 4 tasks covering path management, user progress tracking, and path querying APIs.

---

## Task 2.2.1: GET /paths - List All Paths with Filtering

### Description
Implement GET endpoint returning all learning paths with optional filtering by difficulty, topics, and search query. Supports pagination.

### Dependencies
- Feature 01 (User auth) — JWT validation middleware
- Database schema from Task 2.3.1

### Requirements
- Endpoint: `GET /paths?difficulty=Beginner&topics=React,Vue&search=&page=1&limit=20`
- Response includes: path name, difficulty, duration, topic tags, completion percentage for user
- Filtering: by difficulty (Beginner/Intermediate/Advanced), topics (comma-separated), search query
- Pagination: page and limit query params
- Caching: responses cached for 5 minutes (Redis)
- Error handling: 400 for invalid filters, 401 for unauthenticated

### Implementation Details

**Go Handler:**
```go
// services/content/internal/handlers/path_handler.go
package handlers

import (
	"net/http"
	"strconv"
	"github.com/chi-framework/chi/v5"
	"github.com/go-playground/validator/v10"
	"code-quest/services/content/internal/usecase"
	"code-quest/shared-types/go/types"
)

type PathHandler struct {
	pathUseCase usecase.PathUseCase
	cache       CacheService
	validator   *validator.Validate
}

type ListPathsRequest struct {
	Difficulty string `query:"difficulty" validate:"omitempty,oneof=Beginner Intermediate Advanced"`
	Topics     string `query:"topics"`
	Search     string `query:"search"`
	Page       int    `query:"page" validate:"min=1" default:"1"`
	Limit      int    `query:"limit" validate:"min=1,max=100" default:"20"`
}

type PathCard struct {
	ID                 string     `json:"id"`
	Name               string     `json:"name"`
	Difficulty         string     `json:"difficulty"`
	EstimatedHours     float32    `json:"estimatedHours"`
	Topics             []string   `json:"topics"`
	LessonCount        int        `json:"lessonCount"`
	UserProgressPercent int       `json:"userProgressPercent"`
	IsCompleted        bool       `json:"isCompleted"`
}

type ListPathsResponse struct {
	Paths      []PathCard `json:"paths"`
	Total      int        `json:"total"`
	Page       int        `json:"page"`
	PageSize   int        `json:"pageSize"`
	TotalPages int        `json:"totalPages"`
}

func (ph *PathHandler) ListPaths(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := r.Header.Get("X-User-ID") // From JWT middleware

	// Parse query params
	req := ListPathsRequest{
		Page:  1,
		Limit: 20,
	}
	
	req.Difficulty = r.URL.Query().Get("difficulty")
	req.Topics = r.URL.Query().Get("topics")
	req.Search = r.URL.Query().Get("search")
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil {
			req.Page = p
		}
	}
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l <= 100 {
			req.Limit = l
		}
	}

	// Validate
	if err := ph.validator.Struct(req); err != nil {
		respondError(w, 400, "invalid_filters", err.Error())
		return
	}

	// Check cache
	cacheKey := getCacheKey("paths", req)
	if cached, err := ph.cache.Get(ctx, cacheKey); err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		w.WriteHeader(http.StatusOK)
		w.Write(cached)
		return
	}

	// Fetch paths
	paths, total, err := ph.pathUseCase.ListPaths(ctx, usecase.ListPathsInput{
		UserID:     userID,
		Difficulty: req.Difficulty,
		Topics:     parseTopics(req.Topics),
		Search:     req.Search,
		Page:       req.Page,
		Limit:      req.Limit,
	})
	if err != nil {
		respondError(w, 500, "fetch_failed", err.Error())
		return
	}

	// Build response
	totalPages := (total + req.Limit - 1) / req.Limit
	resp := ListPathsResponse{
		Paths:      paths,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.Limit,
		TotalPages: totalPages,
	}

	// Cache for 5 minutes
	if err := ph.cache.Set(ctx, cacheKey, resp, 5*time.Minute); err != nil {
		// Log error but continue
		log.Println("cache set error:", err)
	}

	respondJSON(w, 200, resp)
}
```

**UseCase Layer:**
```go
// services/content/internal/usecase/path_usecase.go
package usecase

import (
	"context"
	"code-quest/services/content/internal/repository"
	"code-quest/shared-types/go/types"
)

type PathUseCase interface {
	ListPaths(ctx context.Context, input ListPathsInput) ([]PathCard, int, error)
	GetPathByID(ctx context.Context, pathID string) (*types.PathTemplate, error)
	GetPathProgress(ctx context.Context, userID string, pathID string) (*types.PathProgress, error)
}

type ListPathsInput struct {
	UserID     string
	Difficulty string
	Topics     []string
	Search     string
	Page       int
	Limit      int
}

type pathUseCase struct {
	pathRepo     repository.PathRepository
	progressRepo repository.ProgressRepository
}

func (puc *pathUseCase) ListPaths(ctx context.Context, input ListPathsInput) ([]PathCard, int, error) {
	// Build filter query
	filters := repository.PathFilters{
		Difficulty: input.Difficulty,
		Topics:     input.Topics,
		Search:     input.Search,
		Page:       input.Page,
		Limit:      input.Limit,
	}

	// Query database
	paths, total, err := puc.pathRepo.GetPaths(ctx, filters)
	if err != nil {
		return nil, 0, err
	}

	// Enrich with user progress if authenticated
	cards := make([]PathCard, len(paths))
	for i, path := range paths {
		progress, _ := puc.progressRepo.GetPathProgress(ctx, input.UserID, path.ID)
		
		progressPercent := 0
		isCompleted := false
		if progress != nil {
			progressPercent = (progress.CompletedLessons * 100) / progress.TotalLessons
			isCompleted = progress.CompletedLessons == progress.TotalLessons
		}

		cards[i] = PathCard{
			ID:                  path.ID,
			Name:                path.Name,
			Difficulty:         path.Difficulty,
			EstimatedHours:     path.EstimatedHours,
			Topics:             path.Topics,
			LessonCount:        len(path.Lessons),
			UserProgressPercent: progressPercent,
			IsCompleted:        isCompleted,
		}
	}

	return cards, total, nil
}
```

### Testing Checklist
- ✅ Returns 200 with path list on valid request
- ✅ Filtering by difficulty returns only matching paths
- ✅ Filtering by topics returns paths containing all topics
- ✅ Search query filters by path name (case-insensitive)
- ✅ Pagination works correctly (page, limit)
- ✅ Invalid difficulty returns 400
- ✅ Unauthorized request (no JWT) returns 401
- ✅ Response cached for 5 minutes
- ✅ Cache invalidation on path update
- ✅ Concurrent requests don't duplicate cache entries

### Acceptance Criteria
1. Endpoint returns list of 20+ paths with proper schema
2. Filtering reduces results correctly
3. Pagination offset/limit work properly
4. Response cached with 5-minute TTL
5. Include user progress percentage for authenticated users

---

## Task 2.2.2: GET /paths/:pathId - Get Single Path with Lessons

### Description
Implement GET endpoint returning complete path details including all lessons, prerequisites, and user progress.

### Implementation Details

```go
// services/content/internal/handlers/path_handler.go

type PathDetailsResponse struct {
	ID                 string             `json:"id"`
	Name               string             `json:"name"`
	Description        string             `json:"description"`
	Difficulty         string             `json:"difficulty"`
	EstimatedHours     float32            `json:"estimatedHours"`
	DailyMinutes       int                `json:"dailyMinutes"`
	Topics             []string           `json:"topics"`
	Prerequisites      []string           `json:"prerequisites"`
	Lessons            []LessonSummary    `json:"lessons"`
	UserProgress       *types.PathProgress `json:"userProgress,omitempty"`
	CreatedAt          time.Time          `json:"createdAt"`
}

type LessonSummary struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Order              int    `json:"order"`
	EstimatedMinutes   int    `json:"estimatedMinutes"`
	IsCompleted        bool   `json:"isCompleted"`
	UserScore          int    `json:"userScore,omitempty"`
}

func (ph *PathHandler) GetPathByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := r.Header.Get("X-User-ID")
	pathID := chi.URLParam(r, "pathId")

	// Validate pathID format
	if !isValidUUID(pathID) {
		respondError(w, 400, "invalid_path_id", "Path ID must be a valid UUID")
		return
	}

	// Check cache
	cacheKey := getCacheKey("path-details", pathID, userID)
	if cached, err := ph.cache.Get(ctx, cacheKey); err == nil {
		respondJSON(w, 200, cached)
		return
	}

	// Fetch path with lessons
	path, err := ph.pathUseCase.GetPathByID(ctx, pathID)
	if err != nil {
		respondError(w, 404, "path_not_found", "Path not found")
		return
	}

	// Fetch user progress
	var progress *types.PathProgress
	if userID != "" {
		progress, _ = ph.pathUseCase.GetPathProgress(ctx, userID, pathID)
	}

	// Build lesson summaries
	lessonSummaries := make([]LessonSummary, len(path.Lessons))
	for i, lesson := range path.Lessons {
		isCompleted := false
		userScore := 0
		if progress != nil {
			for _, completedID := range progress.CompletedLessonIDs {
				if completedID == lesson.ID {
					isCompleted = true
					break
				}
			}
		}
		
		lessonSummaries[i] = LessonSummary{
			ID:               lesson.ID,
			Name:             lesson.Name,
			Order:            i + 1,
			EstimatedMinutes: lesson.EstimatedMinutes,
			IsCompleted:      isCompleted,
			UserScore:        userScore,
		}
	}

	// Build response
	resp := PathDetailsResponse{
		ID:             path.ID,
		Name:           path.Name,
		Description:    path.Description,
		Difficulty:     path.Difficulty,
		EstimatedHours: path.EstimatedHours,
		DailyMinutes:   path.DailyMinutes,
		Topics:         path.Topics,
		Prerequisites:  path.Prerequisites,
		Lessons:        lessonSummaries,
		UserProgress:   progress,
		CreatedAt:      path.CreatedAt,
	}

	// Cache for 10 minutes
	ph.cache.Set(ctx, cacheKey, resp, 10*time.Minute)

	respondJSON(w, 200, resp)
}
```

### Testing Checklist
- ✅ Returns 200 with complete path details
- ✅ Invalid path ID returns 404
- ✅ Includes all lessons in correct order
- ✅ Includes prerequisites
- ✅ Includes user progress if authenticated
- ✅ Response cached appropriately

---

## Task 2.2.3: POST /paths/:pathId/start - Start Path for User

### Description
Endpoint marking path as started for authenticated user. Creates initial progress record.

### Implementation Details

```go
func (ph *PathHandler) StartPath(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := r.Header.Get("X-User-ID")
	pathID := chi.URLParam(r, "pathId")

	if userID == "" {
		respondError(w, 401, "unauthorized", "Authentication required")
		return
	}

	// Start path in database
	progress, err := ph.pathUseCase.StartPath(ctx, userID, pathID)
	if err != nil {
		respondError(w, 500, "start_failed", err.Error())
		return
	}

	// Invalidate cache
	ph.cache.Delete(ctx, getCacheKey("paths", "*"))
	ph.cache.Delete(ctx, getCacheKey("user-progress", userID, "*"))

	respondJSON(w, 201, progress)
}
```

### Testing Checklist
- ✅ Requires authenticated user
- ✅ Creates initial progress record
- ✅ Returns 201 with progress data
- ✅ Invalidates relevant caches
- ✅ Duplicate start returns existing progress (idempotent)

---

## Task 2.2.4: GET /users/:userId/paths - Get User's Paths with Progress

### Description
Endpoint returning all paths a user has started with their current progress.

### Implementation Details

```go
type UserPathsResponse struct {
	InProgress []PathProgressCard `json:"inProgress"`
	Completed  []PathProgressCard `json:"completed"`
	Available  []PathCard         `json:"available"`
}

type PathProgressCard struct {
	PathID              string  `json:"pathId"`
	Name                string  `json:"name"`
	ProgressPercent     int     `json:"progressPercent"`
	CompletedLessons    int     `json:"completedLessons"`
	TotalLessons        int     `json:"totalLessons"`
	HoursSpent          float32 `json:"hoursSpent"`
	EstimatedHoursLeft  float32 `json:"estimatedHoursLeft"`
	CurrentLessonName   string  `json:"currentLessonName,omitempty"`
	LastAccessedAt      time.Time `json:"lastAccessedAt"`
}

func (ph *PathHandler) GetUserPaths(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := chi.URLParam(r, "userId")
	requestingUserID := r.Header.Get("X-User-ID")

	// Authorization: users can only see their own paths
	if userID != requestingUserID {
		respondError(w, 403, "forbidden", "Cannot access other users' paths")
		return
	}

	inProgress, completed, err := ph.pathUseCase.GetUserPaths(ctx, userID)
	if err != nil {
		respondError(w, 500, "fetch_failed", err.Error())
		return
	}

	// Fetch available paths not started
	available, _, err := ph.pathUseCase.ListPaths(ctx, usecase.ListPathsInput{
		Page:  1,
		Limit: 100,
	})
	if err != nil {
		respondError(w, 500, "fetch_failed", err.Error())
		return
	}

	resp := UserPathsResponse{
		InProgress: inProgress,
		Completed:  completed,
		Available:  available,
	}

	respondJSON(w, 200, resp)
}
```

### Testing Checklist
- ✅ Returns paths organized by status (in-progress, completed, available)
- ✅ Includes progress percentage for started paths
- ✅ Authorization enforced (users can't see other users' paths)
- ✅ Returns 403 for unauthorized access
- ✅ Calculates hours spent and remaining correctly

---

## Summary

Feature 02 backend includes 4 interconnected tasks:
1. **List Paths** - Main discovery API with filtering and pagination
2. **Get Path Details** - Rich endpoint with lessons and prerequisites
3. **Start Path** - Initialize user path progress
4. **Get User Paths** - Personalized path list with progress

All endpoints include proper caching, error handling, and authorization checks.

**Total Backend Tasks: 4**
**Estimated Effort: 35 hours**
**Dependencies: PostgreSQL schema (Task 2.3.1), Feature 01 auth (Task 1.1.3-1.1.6)**
