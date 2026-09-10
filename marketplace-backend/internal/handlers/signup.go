package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"marketplace/internal/database"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type FetchSignupHandler struct {
	DB       *sql.DB
	S3Client *database.S3Client
}

type Signup struct {
	Filepath string `json:"filepath"`
}

func (h *FetchSignupHandler) FetchSignup(w http.ResponseWriter, r *http.Request) {
	publicURL := "https://txsegowmnagykxyqjxlz.supabase.co/storage/v1/object/public/public-marketplace/assets/login-image.png"

	response := Signup{
		Filepath: publicURL,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

type FetchImageHandler struct {
	DB       *sql.DB
	S3Client *database.S3Client
}

type userRequestImage struct {
	Filepath string `json:"filepath"`
}

func (h *FetchImageHandler) FetchImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req userRequestImage
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Failed to process body", http.StatusBadRequest)
		return
	}

	publicURL := fmt.Sprintf("https://txsegowmnagykxyqjxlz.supabase.co/storage/v1/object/public/public-marketplace/%s", req.Filepath)

	response := Signup{
		Filepath: publicURL,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

type InsertSignupHandler struct {
	DB       *sql.DB
	S3Client *database.S3Client
}

func (h *InsertSignupHandler) InsertSignup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req UserRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Failed to process security credentials", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to process security credentials", http.StatusInternalServerError)
		return
	}

	userID := uuid.New().String()

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	query := `INSERT INTO users (id, first_name, last_name, email, password, terms_accepted, avatar_key) 
				VALUES (?, ?, ?, ?, ?, ?, ?)`
	avatarFileName := "users/tasya-profile.jpg"

	_, err = h.DB.ExecContext(ctx, query,
		userID,
		req.FirstName,
		req.LastName,
		req.Email,
		string(hashedPassword),
		req.TermsAccepted,
		avatarFileName,
	)
	if err != nil {
		log.Printf("Database insert error: %v", err)
		http.Error(w, "Failed to insert user to database", http.StatusInternalServerError)
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		ID:        userID,
		Email:     req.Email,
		FirstName: req.FirstName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "Failed to generate session token", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    tokenString,
		Expires:  expirationTime,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})

	url, err := h.S3Client.GeneratePresignedURL(avatarFileName)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create presigned URL %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"message":       "User registered and logged in successfully",
		"email":         req.Email,
		"first_name":    req.FirstName,
		"avatar_path":   url,
	})
}

type GetProfileHandler struct {
	DB       *sql.DB
	S3Client *database.S3Client
}

func (h *GetProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("auth_token")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"message":       "No session token found",
		})
		return
	}

	// 2. Validasi token JWT
	claims, err := ValidateJWT(cookie.Value)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"message":       "Invalid or expired session",
		})
		return
	}

	// 3. Query data user berdasarkan ID dari JWT claims
	var firstName, email string
	var avatarKey sql.NullString

	query := `SELECT first_name, email, avatar_key FROM users WHERE id = ?`
	err = h.DB.QueryRowContext(r.Context(), query, claims.ID).Scan(&firstName, &email, &avatarKey)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"message":       "User not found",
		})
		return
	}

	// 4. Buat Presigned URL baru (berlaku 24 jam) jika avatar_key tersedia
	var avatarURL string
	if avatarKey.Valid && avatarKey.String != "" {
		presignedURL, err := h.S3Client.GeneratePresignedURL(avatarKey.String)
		if err == nil {
			avatarURL = presignedURL
		}
	}

	// 5. Kembalikan data profil beserta Presigned URL terbaru
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"first_name":    firstName,
		"email":         email,
		"avatar_url":    avatarURL,
	})
}
