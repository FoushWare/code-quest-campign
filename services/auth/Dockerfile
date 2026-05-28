FROM golang:1.20-alpine
WORKDIR /app
COPY . .
RUN go build -o auth ./cmd
CMD ["./auth"]
