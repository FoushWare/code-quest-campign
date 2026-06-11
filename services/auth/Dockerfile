FROM golang:1.22-alpine AS build
WORKDIR /app
COPY . .
WORKDIR /app/services/auth
RUN go build -o /out/auth ./cmd/main.go

FROM alpine:3.20
WORKDIR /app
COPY --from=build /out/auth /app/auth
EXPOSE 8081
CMD ["/app/auth"]
