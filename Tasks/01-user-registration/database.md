# Feature 01: User Onboarding & Registration — Database Tasks

**Owner:** Database Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 2 database tasks (1.1.7, 1.1.8)  
**Tech Stack:** PostgreSQL 15+, SQL migrations  

---

## Task 1.1.7: Create `users` Table

### Description
Schema for users table with authentication fields and profile data.

### SQL Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),  -- NULL if using OAuth only
  
  -- Profile
  avatar_url VARCHAR(1024),
  auth_provider VARCHAR(50) DEFAULT 'email',  -- email, google, github
  
  -- Roles & Permissions
  role VARCHAR(50) DEFAULT 'user',  -- user, admin, moderator
  
  -- Email Verification
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_auth_provider ON users(auth_provider);
```

### Migration File

**File:** `infra/migrations/001_create_users_table.up.sql`

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  avatar_url VARCHAR(1024),
  auth_provider VARCHAR(50) DEFAULT 'email',
  role VARCHAR(50) DEFAULT 'user',
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_username 
  ON users(username) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_auth_provider 
  ON users(auth_provider);

-- Add constraint: email must be valid
ALTER TABLE users ADD CONSTRAINT ck_users_email_format 
  CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');
```

**File:** `infra/migrations/001_create_users_table.down.sql`

```sql
DROP TABLE IF EXISTS users;
```

### Key Design Decisions

1. **UUID Primary Key** — Scalable, privacy-friendly (no sequential IDs exposed)
2. **Email Unique Index** — Users identified by email for auth
3. **Username Unique** — Display name separate from email
4. **Soft Deletes** — `deleted_at` column allows data recovery without physical deletion
5. **Auth Provider Enum** — Supports multi-provider login
6. **Role RBAC** — Foundation for admin/moderator features
7. **Password Hash** — Nullable for OAuth-only users
8. **Audit Columns** — `created_at`, `updated_at`, `deleted_at` for tracking

---

## Task 1.1.8: Create `refresh_tokens` Table

### Description
Schema for storing refresh tokens with expiry and revocation tracking.

### SQL Schema

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Token storage (hashed for security)
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  
  -- Expiry & Revocation
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,  -- NULL if not revoked
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at);
```

### Migration File

**File:** `infra/migrations/002_create_refresh_tokens_table.up.sql`

```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
  ON refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at 
  ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked_at 
  ON refresh_tokens(revoked_at);

-- Add constraint: expires_at must be in future
ALTER TABLE refresh_tokens ADD CONSTRAINT ck_refresh_tokens_expiry
  CHECK (expires_at > created_at);
```

**File:** `infra/migrations/002_create_refresh_tokens_table.down.sql`

```sql
DROP TABLE IF EXISTS refresh_tokens;
```

### Key Design Decisions

1. **Token Hash Storage** — Never store plaintext tokens (security best practice)
2. **Expires At** — Tracks when token becomes invalid
3. **Revoked At** — Nullable; non-NULL means token was manually revoked
4. **ON DELETE CASCADE** — When user deleted, all tokens cleaned up
5. **Indexes on Foreign Key & Expiry** — Optimize queries: "find user's tokens", "find expired tokens for cleanup"

---

## Task 1.2.8: Create `user_preferences` Table

### Description
Schema for storing user preferences from onboarding wizard.

### SQL Schema

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key (UNIQUE: one prefs row per user)
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Onboarding data
  experience_level VARCHAR(50),  -- beginner, junior, mid, senior
  daily_goal_minutes INTEGER DEFAULT 10,
  selected_topics JSONB,  -- ["HTML", "React", "TypeScript"]
  reminder_time TIME,
  
  -- Settings
  theme VARCHAR(50) DEFAULT 'zatona-classic',
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  profile_public BOOLEAN DEFAULT true,
  
  -- Audit
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Migration File

**File:** `infra/migrations/003_create_user_preferences_table.up.sql`

```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experience_level VARCHAR(50),
  daily_goal_minutes INTEGER DEFAULT 10,
  selected_topics JSONB,
  reminder_time TIME,
  theme VARCHAR(50) DEFAULT 'zatona-classic',
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  profile_public BOOLEAN DEFAULT true,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_experience_level
  ON user_preferences(experience_level);

-- JSONB indexes for topic queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_topics
  ON user_preferences USING gin(selected_topics);
