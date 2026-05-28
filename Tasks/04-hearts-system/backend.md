# Feature 04: Hearts System — Backend Tasks

**Owner:** Backend Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 4 backend tasks  
**Tech Stack:** Go 1.20+, PostgreSQL, scheduled tasks  

---

## Task 4.5: POST /hearts/damage Endpoint

### Description
Endpoint to apply hearts damage when a wrong answer is submitted in a quiz.

### Endpoint Specification

```
POST /hearts/damage
Content-Type: application/json
Authorization: Bearer {accessToken}

Request Body:
{
  "questId": "550e8400-e29b-41d4-a716-446655440000",
  "questionId": "660e8400-e29b-41d4-a716-446655440000",
  "damageAmount": 1
}

Response (200 OK):
{
  "currentHearts": 4,
  "maxHearts": 5,
  "damaged": true,
  "damageAmount": 1,
  "gameOverTriggered": false
}

Error Responses:
- 400 Bad Request: Invalid damage amount
- 401 Unauthorized
- 409 Conflict: Hearts already at 0
```

### Implementation

**File:** `services/user/internal/handler/hearts_handler.go`

```go
package handler

import (
	"encoding/json"
	"net/http"
	"services/user/internal/models"
	"services/user/internal/usecase"
)

type HeartsHandler struct {
	heartsUsecase usecase.HeartsUsecase
}

func NewHeartsHandler(heartsUsecase usecase.HeartsUsecase) *HeartsHandler {
	return &HeartsHandler{heartsUsecase: heartsUsecase}
}

func (h *HeartsHandler) DamageHearts(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.DamageHeartsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	result, err := h.heartsUsecase.DamageHearts(r.Context(), userID, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func (h *HeartsHandler) RecoverWithGems(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.RecoverWithGemsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	result, err := h.heartsUsecase.RecoverWithGems(r.Context(), userID, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func (h *HeartsHandler) GetHeartsStatus(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	status, err := h.heartsUsecase.GetHeartsStatus(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}
```

**File:** `services/user/internal/usecase/hearts_usecase.go`

