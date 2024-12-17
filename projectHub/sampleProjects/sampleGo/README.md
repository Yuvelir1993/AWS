# MyApp

A sample Go project that provides a few public RESTful APIs and auto-generated Swagger documentation.

## Features

- Simple REST APIs for health checks and user retrieval.
- Auto-generated Swagger documentation using [swaggo/swag](https://github.com/swaggo/swag).
- Uses [Gin](https://github.com/gin-gonic/gin) as the HTTP framework.

## Project Structure

cmd/
server/
    main.go        // Entry point for the server
internal/
    handlers/        // Handlers for various endpoints
        health.go
        users.go
docs/              // Auto-generated Swagger docs
swagger.json
docs.go
go.mod
go.sum



## Getting Started

1. **Install Dependencies:**
```bash
go mod tidy
go install github.com/swaggo/swag/cmd/swag@latest
```
2. **Generate Swagger Docs:**
```bash
swag init -g cmd/server/main.go -o docs
npx @redocly/cli build-docs docs/swagger.yaml -o docs/index.html
```
3. **Run the Server:**
```bash
go run ./cmd/server
```

The server runs on http://localhost:8080.

### Endpoints
Health Check:
GET http://localhost:8080/health

List Users:
GET http://localhost:8080/users

Get User By ID:
GET http://localhost:8080/users/{id}

Swagger UI
Once the server is running, access the Swagger UI at:
http://localhost:8080/swagger/index.html