```

**File:** `infra/migrations/003_create_user_preferences_table.down.sql`

```sql
DROP TABLE IF EXISTS user_preferences;
```

---

## Database Queries (Repository Layer)

### User Repository Functions

```go
// services/auth/internal/repository/user_repo.go

type UserRepository interface {
    // Create
    CreateUser(ctx context.Context, user *models.User) error
    
    // Read
    GetByID(ctx context.Context, id string) (*models.User, error)
    GetByEmail(ctx context.Context, email string) (*models.User, error)
    GetByUsername(ctx context.Context, username string) (*models.User, error)
    
    // Update
    UpdateUser(ctx context.Context, user *models.User) error
    
    // Delete (soft)
    SoftDeleteUser(ctx context.Context, id string) error
}

// Implementation examples
func (r *PostgresUserRepository) CreateUser(ctx context.Context, user *models.User) error {
    query := `
        INSERT INTO users (id, email, username, password_hash, avatar_url, auth_provider, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `
    _, err := r.db.ExecContext(ctx, query,
        user.ID, user.Email, user.Username, user.PasswordHash, user.AvatarURL, user.AuthProvider,
        user.CreatedAt, user.UpdatedAt,
    )
    return err
}

func (r *PostgresUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
    query := `
        SELECT id, email, username, password_hash, avatar_url, auth_provider, role, 
               email_verified, created_at, updated_at
        FROM users
        WHERE email = $1 AND deleted_at IS NULL
    `
    var user models.User
    err := r.db.QueryRowContext(ctx, query, email).Scan(
        &user.ID, &user.Email, &user.Username, &user.PasswordHash, &user.AvatarURL, 
        &user.AuthProvider, &user.Role, &user.EmailVerified, &user.CreatedAt, &user.UpdatedAt,
    )
    if err == sql.ErrNoRows {
        return nil, nil
    }
    return &user, err
}
```

### Refresh Token Repository Functions

```go
// services/auth/internal/repository/refresh_token_repo.go

type RefreshTokenRepository interface {
    StoreRefreshToken(ctx context.Context, userID string, tokenHash string, expiresAt time.Time) error
    GetRefreshToken(ctx context.Context, userID string, tokenHash string) (*models.RefreshToken, error)
    RevokeToken(ctx context.Context, userID string, tokenHash string) error
    IsRevoked(ctx context.Context, userID string, tokenHash string) (bool, error)
    DeleteExpiredTokens(ctx context.Context) error
}

func (r *PostgresRefreshTokenRepository) StoreRefreshToken(ctx context.Context, userID string, tokenHash string, expiresAt time.Time) error {
    query := `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
        VALUES ($1, $2, $3, $4)
    `
    _, err := r.db.ExecContext(ctx, query, userID, tokenHash, expiresAt, time.Now())
    return err
}

func (r *PostgresRefreshTokenRepository) RevokeToken(ctx context.Context, userID string, tokenHash string) error {
    query := `
        UPDATE refresh_tokens
        SET revoked_at = $1
        WHERE user_id = $2 AND token_hash = $3
    `
    _, err := r.db.ExecContext(ctx, query, time.Now(), userID, tokenHash)
    return err
}

func (r *PostgresRefreshTokenRepository) DeleteExpiredTokens(ctx context.Context) error {
    query := `
        DELETE FROM refresh_tokens
        WHERE expires_at < now()
    `
    _, err := r.db.ExecContext(ctx, query)
    return err
}
```

---

## Migration Management

### Using Migrate Tool

**Install:**
```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

**Create migration:**
```bash
migrate create -ext sql -dir infra/migrations -seq create_users_table
```

**Run migrations:**
```bash
migrate -path infra/migrations -database "postgres://user:password@localhost/code_quest" up
```

**Rollback:**
```bash
migrate -path infra/migrations -database "postgres://user:password@localhost/code_quest" down
```

---

## Testing Checklist

- [ ] Unit test: Can create user with valid email
- [ ] Unit test: Cannot create user with duplicate email
- [ ] Unit test: Soft delete marks deleted_at timestamp
- [ ] Unit test: Query excludes soft-deleted users
- [ ] Unit test: Refresh token expiry validation
- [ ] Integration test: Full registration flow writes correct data
- [ ] Performance test: Email lookup < 10ms with index
- [ ] Data integrity test: Foreign key constraints enforced
