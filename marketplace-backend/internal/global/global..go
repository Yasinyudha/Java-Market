package global

import (
	"database/sql"
	"marketplace/internal/database"
	"time"
)

type DatabaseSchema struct {
	DB       *sql.DB
	S3Client *database.S3Client
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
