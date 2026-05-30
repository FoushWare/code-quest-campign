// services/auth/cmd/main.go
//
// Auth service stub for local development.
// - Exposes minimal endpoints used by frontend MFEs: "/" (status), "/health", "/auth/register", "/auth/login".
// - Controlled by `SERVICE_MODE` env var and `PORT` for dev overrides.
package main

import (
  "encoding/json"
  "fmt"
  "net/http"
  "os"
)

func main() {
  mux := http.NewServeMux()
  mux.HandleFunc("/", func(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(map[string]string{
      "service": "auth",
      "status":  "ready",
      "mode":    os.Getenv("SERVICE_MODE"),
    })
  })
  mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
  })
  mux.HandleFunc("/auth/register", func(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(map[string]any{
      "user_id": "stub-user-1",
      "email": "learner@example.com",
      "message": "registration stub",
    })
  })
  mux.HandleFunc("/auth/login", func(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(map[string]any{
      "access_token": "stub-access-token",
      "refresh_token": "stub-refresh-token",
    })
  })

  addr := ":8081"
  if port := os.Getenv("PORT"); port != "" {
    addr = ":" + port
  }

  fmt.Println("auth listening on", addr)
  _ = http.ListenAndServe(addr, mux)
}
