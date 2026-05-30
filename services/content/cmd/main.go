// services/content/cmd/main.go
//
// Content service stub for local development.
// - Provides `/paths`, `/lessons/:id`, `/health` and a root readiness endpoint.
// - Useful for MFE UIs that need content lists and lesson payloads.
package main

import (
  "encoding/json"
  "fmt"
  "net/http"
  "os"
  "strings"
)

func main() {
  mux := http.NewServeMux()
  mux.HandleFunc("/", func(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(map[string]string{
      "service": "content",
      "status":  "ready",
      "mode":    os.Getenv("SERVICE_MODE"),
    })
  })
  mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
  })
  mux.HandleFunc("/paths", func(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode([]map[string]any{
      {"id": "p1", "name": "React Fundamentals", "nodes": 5},
      {"id": "p2", "name": "TypeScript Systems", "nodes": 6},
    })
  })
  mux.HandleFunc("/lessons/", func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    nodeID := strings.TrimPrefix(r.URL.Path, "/lessons/")
    _ = json.NewEncoder(w).Encode(map[string]any{
      "node_id": nodeID,
      "questions": []map[string]any{
        {"id": "q1", "type": "multiple_choice", "prompt": "What does JSX compile to?"},
        {"id": "q2", "type": "true_false", "prompt": "Zustand can manage local UI state."},
      },
    })
  })

  addr := ":8082"
  if port := os.Getenv("PORT"); port != "" {
    addr = ":" + port
  }

  fmt.Println("content listening on", addr)
  _ = http.ListenAndServe(addr, mux)
}
