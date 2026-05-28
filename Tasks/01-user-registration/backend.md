# Feature 01: User Onboarding & Registration — Backend Tasks

**Owner:** Backend Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 5 backend tasks (1.1.3-1.1.6, 1.2.6)  
**Tech Stack:** Go 1.20+, Chi/Gin router, PostgreSQL, bcrypt, JWT, OAuth2  

---

## Task 1.1.3: POST /auth/register Endpoint

### Description
Implement user registration. Hash password with bcrypt. Return JWT + refresh token pair.

### Endpoint Specification
```
POST /auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (200 OK):
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "user_550e8400",
    "avatar_url": null,
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}

Error Responses:
- 400 Bad Request: Invalid email/password format
- 409 Conflict: Email already exists
- 500 Internal Server Error: Database error
```

### Zod Validation Schema (Backend)
```go
// services/auth/internal/models/dto.go
type RegisterRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
}

type RegisterResponse struct {
    User         *User  `json:"user"`
    AccessToken  string `json:"accessToken"`
    RefreshToken string `json:"refreshToken"`
    ExpiresIn    int    `json:"expiresIn"` // seconds
}
```

### Implementation Steps

1. **Validate input** (email format, password strength)
   ```go
   func validateRegisterRequest(req RegisterRequest) error {
       if !isValidEmail(req.Email) {
           return fmt.Errorf("invalid email format")
       }
       if len(req.Password) < 8 {
           return fmt.Errorf("password must be at least 8 characters")
       }
       return nil
   }
   ```

2. **Check email uniqueness**
   ```go
   existingUser, err := repo.GetUserByEmail(ctx, req.Email)
   if existingUser != nil {
       return fmt.Errorf("email already registered")
   }
   ```

3. **Hash password** (bcrypt, cost 12)
   ```go
   hashedPassword, err := bcrypt.GenerateFromPassword(
       []byte(req.Password), 
       bcrypt.DefaultCost,
   )
   ```

4. **Create user record**
   ```go
   user := &models.User{
       ID:           uuid.New(),
       Email:        req.Email,
       Username:     generateUsername(req.Email),
       PasswordHash: string(hashedPassword),
       AuthProvider: "email",
       CreatedAt:    time.Now(),
   }
   err := repo.CreateUser(ctx, user)
   ```

5. **Generate JWT tokens**
   ```go
   accessToken := generateAccessToken(user, 15*time.Minute)
   refreshToken := generateRefreshToken(user, 7*24*time.Hour)
   ```

6. **Store refresh token hash in DB**
   ```go
   refreshTokenHash := hashToken(refreshToken)
   repo.StoreRefreshToken(ctx, user.ID, refreshTokenHash, expiryTime)
   ```

7. **Return response with Set-Cookie header**
   ```go
   http.SetCookie(w, &http.Cookie{
       Name:     "refreshToken",
       Value:    refreshToken,
       HttpOnly: true,
       Secure:   true,
       SameSite: http.SameSiteLaxMode,
       Expires:  time.Now().Add(7 * 24 * time.Hour),
   })
   ```

### Code Structure (Clean Architecture)
```
services/auth/
├── internal/
│   ├── handler/
│   │   └── auth_handler.go     # HTTP handlers
│   ├── usecase/
│   │   └── register_usecase.go # Business logic
│   ├── repository/
│   │   └── user_repo.go        # Database queries
│   ├── models/
│   │   └── user.go             # Domain models
│   └── middleware/
│       └── jwt_middleware.go
├── cmd/
│   └── main.go                 # Server entry point
└── go.mod
```

---

## Task 1.1.4: POST /auth/login Endpoint

### Description
Implement user login. Verify bcrypt hash. Issue JWT (15min expiry) + refresh token (7d expiry).

### Endpoint Specification
```
POST /auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (200 OK):
{
  "user": { /* user object */ },
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 900
}

Error Responses:
- 400 Bad Request: Invalid credentials format
- 401 Unauthorized: Email/password incorrect
- 500 Internal Server Error
```

### Implementation Steps

1. **Retrieve user by email**
   ```go
   user, err := repo.GetUserByEmail(ctx, req.Email)
   if user == nil {
       return errors.New("invalid credentials")
   }
   ```

2. **Verify password** (bcrypt comparison)
   ```go
   err := bcrypt.CompareHashAndPassword(
       []byte(user.PasswordHash),
       []byte(req.Password),
   )
   if err != nil {
       return errors.New("invalid credentials")
   }
   ```

