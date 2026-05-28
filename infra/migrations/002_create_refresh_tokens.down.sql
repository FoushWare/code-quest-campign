-- infra/migrations/002_create_refresh_tokens.down.sql
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP TABLE IF EXISTS refresh_tokens;
