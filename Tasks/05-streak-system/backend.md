# Feature 05: Streak System — Backend Tasks

**Owner:** Backend Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 3 backend tasks  
**Tech Stack:** Go 1.20+, PostgreSQL, scheduled jobs  

---

## Task 5.4: POST /streaks/update Endpoint

### Description
Update user streak when quest is completed.

### Implementation

**File:** `services/user/internal/handler/streak_handler.go`

```go
package handler

import (
	"encoding/json"
	"net/http"
	"services/user/internal/models"
	"services/user/internal/usecase"
)

type StreakHandler struct {
	streakUsecase usecase.StreakUsecase
}

func NewStreakHandler(streakUsecase usecase.StreakUsecase) *StreakHandler {
	return &StreakHandler{streakUsecase: streakUsecase}
}

func (h *StreakHandler) UpdateStreak(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.UpdateStreakRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	streak, err := h.streakUsecase.UpdateStreak(r.Context(), userID, req.QuestCompleted)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(streak)
}

func (h *StreakHandler) GetStreak(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	streak, err := h.streakUsecase.GetStreak(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(streak)
}
```

**File:** `services/user/internal/usecase/streak_usecase.go`

```go
package usecase

import (
	"context"
	"fmt"
	"time"
	"services/user/internal/models"
	"services/user/internal/repository"
)

type StreakUsecase interface {
	UpdateStreak(ctx context.Context, userID string, questCompleted bool) (*models.StreakData, error)
	GetStreak(ctx context.Context, userID string) (*models.StreakData, error)
}

type streakUsecaseImpl struct {
	streakRepo repository.StreakRepository
}

func NewStreakUsecase(streakRepo repository.StreakRepository) StreakUsecase {
	return &streakUsecaseImpl{streakRepo: streakRepo}
}

func (u *streakUsecaseImpl) UpdateStreak(
	ctx context.Context,
	userID string,
	questCompleted bool,
) (*models.StreakData, error) {
	if !questCompleted {
		return u.GetStreak(ctx, userID)
	}

	streak, err := u.streakRepo.GetStreak(ctx, userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	lastActivity := streak.LastActivityDate

	daysSince := daysBetween(lastActivity, now)

	if daysSince == 0 {
		// Same day, no change
		return streak, nil
	} else if daysSince == 1 {
		// Consecutive day, increment
		streak.CurrentStreak++
		if streak.CurrentStreak > streak.LongestStreak {
			streak.LongestStreak = streak.CurrentStreak
		}
	} else {
		// Streak broken
		streak.CurrentStreak = 1
	}

	streak.LastActivityDate = now
	streak.TotalDaysActive++

	if err := u.streakRepo.UpdateStreak(ctx, userID, streak); err != nil {
		return nil, err
	}

	return streak, nil
}

func (u *streakUsecaseImpl) GetStreak(
	ctx context.Context,
	userID string,
) (*models.StreakData, error) {
	return u.streakRepo.GetStreak(ctx, userID)
}

func daysBetween(date1, date2 time.Time) int {
	d1 := time.Date(date1.Year(), date1.Month(), date1.Day(), 0, 0, 0, 0, time.UTC)
	d2 := time.Date(date2.Year(), date2.Month(), date2.Day(), 0, 0, 0, 0, time.UTC)
	return int(d2.Sub(d1).Hours() / 24)
}
```

### Testing Checklist
- [ ] Update endpoint increments streak correctly
- [ ] Streak resets on gap
- [ ] Same-day updates don't change streak
- [ ] Longest streak tracked

---

## Task 5.5: Streak Repository

### Description
Implement database layer for streak operations.

### Implementation

**File:** `services/user/internal/repository/streak_repo.go`

```go
package repository

import (
	"context"
	"database/sql"
	"time"
	"services/user/internal/models"
)

type StreakRepository interface {
	GetStreak(ctx context.Context, userID string) (*models.StreakData, error)
	UpdateStreak(ctx context.Context, userID string, data *models.StreakData) error
}

type streakRepoImpl struct {
	db *sql.DB
}

func NewStreakRepository(db *sql.DB) StreakRepository {
	return &streakRepoImpl{db: db}
}

func (r *streakRepoImpl) GetStreak(
	ctx context.Context,
	userID string,
) (*models.StreakData, error) {
	query := `
		SELECT current_streak, longest_streak, last_activity_date, total_days_active
		FROM streaks
		WHERE user_id = $1
	`

	var streak models.StreakData
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&streak.CurrentStreak,
		&streak.LongestStreak,
		&streak.LastActivityDate,
		&streak.TotalDaysActive,
	)

	if err == sql.ErrNoRows {
		return &models.StreakData{
			CurrentStreak:    0,
			LongestStreak:    0,
			LastActivityDate: time.Now(),
			TotalDaysActive:  0,
		}, nil
	}

	return &streak, err
}

func (r *streakRepoImpl) UpdateStreak(
	ctx context.Context,
	userID string,
	data *models.StreakData,
) error {
	query := `
		INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date, total_days_active)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id) DO UPDATE SET
			current_streak = $2,
			longest_streak = $3,
			last_activity_date = $4,
			total_days_active = $5,
			updated_at = now()
	`

	_, err := r.db.ExecContext(ctx, query,
		userID,
		data.CurrentStreak,
		data.LongestStreak,
		data.LastActivityDate,
		data.TotalDaysActive,
	)

	return err
}
```

### Testing Checklist
- [ ] GetStreak returns correct values
- [ ] UpdateStreak persists changes
- [ ] Handles new users

