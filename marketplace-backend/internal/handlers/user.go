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

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginHandler struct {
	DB       *sql.DB
	S3Client *database.S3Client
}

func (h *LoginHandler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req loginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var userID, firstName, hashedPassword, email string
	var avatarKey sql.NullString

	query := `SELECT id, first_name, password, email, avatar_key FROM users WHERE email = ?`
	err = h.DB.QueryRowContext(r.Context(), query, req.Email).Scan(
		&userID, &firstName, &hashedPassword, &email, &avatarKey,
	)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"message":       "Invalid email or password",
		})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password))
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"message":       "Invalid email or password",
		})
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		ID:        userID,
		Email:     email,
		FirstName: firstName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "Failed to generate session", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    tokenString,
		Expires:  expirationTime,
		HttpOnly: true,                 // Mencegah akses via JavaScript
		Secure:   false,                // Set 'true' saat di environment HTTPS / Production
		SameSite: http.SameSiteLaxMode, // Proteksi CSRF
		Path:     "/",
	})

	var avatarURL string
	if avatarKey.Valid && avatarKey.String != "" {
		presignedURL, err := h.S3Client.GeneratePresignedURL(avatarKey.String)
		if err == nil {
			avatarURL = presignedURL
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"message":       "Login successful",
		"first_name":    firstName,
		"email":         email,
		"avatar_url":    avatarURL,
	})
}

type InsertUserHandler struct {
	DB *sql.DB
}

func (h *InsertUserHandler) InsertUserHandler(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	query := `INSERT INTO users (id, first_name, last_name, email, password, terms_accepted) 
				VALUES (UUID(), ?, ?, ?, ?, ?)`

	_, err = h.DB.ExecContext(ctx, query,
		req.FirstName,
		req.LastName,
		req.Email,
		string(hashedPassword),
		req.TermsAccepted,
	)
	if err != nil {
		log.Printf("Database insert error: %v", err)
		http.Error(w, "Failed to insert user to database", http.StatusInternalServerError)
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
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

	avatarFileName := "tasya-profile.jpg"
	avatarProxyUrl := fmt.Sprintf("http://localhost:8080/api/avatar/%s", avatarFileName)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"message":       "User registered and logged in successfully",
		"email":         req.Email,
		"first_name":    req.FirstName,
		"avatar_path":   avatarProxyUrl,
	})
}

func HandleUserAuth(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Cookie token not found", http.StatusUnauthorized)
		return
	}

	claims, err := ValidateJWT(cookie.Value)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"authenticated": false}`))
		return
	}

	avatarFileName := "tasya-profile.jpg"
	avatarProxyUrl := fmt.Sprintf("http://localhost:8080/api/avatar/%s", avatarFileName)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"email":         claims.Email,
		"first_name":    claims.FirstName,
		"avatar_path":   avatarProxyUrl,
	})
}
