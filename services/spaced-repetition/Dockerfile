FROM golang:1.22-alpine AS build
WORKDIR /app
COPY services/spaced-repetition ./services/spaced-repetition
WORKDIR /app/services/spaced-repetition
RUN go build -o /out/service ./cmd/main.go

FROM alpine:3.20
WORKDIR /app
COPY --from=build /out/service /app/service
EXPOSE 8080
CMD ["/app/service"]