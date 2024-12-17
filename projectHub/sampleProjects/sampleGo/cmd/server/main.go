package main

import (
	"log"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "sampleGo/docs" // This is required for swagger docs
	"sampleGo/internal/handlers"
)

// @title MyApp REST API
// @version 1.0
// @description This is a sample server for a Go application with auto-generated Swagger docs.
// @host localhost:8080
// @BasePath /

func main() {
	r := gin.Default()

	// Public routes
	r.GET("/health", handlers.HealthCheck)
	r.GET("/users", handlers.ListUsers)
	r.GET("/users/:id", handlers.GetUser)

	// Swagger endpoint
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	log.Println("Starting server on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
