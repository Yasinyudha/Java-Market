package main

import (
	"flag"
	"fmt"
	"os"
	"strings"
)

func handleCreate(args []string) {
	createCmd := flag.NewFlagSet("create", flag.ExitOnError)
	nameFlag := createCmd.String("name", "", "Name of the table")
	createCmd.Parse(args)

	if *nameFlag == "" {
		fmt.Println("Error: --name flag is required.")
		os.Exit(1)
	}

	tableName := strings.ToLower(*nameFlag)
	n := len(tableName)

	// Slice singular name if ends in 's'
	fileName := tableName
	structName := strings.ToUpper(tableName[:1]) + tableName[1:]
	if strings.HasSuffix(tableName, "s") && n > 1 {
		fileName = tableName[:n-1]
		structName = strings.ToUpper(tableName[:1]) + tableName[1:n-1]
	}

	template := fmt.Sprintf(`package database

import (
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
)

type %s struct {}

func Create%sTable(db *sql.DB) error {
	query := `+"`"+`
	CREATE TABLE IF NOT EXISTS %s (
		id INT AUTO_INCREMENT PRIMARY KEY,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`+"`"+`

	_, err := db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to create %s table: %%w", err)
	}

	fmt.Println("Table '%s' created successfully.")
	return nil
}
`, structName, structName, tableName, tableName, tableName)

	targetDir := "internal/database"
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		fmt.Printf("Directory error: %v\n", err)
		os.Exit(1)
	}

	filePath := fmt.Sprintf("%s/%s.go", targetDir, fileName)

	if _, err := os.Stat(filePath); err == nil {
		fmt.Printf("File already exists at %s\n", filePath)
		os.Exit(1)
	}

	if err := os.WriteFile(filePath, []byte(template), 0644); err != nil {
		fmt.Printf("Write error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Generated model file: %s\n", filePath)
}

func main() {
	if len(os.Args) < 2 {
		os.Exit(1)
	}

	subcommand := os.Args[1]

	switch subcommand {
	case "create":
		handleCreate(os.Args[2:])
	}
}
