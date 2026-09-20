package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"marketplace/internal/database"
	"marketplace/utils"
	"net/http"
	"os"
	"path/filepath"
	"strings"
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

	var userID, firstName, lastName, hashedPassword, email string
	var avatarKey sql.NullString
	var isSeller bool

	query := `SELECT 
			id, first_name, last_name, password, email, avatar_key,
			EXISTS(SELECT 1 FROM stores WHERE id_user = users.id) AS is_seller
		FROM users
		WHERE email = ?`
	err = h.DB.QueryRowContext(r.Context(), query, req.Email).Scan(
		&userID, &firstName, &lastName, &hashedPassword, &email, &avatarKey, &isSeller,
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
		LastName:  lastName,
		IsSeller:  isSeller,
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
		} else {
			http.Error(w, fmt.Sprint(err), http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"message":       "Login successful",
		"first_name":    firstName,
		"last_name":     lastName,
		"email":         email,
		"avatar_url":    avatarURL,
		"is_seller":     isSeller,
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

func GetMeAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("auth_token")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"message":       "Session expired or not found",
		})
		return
	}

	claims, err := ValidateJWT(cookie.Value)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"message":       "Invalid or expired token",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"id":            claims.ID,
		"first_name":    claims.FirstName,
		"last_name":     claims.LastName,
		"email":         claims.Email,
	})
}

type UploadAvatarHandler struct {
	DB       *sql.DB
	S3Client *database.S3Client
}

func (h *UploadAvatarHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Method not allowed. Please use POST",
		})
		return
	}

	cookie, err := r.Cookie("auth_token")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Unauthorized",
		})
		return
	}

	claims, err := ValidateJWT(cookie.Value)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Invalid cookie auth token",
		})
		return
	}

	err = r.ParseMultipartForm(5 << 20)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "File size exceeded",
		})
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Invalid file type",
		})
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Unsupported file, please use file with extension .JPG, or .JPEG, or .PNG",
		})
		return
	}

	objectKey := fmt.Sprintf("users/user_%s_%d%s", claims.ID, time.Now().Unix(), ext)

	err = h.S3Client.UploadFile(r.Context(), objectKey, file, header.Header.Get("Content-Type"))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Failed to upload file to S3 storage",
		})
		return
	}

	query := `UPDATE users SET avatar_key = ? WHERE id = ?`
	_, err = h.DB.ExecContext(r.Context(), query, objectKey, claims.ID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Failed to upload",
		})
		return
	}

	presignedURL, err := h.S3Client.GeneratePresignedURL(objectKey)
	if err != nil {
		presignedURL = ""
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "Upload success",
		"filepath": presignedURL,
	})
}

type ChangeProfileCredentialRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

type ChangeProfileCredentialHandler struct {
	DB *sql.DB
}

func (h *ChangeProfileCredentialHandler) ChangeProfileCredential(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "HTTP method is not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Session expired, try to log in", http.StatusInternalServerError)
		return
	}

	claims, err := ValidateJWT(cookie.Value)
	if err != nil {
		http.Error(w, "Session or token is invalid, try to log in again", http.StatusInternalServerError)
		return
	}

	var req ChangeProfileCredentialRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	query := `UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?`
	_, err = h.DB.ExecContext(r.Context(), query, req.FirstName, req.LastName, req.Email, claims.ID)
	if err != nil {
		http.Error(w, "Failed to update credentials", http.StatusInternalServerError)
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	newClaims := &Claims{
		ID:        claims.ID,
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "Failed to generate session token", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    tokenString,
		Path:     "/",
		Expires:  expirationTime,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Profile updated successfully",
		"user": map[string]string{
			"first_name": req.FirstName,
			"last_name":  req.LastName,
			"email":      req.Email,
		},
	})
}

type ConfirmPasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
	ConfirmPassword string `json:"confirm_password"`
}

type ConfirmPasswordHandler struct {
	DB *sql.DB
}

func (h *ConfirmPasswordHandler) ConfirmPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method is not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Session expired, try to log in", http.StatusInternalServerError)
		return
	}

	claims, err := ValidateJWT(cookie.Value)
	if err != nil {
		http.Error(w, "Session or token is invalid, try to log in again", http.StatusInternalServerError)
		return
	}

	var req ConfirmPasswordRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var storedHashedPassword string
	query := "SELECT password FROM users WHERE id = ?"
	err = h.DB.QueryRowContext(r.Context(), query, claims.ID).Scan(
		&storedHashedPassword,
	)
	if err != nil {
		http.Error(w, "Failed to fetch password", http.StatusInternalServerError)
		return
	}

	// Current password and stored password in database should be the same
	err = bcrypt.CompareHashAndPassword([]byte(storedHashedPassword), []byte(req.CurrentPassword))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Current password is incorrect",
		})
		return
	}

	// New password and confirmed password should be the same
	if req.NewPassword != req.ConfirmPassword {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Proposed password does not same with confirmed password",
		})
		return
	}

	// If all conditions met, then push new password to database
	newHashedPassword, err := HashPassword(req.NewPassword)
	if err != nil {
		http.Error(w, "Failed to encrypt proposed password", http.StatusInternalServerError)
		return
	}

	query = "UPDATE users SET password = ? WHERE id = ?"
	_, err = h.DB.ExecContext(r.Context(), query, newHashedPassword, claims.ID)
	if err != nil {
		http.Error(w, "Failed to update proposed password to database", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password changed successfully",
	})
}