3. **Generate tokens** (same as register)
   - Access token: 15 minutes expiry
   - Refresh token: 7 days expiry

4. **Store refresh token hash**
   - Hash the token before storing
   - Set expiry to 7 days from now

5. **Return response with httpOnly cookie**

---

## Task 1.1.5: Google & GitHub OAuth2 Callback Handlers

### Description
Implement OAuth2 callback handlers for Google and GitHub. Create user record if first login.

### OAuth Flow

**Step 1: Frontend redirects to Google/GitHub authorization**
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:8081/auth/google/callback&
  response_type=code&
  scope=email+profile
```

**Step 2: User authorizes app → Browser redirects to callback with code**

**Step 3: Backend exchanges code for tokens**

### Implementation

```go
// services/auth/internal/handler/oauth.go

func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
    code := r.URL.Query().Get("code")
    if code == "" {
        http.Error(w, "Missing authorization code", http.StatusBadRequest)
        return
    }

    // Exchange code for access token
    token, err := h.googleOAuthConfig.Exchange(r.Context(), code)
    if err != nil {
        http.Error(w, "Failed to exchange token", http.StatusUnauthorized)
        return
    }

    // Fetch user info from Google
    userInfo, err := fetchGoogleUserInfo(r.Context(), token.AccessToken)
    if err != nil {
        http.Error(w, "Failed to fetch user info", http.StatusInternalServerError)
        return
    }

    // Check if user exists
    user, err := h.userRepo.GetUserByEmail(r.Context(), userInfo.Email)
    
    // If not exists, create new user
    if user == nil {
        user = &models.User{
            ID:           uuid.New(),
            Email:        userInfo.Email,
            Username:     userInfo.Name,
            AvatarURL:    userInfo.Picture,
            AuthProvider: "google",
            CreatedAt:    time.Now(),
        }
        err := h.userRepo.CreateUser(r.Context(), user)
        if err != nil {
            http.Error(w, "Failed to create user", http.StatusInternalServerError)
            return
        }
    }

    // Generate JWT tokens
    accessToken := h.jwtService.GenerateAccessToken(user)
    refreshToken := h.jwtService.GenerateRefreshToken(user)

    // Set httpOnly cookie for refresh token
    http.SetCookie(w, &http.Cookie{
        Name:     "refreshToken",
        Value:    refreshToken,
        HttpOnly: true,
        Secure:   true,
        Expires:  time.Now().Add(7 * 24 * time.Hour),
    })

    // Redirect to frontend with access token
    redirectURL := fmt.Sprintf("http://localhost:4200/auth/callback?token=%s", accessToken)
    http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}
```

### Configuration

**Environment Variables:**
```bash
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8081/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:8081/auth/github/callback
```

### Endpoints

```
GET /auth/google/login              # Redirects to Google consent screen
GET /auth/google/callback           # OAuth callback (code exchange)
GET /auth/github/login              # Redirects to GitHub authorization
GET /auth/github/callback           # OAuth callback (code exchange)
```

---

## Task 1.1.6: POST /auth/refresh Endpoint

### Description
Implement token refresh. Rotate refresh tokens (issue new refresh token on each refresh).

### Endpoint Specification
```
POST /auth/refresh
Cookie: refreshToken=...

Response (200 OK):
{
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token",
  "expiresIn": 900
}

