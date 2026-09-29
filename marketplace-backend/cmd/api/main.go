package main

import (
	"log"
	"marketplace/internal/database"
	"marketplace/internal/handlers"
	objectstorage "marketplace/internal/objectstorage"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// Middleware CORS khusus Gin
func ginCORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}

		c.Next()
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

	// Inisialisasi Gin Router
	r := gin.Default()

	// Pasang Middleware CORS ke semua endpoint Gin
	r.Use(ginCORSMiddleware())

	s3Client, err := objectstorage.InitS3(os.Getenv("MINIO_BUCKET"))
	if err != nil {
		log.Fatalf("Failed to connect with object storage %v", err)
	}

	s3PublicClient, err := objectstorage.InitS3(os.Getenv("MINIO_PUBLIC_BUCKET"))
	if err != nil {
		log.Fatalf("Failed to connect with object storage %v", err)
	}

	// Fetch Products
	productHandler := &handlers.ProductHandler{DB: db}
	r.Any("/api/fetch/products", gin.WrapF(productHandler.FetchProduct))

	// Fetch Public Image
	fetchImageHandler := &handlers.FetchImageHandler{DB: db, S3Client: (*database.S3Client)(s3Client)}
	r.Any("/api/fetch/image", gin.WrapF(fetchImageHandler.FetchImage))

	// Fetch Signup Image
	fetchSignupHandler := &handlers.FetchSignupHandler{DB: db, S3Client: (*database.S3Client)(s3Client)}
	r.Any("/api/fetch/signup-image", gin.WrapF(fetchSignupHandler.FetchSignup))

	// Insert Signup
	insertSignupHandler := &handlers.InsertSignupHandler{DB: db, S3Client: (*database.S3Client)(s3Client)}
	r.Any("/api/user/signup", gin.WrapF(insertSignupHandler.InsertSignup))

	// User Profile
	getProfileHandler := &handlers.GetProfileHandler{DB: db, S3Client: (*database.S3Client)(s3Client)}
	r.Any("/api/user/profile", gin.WrapF(getProfileHandler.GetProfile))

	// Fetch Category
	r.Any("/api/fetch/category", gin.WrapF(handlers.FetchCategory))

	// Login
	loginHandler := &handlers.LoginHandler{DB: db, S3Client: (*database.S3Client)(s3Client)}
	r.Any("/api/user/login", gin.WrapF(loginHandler.LoginHandler))

	// Get Auth Credentials
	r.Any("/api/user/get-auth", gin.WrapF(handlers.GetMeAuth))

	// Detail Product
	getDetailProductHandler := &handlers.GetDetailProductHandler{DB: db}
	r.Any("/api/refresh/detail-product", gin.WrapF(getDetailProductHandler.GetDetailProduct))

	// Upload Avatar
	uploadAvatarHandler := &handlers.UploadAvatarHandler{DB: db, S3Client: (*database.S3Client)(s3Client)}
	r.Any("/upload", gin.WrapF(uploadAvatarHandler.UploadAvatar))

	// Change Credentials
	changeProfileCredentialHandler := &handlers.ChangeProfileCredentialHandler{DB: db}
	r.Any("/api/user/change-credentials", gin.WrapF(changeProfileCredentialHandler.ChangeProfileCredential))

	// Confirm Password
	confirmPasswordHandler := &handlers.ConfirmPasswordHandler{DB: db}
	r.Any("/api/user/change-password", gin.WrapF(confirmPasswordHandler.ConfirmPassword))

	// OTP Request
	OTPHandler := &handlers.OTPHandler{DB: db}
	r.Any("/api/user/generate-otp", gin.WrapF(OTPHandler.OTPRequestFunc))

	// Verify OTP
	verifyOTPHandler := &handlers.VerifyOTPHandler{DB: db}
	r.Any("/api/user/verify-otp", gin.WrapF(verifyOTPHandler.VerifyOTP))

	// Update Email
	updateEmailHandler := &handlers.UpdateEmailHandler{DB: db}
	r.Any("/api/user/update-email", gin.WrapF(updateEmailHandler.UpdateEmail))

	// Add to Checkout
	addToCheckoutHandler := &handlers.AddToCheckoutHandler{DB: db}
	r.Any("/api/user/add-checkout", gin.WrapF(addToCheckoutHandler.AddToCheckout))

	// Fetch Product Detail
	getProductDetailHandler := &handlers.GetProductDetailHandler{DB: db, Client: (*database.S3Client)(s3Client)}
	r.Any("/api/fetch/product-detail", gin.WrapF(getProductDetailHandler.GetProductDetail))

	// Get Checkouts
	getCheckoutItemHandler := &handlers.GetCheckoutItemHandler{DB: db}
	r.Any("/api/fetch/checkout", gin.WrapF(getCheckoutItemHandler.GetCheckoutItem))

	// Register Store
	registerStoreHandler := &handlers.RegisterStoreHandler{DB: db, S3Client: (*database.S3Client)(s3PublicClient)}
	r.Any("/api/user/register-store", gin.WrapF(registerStoreHandler.RegisterStore))

	// Add New Product (Gin Native Handler)
	r.POST("/api/add-products", handlers.AddNewProduct(db))

	log.Println("Server Gin running at http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