```go
package usecase

import (
	"context"
	"fmt"
	"time"
	"services/user/internal/models"
	"services/user/internal/repository"
)

type HeartsUsecase interface {
	DamageHearts(ctx context.Context, userID string, req *models.DamageHeartsRequest) (*models.HeartsStatus, error)
	RecoverWithGems(ctx context.Context, userID string, req *models.RecoverWithGemsRequest) (*models.HeartsStatus, error)
	GetHeartsStatus(ctx context.Context, userID string) (*models.HeartsStatus, error)
	ResetDailyHearts(ctx context.Context, userID string) error
}

type heartsUsecaseImpl struct {
	userRepo     repository.UserRepository
	heartsRepo   repository.HeartsRepository
	gemsRepo     repository.GemsRepository
}

func NewHeartsUsecase(
	userRepo repository.UserRepository,
	heartsRepo repository.HeartsRepository,
	gemsRepo repository.GemsRepository,
) HeartsUsecase {
	return &heartsUsecaseImpl{
		userRepo:   userRepo,
		heartsRepo: heartsRepo,
		gemsRepo:   gemsRepo,
	}
}

func (u *heartsUsecaseImpl) DamageHearts(
	ctx context.Context,
	userID string,
	req *models.DamageHeartsRequest,
) (*models.HeartsStatus, error) {
	// Get current hearts status
	status, err := u.heartsRepo.GetHeartsStatus(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get hearts status: %w", err)
	}

	// Check if already at 0
	if status.CurrentHearts <= 0 {
		return status, fmt.Errorf("hearts already depleted")
	}

	// Apply damage
	newHearts := status.CurrentHearts - req.DamageAmount
	if newHearts < 0 {
		newHearts = 0
	}

	// Update in database
	if err := u.heartsRepo.UpdateHearts(ctx, userID, newHearts); err != nil {
		return nil, fmt.Errorf("failed to update hearts: %w", err)
	}

	// Log damage event
	if err := u.heartsRepo.LogDamageEvent(ctx, &models.HeartsEvent{
		UserID:    userID,
		EventType: "damage",
		Amount:    req.DamageAmount,
		QuestID:   req.QuestID,
		CreatedAt: time.Now(),
	}); err != nil {
		// Don't fail the request if logging fails
		fmt.Printf("Warning: failed to log hearts damage: %v\n", err)
	}

	return &models.HeartsStatus{
		CurrentHearts:     newHearts,
		MaxHearts:         status.MaxHearts,
		LastResetAt:       status.LastResetAt,
		NextResetAt:       status.NextResetAt,
		GameOverTriggered: newHearts == 0,
	}, nil
}

func (u *heartsUsecaseImpl) RecoverWithGems(
	ctx context.Context,
	userID string,
	req *models.RecoverWithGemsRequest,
) (*models.HeartsStatus, error) {
	// Validate user has enough gems
	balance, err := u.gemsRepo.GetGemBalance(ctx, userID)
	if err != nil {
		return nil, err
	}

	if balance.Balance < req.GemsToSpend {
		return nil, fmt.Errorf("insufficient gems")
	}

	// Deduct gems
	if err := u.gemsRepo.DeductGems(ctx, userID, req.GemsToSpend); err != nil {
		return nil, err
	}

	// Recover hearts (full recovery)
	status, err := u.heartsRepo.GetHeartsStatus(ctx, userID)
	if err != nil {
		return nil, err
	}

	if err := u.heartsRepo.UpdateHearts(ctx, userID, status.MaxHearts); err != nil {
		// Refund gems on failure
		u.gemsRepo.AddGems(ctx, userID, req.GemsToSpend)
		return nil, err
	}

	// Log recovery event
	u.heartsRepo.LogDamageEvent(ctx, &models.HeartsEvent{
		UserID:    userID,
		EventType: "gem_recovery",
		Amount:    req.GemsToSpend,
		CreatedAt: time.Now(),
	})

	return &models.HeartsStatus{
		CurrentHearts:     status.MaxHearts,
		MaxHearts:         status.MaxHearts,
		LastResetAt:       status.LastResetAt,
		NextResetAt:       status.NextResetAt,
		GameOverTriggered: false,
	}, nil
}

func (u *heartsUsecaseImpl) GetHeartsStatus(
	ctx context.Context,
	userID string,
) (*models.HeartsStatus, error) {
	return u.heartsRepo.GetHeartsStatus(ctx, userID)
}

func (u *heartsUsecaseImpl) ResetDailyHearts(
	ctx context.Context,
	userID string,
) error {
	status, err := u.heartsRepo.GetHeartsStatus(ctx, userID)
	if err != nil {
		return err
	}

	return u.heartsRepo.UpdateHearts(ctx, userID, status.MaxHearts)
}
```

### Testing Checklist
- [ ] Damage endpoint reduces hearts correctly
- [ ] Game over triggered at 0 hearts
- [ ] Recovery with gems validates gem balance
- [ ] Gem deduction and refund works
- [ ] Status endpoint returns correct values

---

## Task 4.6: Background Job: Daily Hearts Reset

### Description
Implement background job to reset hearts daily for all users.

### Implementation

**File:** `services/user/internal/jobs/hearts_reset_job.go`

```go
package jobs

import (
	"context"
	"fmt"
	"log"
	"time"
	"services/user/internal/repository"
)

type HeartsResetJob struct {
	heartsRepo repository.HeartsRepository
	resetHourUTC int
}

func NewHeartsResetJob(heartsRepo repository.HeartsRepository, resetHourUTC int) *HeartsResetJob {
	return &HeartsResetJob{
		heartsRepo: heartsRepo,
		resetHourUTC: resetHourUTC,
	}
}

func (j *HeartsResetJob) Start(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute) // Check every minute
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			now := time.Now().UTC()
			
			// Check if it's time to reset (e.g., 6 AM UTC)
			if now.Hour() == j.resetHourUTC && now.Minute() == 0 {
				if err := j.resetHearts(ctx); err != nil {
					log.Printf("Error resetting hearts: %v\n", err)
				}
			}
		}
	}
}

func (j *HeartsResetJob) resetHearts(ctx context.Context) error {
	log.Println("Starting daily hearts reset...")

	// Get all users
	users, err := j.heartsRepo.GetAllUsers(ctx)
	if err != nil {
		return fmt.Errorf("failed to get users: %w", err)
	}

	resetCount := 0
	for _, user := range users {
		if err := j.heartsRepo.ResetHeartsForUser(ctx, user.ID); err != nil {
			log.Printf("Failed to reset hearts for user %s: %v\n", user.ID, err)
			continue
		}
		resetCount++
	}

	log.Printf("Hearts reset completed for %d users\n", resetCount)
	return nil
}
```

