package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"marketplace/internal/database"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type RegisterStoreRequest struct {
	Name          string `json:"name"`
	Slug          string `json:"slug"`
	PhoneNumber   string `json:"phone_number"`
	Description   string `json:"description"`
	Address       string `json:"address"`
	TermsAccepted bool   `json:"terms_accepted"`
}

type RegisterStoreHandler struct {
	DB       *sql.DB
	S3Client *database.S3Client
}

func (h *RegisterStoreHandler) RegisterStore(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 1. Ambil cookie auth_token untuk autentikasi user
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Unauthorized, please login first",
		})
		return
	}

	// 2. Parse claims dari JWT token
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(cookie.Value, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Invalid or expired session",
		})
		return
	}

	// 3. Parse Multipart Form Data (Maksimal ukuran file 10 MB)
	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Failed to parse form data", http.StatusBadRequest)
		return
	}

	var req RegisterStoreRequest
	req.Name = r.FormValue("name")
	req.Slug = r.FormValue("slug")
	req.PhoneNumber = r.FormValue("phone_number")
	req.Description = r.FormValue("description")
	req.Address = r.FormValue("address")
	req.TermsAccepted = r.FormValue("terms_accepted") == "true"

	// Validasi input dasar
	if !req.TermsAccepted {
		http.Error(w, "You must accept the terms and conditions", http.StatusBadRequest)
		return
	}
	if req.Name == "" || req.Slug == "" {
		http.Error(w, "Store name and slug are required", http.StatusBadRequest)
		return
	}

	// 4. Handle Upload Gambar Logo ke S3 jika file diunggah
	var logoKey string
	file, header, err := r.FormFile("logo")
	if err == nil {
		defer file.Close()

		// Generate key path unik di folder stores/
		ext := filepath.Ext(header.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		logoKey = fmt.Sprintf("stores/%s_%d%s", req.Slug, time.Now().Unix(), ext)

		contentType := header.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "image/jpeg"
		}

		// Dipanggil sesuai signature: UploadFile(ctx, objectKey, body, contentType)
		err = h.S3Client.UploadFile(r.Context(), logoKey, file, contentType)
		if err != nil {
			http.Error(w, "Failed to upload store logo to S3: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// 5. Simpan data toko ke tabel `stores`
	insertQuery := `
		INSERT INTO stores (id_user, name, slug, phone_number, description, address, logo_filepath)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	_, err = h.DB.ExecContext(
		r.Context(),
		insertQuery,
		claims.ID,
		req.Name,
		req.Slug,
		req.PhoneNumber,
		req.Description,
		req.Address,
		logoKey,
	)
	if err != nil {
		http.Error(w, "Failed to create store. Store name or username might already exist.", http.StatusInternalServerError)
		return
	}

	// 6. Perbarui JWT Token dengan status IsSeller = true
	expirationTime := time.Now().Add(24 * time.Hour)
	newClaims := &Claims{
		ID:        claims.ID,
		Email:     claims.Email,
		FirstName: claims.FirstName,
		LastName:  claims.LastName,
		IsSeller:  true,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
	tokenString, err := newToken.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "Failed to update session", http.StatusInternalServerError)
		return
	}

	// 7. Set ulang Cookie auth_token dengan JWT baru
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    tokenString,
		Expires:  expirationTime,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})

	// 8. Kirim Respon JSON Success
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Store registered successfully",
		"store": map[string]string{
			"name":          req.Name,
			"slug":          req.Slug,
			"logo_filepath": logoKey,
		},
	})
}
