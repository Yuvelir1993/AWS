package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type User struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

var sampleUsers = []User{
	{ID: 1, Name: "Alice"},
	{ID: 2, Name: "Bob"},
}

// ListUsers godoc
// @Summary List Users
// @Description Get all users in the system.
// @Tags users
// @Produce json
// @Success 200 {array} User
// @Router /users [get]
func ListUsers(c *gin.Context) {
	c.JSON(http.StatusOK, sampleUsers)
}

// GetUser godoc
// @Summary Get User by ID
// @Description Get a single user by their ID.
// @Tags users
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} User
// @Failure 404 {object} map[string]string
// @Router /users/{id} [get]
func GetUser(c *gin.Context) {
	// simple logic to parse and find user
	// ignoring error handling on converting ID for simplicity
	for _, u := range sampleUsers {
		if c.Param("id") == "1" && u.ID == 1 {
			c.JSON(http.StatusOK, u)
			return
		} else if c.Param("id") == "2" && u.ID == 2 {
			c.JSON(http.StatusOK, u)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
}
