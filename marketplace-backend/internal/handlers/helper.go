package handlers

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type UserRequest struct {
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	Email         string `json:"email"`
	Password      string `json:"password"`
	TermsAccepted bool   `json:"terms_accepted"`
}

type Claims struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	jwt.RegisteredClaims
}

type Product struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	ReviewNumber float64   `json:"review_number"`
	City         string    `json:"city"`
	Province     string    `json:"province"`
	Price        float64   `json:"price"`
	CreatedAt    time.Time `json:"created_at"`
	Filepath     string    `json:"filepath"`
	Country      string    `json:"country"`
	Trademark    string    `json:"trademark"`
	Address      string    `json:"address"`
	Description  string    `json:"description"`
}

func ValidateJWT(tokenString string) (*Claims, error) {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		return nil, errors.New("JWT_SECRET environment variable is not set")
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
