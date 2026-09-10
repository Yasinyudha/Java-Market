package main

import (
	"log"
	"marketplace/internal/database"

	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Define form inputs
	firstName := "Tasya"
	lastName := "Mutiara"
	rawPassword := "admin123"
	email := "tasyamutiaradewi38@gmail.com"
	termsAccepted := false

	// Generate a salted hash
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}

	// Convert the hashed byte to string
	password := string(hashedBytes)

	// Call database insert function
	database.InsertToDatabase("users", firstName, lastName, email, password, termsAccepted)
}
