package main

import (
  "fmt"
  "net/http"
)

func main() {
  http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "ok")
  })

  http.HandleFunc("/paths", func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    fmt.Fprintln(w, `[{"id":"p1","name":"React Fundamentals"}]`)
  })

  http.ListenAndServe(":8082", nil)
}
