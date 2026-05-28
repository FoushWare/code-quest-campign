FROM golang:1.21-alpine AS builder
WORKDIR /app

RUN apk add --no-cache git

# Copy source
COPY services/content ./

WORKDIR /app/services/content

# Download modules if go.mod present
RUN if [ -f go.mod ]; then go mod download; fi

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/bin/content-service ./cmd/main.go || true

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/bin/content-service ./content-service
EXPOSE 8082
HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD ["/bin/sh","-c","curl -f http://localhost:8082/health || exit 1"]
CMD ["/app/content-service"]