### Testing Checklist
- [ ] Job runs at correct UTC hour
- [ ] All users get reset
- [ ] Database updates correctly
- [ ] Error handling prevents partial resets

---

## Task 4.7: GET /hearts/status Endpoint

### Description
Get current hearts status for user including next reset time.

### Implementation

**File:** `services/user/internal/handler/hearts_handler.go` (additions)

```go
// Already implemented in DamageHearts task
```

### Testing Checklist
- [ ] Returns correct current/max hearts
- [ ] Next reset time calculated correctly
- [ ] Last reset time accurate

---

## Task 4.8: Hearts Events Table Queries

### Description
Implement repository queries for hearts events tracking.

### Implementation

**File:** `services/user/internal/repository/hearts_repo.go`

```go
package repository

import (
	"context"
	"database/sql"
	"services/user/internal/models"
)

type HeartsRepository interface {
	GetHeartsStatus(ctx context.Context, userID string) (*models.HeartsStatus, error)
	UpdateHearts(ctx context.Context, userID string, hearts int) error
	LogDamageEvent(ctx context.Context, event *models.HeartsEvent) error
	ResetHeartsForUser(ctx context.Context, userID string) error
	GetAllUsers(ctx context.Context) ([]*models.User, error)
}

type heartsRepoImpl struct {
	db *sql.DB
}

func NewHeartsRepository(db *sql.DB) HeartsRepository {
	return &heartsRepoImpl{db: db}
}

func (r *heartsRepoImpl) GetHeartsStatus(
	ctx context.Context,
	userID string,
) (*models.HeartsStatus, error) {
	query := `
		SELECT current_hearts, max_hearts, last_reset_at, next_reset_at
		FROM hearts_status
		WHERE user_id = $1
	`

	var status models.HeartsStatus
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&status.CurrentHearts,
		&status.MaxHearts,
		&status.LastResetAt,
		&status.NextResetAt,
	)

	if err == sql.ErrNoRows {
		// Initialize for new user
		return &models.HeartsStatus{
			CurrentHearts: 5,
			MaxHearts:     5,
			LastResetAt:   time.Now(),
			NextResetAt:   getNextResetTime(),
		}, nil
	}

	return &status, err
}

func (r *heartsRepoImpl) UpdateHearts(
	ctx context.Context,
	userID string,
	hearts int,
) error {
	query := `
		UPDATE hearts_status
		SET current_hearts = $1, updated_at = now()
		WHERE user_id = $2
	`

	_, err := r.db.ExecContext(ctx, query, hearts, userID)
	return err
}

func (r *heartsRepoImpl) LogDamageEvent(
	ctx context.Context,
	event *models.HeartsEvent,
) error {
	query := `
		INSERT INTO hearts_events (user_id, event_type, amount, quest_id, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := r.db.ExecContext(ctx, query,
		event.UserID,
		event.EventType,
		event.Amount,
		event.QuestID,
		event.CreatedAt,
	)

	return err
}

func (r *heartsRepoImpl) ResetHeartsForUser(
	ctx context.Context,
	userID string,
) error {
	query := `
		UPDATE hearts_status
		SET current_hearts = max_hearts, last_reset_at = now(), next_reset_at = $1
		WHERE user_id = $2
	`

	_, err := r.db.ExecContext(ctx, query, getNextResetTime(), userID)
	return err
}

func (r *heartsRepoImpl) GetAllUsers(ctx context.Context) ([]*models.User, error) {
	query := `SELECT id FROM users WHERE deleted_at IS NULL`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID); err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	return users, rows.Err()
}
```

### Testing Checklist
- [ ] GetHeartsStatus returns correct values
- [ ] UpdateHearts modifies database
- [ ] LogDamageEvent records events
- [ ] ResetHeartsForUser resets all users

