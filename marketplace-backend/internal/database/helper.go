package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

type GeneralHandler struct {
	DB *sql.DB
}

type S3Client struct {
	Client *s3.Client
	Bucket string
}

func InsertToDatabase(tableName string, args ...any) {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Get database credentials via os.Getenv
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	// Connect to MySQL
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", dbUser, dbPass, dbHost, dbPort, dbName)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	query := fmt.Sprintf(`INSERT INTO %s (id, first_name, last_name, email, password, terms_accepted) VALUES (UUID(), ?, ?, ?, ?, ?)`, tableName)

	// Execute query
	_, err = db.Exec(query, args...)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("User inserted successfully")
}

func CreateTable(db *sql.DB, tableName string, columns map[string]string) error {
	// Base required columns
	columnDefs := []string{
		"id INT AUTO_INCREMENT PRIMARY KEY",
	}

	// Dynamically append custom columns
	for colName, colType := range columns {
		def := fmt.Sprintf("%s %s", colName, colType)
		columnDefs = append(columnDefs, def)
	}

	// Append the timestamp at the end
	columnDefs = append(columnDefs, "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

	query := fmt.Sprintf(
		"CREATE TABLE IF NOT EXISTS %s (\n %s\n)",
		tableName,
		strings.Join(columnDefs, ", \n"),
	)

	// Execute the statement
	_, err := db.Exec(query)
	if err != nil {
		return fmt.Errorf("Failed to create table %w", err)
	}

	fmt.Printf("Table %s has created successfully", tableName)
	return nil
}

func (s *S3Client) GeneratePresignedURL(objectKey string) (string, error) {
	if objectKey == "" {
		return "", nil
	}

	// Presigned URL initialization
	presignClient := s3.NewPresignClient(s.Client)

	req, err := presignClient.PresignGetObject(context.Background(), &s3.GetObjectInput{
		Bucket: aws.String(s.Bucket),
		Key:    aws.String(objectKey),
	}, s3.WithPresignExpires(24*time.Hour))

	if err != nil {
		return "", fmt.Errorf("Failed to create presigned URL %v", err)
	}

	return req.URL, nil
}
