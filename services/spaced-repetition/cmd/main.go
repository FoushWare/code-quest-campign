// services/spaced-repetition/cmd/main.go
//
// Spaced Repetition service stub — readiness root and `/healthz` for local dev.
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
		_, _ = w.Write([]byte(`{"service":"spaced-repetition","status":"ready","mode":"` + os.Getenv("SERVICE_MODE") + `"}`))
	})
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	addr := ":8080"
	if port := os.Getenv("PORT"); port != "" {
		addr = ":" + port
	}

	fmt.Println("spaced-repetition listening on", addr)
	_ = http.ListenAndServe(addr, mux)
}