type OTPRequest struct {
	Email string `json:"email"`
}

type OTPHandler struct {
	DB *sql.DB
}

func (h *OTPHandler) OTPRequestFunc(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid HTTP method", http.StatusMethodNotAllowed)
		return
	}

	var req OTPRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	otp, err := utils.GenerateOTP()
	if err != nil {
		http.Error(w, "Failed to generate OTP", http.StatusInternalServerError)
		return
	}

	expiresAt := time.Now().Add(5 * time.Minute)

	_, _ = h.DB.ExecContext(r.Context(), "DELETE FROM otp_codes WHERE email = ?", req.Email)

	query := "INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (?, ?, ?)"
	_, err = h.DB.ExecContext(r.Context(), query, req.Email, otp, expiresAt)
	if err != nil {
		http.Error(w, "Failed to create OTP", http.StatusInternalServerError)
		return
	}

	err = utils.SentOTPEmail(req.Email, otp)
	if err != nil {
		http.Error(w, "Failed to send OTP through your email", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "OTP sent successfully",
	})
}

type VerifyOTPRequest struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
}

type VerifyOTPHandler struct {
	DB *sql.DB
}

func (h *VerifyOTPHandler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid HTTP method", http.StatusMethodNotAllowed)
		return
	}

	var req VerifyOTPRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	var storedOTP string
	var expiresAt time.Time

	query := "SELECT otp_code, expires_at FROM otp_codes WHERE email = ?"
	err = h.DB.QueryRowContext(r.Context(), query, req.Email).Scan(&storedOTP, &expiresAt)
	if err == sql.ErrNoRows {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "OTP not found or expired"})
		return
	} else if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Database error"})
		return
	}

	// Check if OTP code expired
	if time.Now().After(expiresAt) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "OTP has expired",
		})
		return
	}

	// Check sameness between requested OTP and stored OTP
	if storedOTP != req.OTP {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Invalid OTP",
		})
		return
	}

	// Delete OTP if all of the criterias are met
	_, _ = h.DB.ExecContext(r.Context(), "DELETE FROM otp_codes WHERE email = ?", req.Email)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "OTP verification successful",
	})
}

type UpdateEmailHandler struct {
	DB *sql.DB
}

type UpdateEmailRequest struct {
	Email string `json:"email"`
}

func (h *UpdateEmailHandler) UpdateEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid HTTP method", http.StatusMethodNotAllowed)
		return
	}

	var req UpdateEmailRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Session expired, try to log in", http.StatusInternalServerError)
		return
	}

	claims, err := ValidateJWT(cookie.Value)
	if err != nil {
		http.Error(w, "Session or token is invalid, try to log in again", http.StatusInternalServerError)
		return
	}

	claims.Email = req.Email

	query := "UPDATE users SET email = ? WHERE id = ?"
	_, err = h.DB.ExecContext(r.Context(), query, claims.Email, claims.ID)
	if err != nil {
		http.Error(w, "Failed to update database", http.StatusInternalServerError)
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims.ExpiresAt = jwt.NewNumericDate(expirationTime)
	claims.IssuedAt = jwt.NewNumericDate(time.Now())

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
		Path:     "/",
		Expires:  expirationTime,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Email updated successfully",
	})
}

type AddToCheckoutRequest struct {
	IDProduct int `json:"id_product"`
	Quantity  int `json:"quantity"`
}

type AddToCheckoutHandler struct {
	DB *sql.DB
}

func (h *AddToCheckoutHandler) AddToCheckout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid HTTP method", http.StatusMethodNotAllowed)
		return
	}

	var req AddToCheckoutRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Session expired, try to log in", http.StatusInternalServerError)
		return
	}

	claims, err := ValidateJWT(cookie.Value)
	if err != nil {
		http.Error(w, "Session or token is invalid, try to log in again", http.StatusInternalServerError)
		return
	}

	query := `
		INSERT INTO checkouts (id_user, id_product, quantity)
		VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE 
			quantity = VALUES(quantity)
	`
	_, err = h.DB.ExecContext(r.Context(), query,
		claims.ID,
		req.IDProduct,
		req.Quantity,
	)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Failed to add item to checkout",
			"error":   err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Item added to checkout successfully",
	})
}
