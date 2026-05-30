FROM golang:1.22-alpine AS build
WORKDIR /app
COPY . .
WORKDIR /app/services/content
RUN go build -o /out/content ./cmd/main.go

FROM alpine:3.20
WORKDIR /app
COPY --from=build /out/content /app/content
EXPOSE 8082
CMD ["/app/content"]
