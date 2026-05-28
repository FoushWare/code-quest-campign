# Feature 06: XP & Leveling — Backend Tasks

**Owner:** Backend Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 2 backend tasks  
**Tech Stack:** Go 1.20+, PostgreSQL  

---

## Task 6.4: POST /xp/gain Endpoint

### Description
Award XP to user when quest completed.

### Implementation

**File:** `services/user/internal/handler/xp_handler.go`

```go
package handler

import (
	"encoding/json"
	"net/http"
	"services/user/internal/models"
	"services/user/internal/usecase"
)

type XPHandler struct {
	xpUsecase usecase.XPUsecase
}

func NewXPHandler(xpUsecase usecase.XPUsecase) *XPHandler {
	return &XPHandler{xpUsecase: xpUsecase}
}

func (h *XPHandler) GainXP(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.GainXPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	result, err := h.xpUsecase.GainXP(r.Context(), userID, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func (h *XPHandler) GetUserLevel(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	level, err := h.xpUsecase.GetUserLevel(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(level)
}
```

**File:** `services/user/internal/usecase/xp_usecase.go`

```go
package usecase

import (
	"context"
	"fmt"
	"services/user/internal/models"
	"services/user/internal/repository"
)

const (
	BaseXPPerLevel = 100
	XPMultiplier   = 1.1
	MaxLevel       = 100
)

type XPUsecase interface {
	GainXP(ctx context.Context, userID string, req *models.GainXPRequest) (*models.LevelData, error)
	GetUserLevel(ctx context.Context, userID string) (*models.LevelData, error)
}

type xpUsecaseImpl struct {
	xpRepo repository.XPRepository
}

func NewXPUsecase(xpRepo repository.XPRepository) XPUsecase {
	return &xpUsecaseImpl{xpRepo: xpRepo}
}

func (u *xpUsecaseImpl) GainXP(
	ctx context.Context,
	userID string,
	req *models.GainXPRequest,
) (*models.LevelData, error) {
	currentXP, err := u.xpRepo.GetTotalXP(ctx, userID)
	if err != nil {
		return nil, err
	}

	newXP := currentXP + req.Amount
	level := calculateLevel(newXP)

	if err := u.xpRepo.UpdateXP(ctx, userID, newXP); err != nil {
		return nil, err
	}

	return level, nil
}

func (u *xpUsecaseImpl) GetUserLevel(
	ctx context.Context,
	userID string,
) (*models.LevelData, error) {
	totalXP, err := u.xpRepo.GetTotalXP(ctx, userID)
	if err != nil {
		return nil, err
	}

	return calculateLevel(totalXP), nil
}

func calculateLevel(totalXP int) *models.LevelData {
	var xpRequired int
	level := 1

	for level < MaxLevel {
		nextLevelXp := int(float64(BaseXPPerLevel) * 
			math.Pow(XPMultiplier, float64(level-1)))

		if xpRequired+nextLevelXp > totalXP {
			break
		}

		xpRequired += nextLevelXp
		level++
	}

	xpForCurrentLevel := int(float64(BaseXPPerLevel) * 
		math.Pow(XPMultiplier, float64(level-1)))
	xpProgress := totalXP - xpRequired
	percentToNext := float64(xpProgress) / float64(xpForCurrentLevel) * 100

	return &models.LevelData{
		Level:              level,
		TotalXP:            totalXP,
		XPForNextLevel:     xpForCurrentLevel,
		XPProgress:         xpProgress,
		PercentToNextLevel: percentToNext,
	}
}
```

### Testing Checklist
- [ ] GainXP endpoint adds XP correctly
- [ ] Level calculation accurate
- [ ] GetUserLevel returns correct data

---

## Task 6.5: XP Repository

### Description
Store and retrieve XP data.

### Implementation

**File:** `services/user/internal/repository/xp_repo.go`

```go
package repository

import (
	"context"
	"database/sql"
	"services/user/internal/models"
)

type XPRepository interface {
	GetTotalXP(ctx context.Context, userID string) (int, error)
	UpdateXP(ctx context.Context, userID string, xp int) error
}

type xpRepoImpl struct {
	db *sql.DB
}

func NewXPRepository(db *sql.DB) XPRepository {
	return &xpRepoImpl{db: db}
}

func (r *xpRepoImpl) GetTotalXP(
	ctx context.Context,
	userID string,
) (int, error) {
	query := `SELECT total_xp FROM user_levels WHERE user_id = $1`

	var xp int
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&xp)

	if err == sql.ErrNoRows {
		return 0, nil
	}

	return xp, err
}

func (r *xpRepoImpl) UpdateXP(
	ctx context.Context,
	userID string,
	xp int,
) error {
	query := `
		INSERT INTO user_levels (user_id, total_xp)
		VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE SET
			total_xp = $2,
			updated_at = now()
	`

	_, err := r.db.ExecContext(ctx, query, userID, xp)
	return err
}
```

### Testing Checklist
- [ ] UpdateXP persists changes
- [ ] GetTotalXP returns correct values