Error Responses:
- 401 Unauthorized: Invalid/expired refresh token
- 403 Forbidden: Revoked token
```

### Implementation

```go
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
    // Get refresh token from httpOnly cookie
    cookie, err := r.Cookie("refreshToken")
    if err != nil {
        http.Error(w, "Missing refresh token", http.StatusUnauthorized)
        return
    }

    // Validate refresh token signature
    claims, err := h.jwtService.ValidateRefreshToken(cookie.Value)
    if err != nil {
        http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
        return
    }

    // Check if token is revoked
    tokenHash := hashToken(cookie.Value)
    revoked, err := h.refreshTokenRepo.IsRevoked(r.Context(), claims.UserID, tokenHash)
    if revoked {
        http.Error(w, "Token revoked", http.StatusForbidden)
        return
    }

    // Revoke old token (token rotation security practice)
    h.refreshTokenRepo.RevokeToken(r.Context(), claims.UserID, tokenHash)

    // Get fresh user data
    user, err := h.userRepo.GetByID(r.Context(), claims.UserID)
    if err != nil {
        http.Error(w, "User not found", http.StatusUnauthorized)
        return
    }

    // Issue new tokens
    newAccessToken := h.jwtService.GenerateAccessToken(user)
    newRefreshToken := h.jwtService.GenerateRefreshToken(user)

    // Store new refresh token
    newTokenHash := hashToken(newRefreshToken)
    h.refreshTokenRepo.StoreRefreshToken(
        r.Context(),
        user.ID,
        newTokenHash,
        time.Now().Add(7*24*time.Hour),
    )

    // Set new refresh token cookie
    http.SetCookie(w, &http.Cookie{
        Name:     "refreshToken",
        Value:    newRefreshToken,
        HttpOnly: true,
        Secure:   true,
        Expires:  time.Now().Add(7 * 24 * time.Hour),
    })

    // Return response
    json.NewEncoder(w).Encode(map[string]interface{}{
        "accessToken": newAccessToken,
        "refreshToken": newRefreshToken,
        "expiresIn": 900,
    })
}
```

---

## Task 1.2.6: POST /users/onboarding Endpoint

### Description
Store experience level, selected topics, daily goal minutes in user preferences.

### Endpoint Specification
```
POST /users/onboarding
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "experienceLevel": "mid",
  "selectedTopics": ["HTML", "React", "TypeScript"],
  "dailyGoalMinutes": 15,
  "reminderTime": "08:00",
  "remindersEnabled": true
}

Response (200 OK):
{
  "success": true,
  "user": { /* updated user object */ }
}
```

### Implementation

```go
func (h *AuthHandler) SaveOnboarding(w http.ResponseWriter, r *http.Request) {
    // Extract user from JWT middleware
    userID := r.Context().Value("userID").(string)

    var req struct {
        ExperienceLevel   string   `json:"experienceLevel"`
        SelectedTopics    []string `json:"selectedTopics"`
        DailyGoalMinutes  int      `json:"dailyGoalMinutes"`
        ReminderTime      string   `json:"reminderTime"`
        RemindersEnabled  bool     `json:"remindersEnabled"`
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }

    // Validate experience level
    validLevels := []string{"beginner", "junior", "mid", "senior"}
    if !contains(validLevels, req.ExperienceLevel) {
        http.Error(w, "Invalid experience level", http.StatusBadRequest)
        return
    }

    // Save to database
    topicsJSON, _ := json.Marshal(req.SelectedTopics)
    
    err := h.userPrefRepo.SavePreferences(r.Context(), &models.UserPreferences{
        UserID:              userID,
        ExperienceLevel:     req.ExperienceLevel,
        SelectedTopics:      topicsJSON,
        DailyGoalMinutes:    req.DailyGoalMinutes,
        ReminderTime:        req.ReminderTime,
        RemindersEnabled:    req.RemindersEnabled,
        OnboardingCompletedAt: time.Now(),
    })

    if err != nil {
        http.Error(w, "Failed to save preferences", http.StatusInternalServerError)
        return
    }

    // Trigger service:content to auto-generate guided path
    // (async event/job queue call)
    h.eventBus.Publish("user.onboarding.completed", userID)

    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
    })
}
```

---

## Middleware: JWT Authentication

### Description
Middleware to validate JWT tokens and extract user context.

```go
func (h *AuthHandler) JWTMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Extract token from Authorization header
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "Missing authorization header", http.StatusUnauthorized)
            return
        }

        // Bearer token format
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
            return
        }

        token := parts[1]

        // Validate token
        claims, err := h.jwtService.ValidateAccessToken(token)
        if err != nil {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }

        // Add user info to context
        ctx := r.Context()
        ctx = context.WithValue(ctx, "userID", claims.UserID)
        ctx = context.WithValue(ctx, "user", claims)

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

---

## Testing Checklist

- [ ] Unit tests for password hashing (bcrypt)
- [ ] Unit tests for JWT generation/validation
- [ ] Integration tests for /auth/register endpoint
- [ ] Integration tests for /auth/login endpoint
- [ ] Integration tests for /auth/refresh endpoint
- [ ] Integration tests for OAuth callbacks
- [ ] Error handling: duplicate email, invalid password, expired token
- [ ] Load test: 1000 concurrent registrations
- [ ] Security: SQL injection prevention, rate limiting
