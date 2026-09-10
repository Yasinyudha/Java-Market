package database

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

func Connect() (*sql.DB, error) {
	dsn := "root:Kotek 212@tcp(localhost:3306)/marketplace?parseTime=true"

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("error opening database driver: %w", err)
	}

	// Verify that the database is reachable
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error pinging database: %w", err)
	}

	fmt.Println("Successfully connected to MySQL!")
	return db, nil
}
