package main

import (
	"log"
	"marketplace/internal/database"
	"marketplace/internal/handlers"
	objectstorage "marketplace/internal/objectstorage"
	"net/http"

	"github.com/joho/godotenv"
)

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: File .env tidak ditemukan, membaca environment bawaan")
	}

	db, err := database.Connect()
	if err != nil {
		log.Fatalf("Connection failed: %v", err)
	}
	defer db.Close()

	_, err = objectstorage.InitS3()
	if err != nil {
		log.Fatalf("Can't connect to object storage: %s", err)
	}

	s3Client, err := objectstorage.InitS3()
	if err != nil {
		log.Fatalf("Failed to connect with object storage %v", err)
	}

	// Set API for fetching products
	productHandler := &handlers.ProductHandler{
		DB: db,
	}
	http.HandleFunc("/api/fetch/products", enableCORS(productHandler.FetchProduct))

	// Set API for fetching public image
	fetchImageHandler := &handlers.FetchImageHandler{
		DB:       db,
		S3Client: (*database.S3Client)(s3Client),
	}
	http.HandleFunc("/api/fetch/image", enableCORS(fetchImageHandler.FetchImage))

	// Set API for fetching sign up image
	fetchSignupHandler := &handlers.FetchSignupHandler{
		DB:       db,
		S3Client: (*database.S3Client)(s3Client),
	}
	http.HandleFunc("/api/fetch/signup-image", enableCORS(fetchSignupHandler.FetchSignup))

	// Set API for handling sign up
	insertSignupHandler := &handlers.InsertSignupHandler{
		DB:       db,
		S3Client: (*database.S3Client)(s3Client),
	}
	http.HandleFunc("/api/user/signup", enableCORS(insertSignupHandler.InsertSignup))

	// Set API for GET profile while JWT token is active
	getProfileHandler := &handlers.GetProfileHandler{
		DB:       db,
		S3Client: (*database.S3Client)(s3Client),
	}
	http.HandleFunc("/api/user/profile", enableCORS(getProfileHandler.GetProfile))

	// Set API for GET profile
	http.HandleFunc("/api/fetch/category", enableCORS(handlers.FetchCategory))

	// Set API for login handler
	loginHandler := &handlers.LoginHandler{
		DB:       db,
		S3Client: (*database.S3Client)(s3Client),
	}
	http.HandleFunc("/api/user/login", enableCORS(loginHandler.LoginHandler))

	// Set API for get user credentials after signup or login
	http.HandleFunc("/api/user/get-auth", enableCORS(handlers.GetMeAuth))

	// Set Api for detail product handler
	getDetailProductHandler := &handlers.GetDetailProductHandler{
		DB: db,
	}
	http.HandleFunc("/api/refresh/detail-product", enableCORS(getDetailProductHandler.GetDetailProduct))

	log.Println("Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
