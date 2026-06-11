// services/leaderboard/cmd/main.go
//
// Leaderboard service stub — provides a readiness root and a `/healthz` endpoint.
package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"service":"leaderboard","status":"ready","mode":"` + os.Getenv("SERVICE_MODE") + `"}`))
	})
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	addr := ":8080"
	if port := os.Getenv("PORT"); port != "" {
		addr = ":" + port
	}

	fmt.Println("leaderboard listening on", addr)
	_ = http.ListenAndServe(addr, mux)
}