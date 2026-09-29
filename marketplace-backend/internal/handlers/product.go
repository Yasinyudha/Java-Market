package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"marketplace/internal/database"
	"marketplace/internal/global"
	"net/http"

	"github.com/gin-gonic/gin"
)

const PublicURL = "https://txsegowmnagykxyqjxlz.supabase.co/storage/v1/object/public/public-marketplace/"

type ProductHandler struct {
	DB *sql.DB
}

type ProductRequest struct {
	PriceLow  string `json:"price_low"`
	PriceHigh string `json:"price_high"`
}

func (h *ProductHandler) FetchProduct(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ProductRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	baseQuery := `SELECT id, name, review_number, city, province, price, created_at, filepath, 
	                     COALESCE(country, ''), COALESCE(trademark, ''), COALESCE(address, ''), COALESCE(description, '') 
	              FROM products`

	var query string
	var args []interface{}

	if req.PriceHigh == "0" && req.PriceLow == "0" {
		query = baseQuery
	} else {
		query = baseQuery + " WHERE price BETWEEN ? AND ?"
		args = append(args, req.PriceLow, req.PriceHigh)
	}

	rows, err := h.DB.Query(query)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to execute query %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []global.Product
	for rows.Next() {
		var p global.Product
		err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.ReviewNumber,
			&p.City,
			&p.Province,
			&p.Price,
			&p.CreatedAt,
			&p.Filepath,
			&p.Country,
			&p.Trademark,
			&p.Address,
			&p.Description,
		)

		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to scan rows %v", err), http.StatusInternalServerError)
			return
		}

		// Assemble the URL
		if p.Filepath != "" {
			p.Filepath = PublicURL + p.Filepath
		}

		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, fmt.Sprintf("Failed to iterating rows %v", err), http.StatusInternalServerError)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(products)
}

type GetDetailProductHandler struct {
	DB *sql.DB
}

type GetDetailProductRequest struct {
	Slug string `json:"slug"`
}

func (h *GetDetailProductHandler) GetDetailProduct(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method is invalid", http.StatusMethodNotAllowed)
		return
	}

	var req GetDetailProductRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Body is disallowed", http.StatusBadRequest)
		return
	}

	query := `SELECT id, name, review_number, city, province, price, created_at, filepath,
		       COALESCE(country, ''), COALESCE(trademark, ''), COALESCE(address, ''), COALESCE(description, '') FROM products WHERE slug = ?`

	var p Product
	err = h.DB.QueryRowContext(r.Context(), query, req.Slug).Scan(
		&p.ID,
		&p.Name,
		&p.ReviewNumber,
		&p.City,
		&p.Province,
		&p.Price,
		&p.CreatedAt,
		&p.Filepath,
		&p.Country,
		&p.Trademark,
		&p.Address,
		&p.Description,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

type GetProductDetailRequest struct {
	ID int `json:"id"`
}

type GetProductDetailResponse struct {
	ID           int     `json:"id"`
	Name         string  `json:"name"`
	ReviewNumber float64 `json:"review_number"`
	City         string  `json:"city"`
	Province     string  `json:"province"`
	Price        float64 `json:"price"`
	Filepath     string  `json:"filepath"`
	Country      string  `json:"country"`
	Trademark    string  `json:"trademark"`
	Address      string  `json:"address"`
	Description  string  `json:"description"`
}

type GetProductDetailHandler struct {
	DB     *sql.DB
	Client *database.S3Client
}

func (h *GetProductDetailHandler) GetProductDetail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid HTTP method", http.StatusMethodNotAllowed)
		return
	}

	var req GetProductDetailRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var product GetProductDetailResponse
	query := `SELECT id, name, review_number, city, province, price, filepath, country, trademark, address, description 
			  FROM products WHERE id = ?`
	err = h.DB.QueryRowContext(r.Context(), query, req.ID).Scan(
		&product.ID,
		&product.Name,
		&product.ReviewNumber,
		&product.City,
		&product.Province,
		&product.Price,
		&product.Filepath,
		&product.Country,
		&product.Trademark,
		&product.Address,
		&product.Description,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}

		log.Printf("ERR Scan GetProductDetail: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	product.Filepath = PublicURL + product.Filepath

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

type GetCheckoutItemResponse struct {
	IDProduct int     `json:"id_product"`
	Quantity  int     `json:"quantity"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Filepath  string  `json:"filepath"`
}

type GetCheckoutItemHandler struct {
	DB *sql.DB
}

func (h *GetCheckoutItemHandler) GetCheckoutItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid HTTP method", http.StatusMethodNotAllowed)
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
		SELECT
			c.id_product,
			c.quantity,
			p.name,
			p.price,
			p.filepath
		FROM checkouts c
		JOIN products p ON c.id_product = p.id
		WHERE c.id_user = ?;
	`
	rows, err := h.DB.QueryContext(r.Context(), query, claims.ID)
	if err != nil {
		http.Error(w, "Failed to fetch cart items", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	cartItems := make([]GetCheckoutItemResponse, 0)
	for rows.Next() {
		var item GetCheckoutItemResponse
		err := rows.Scan(
			&item.IDProduct,
			&item.Quantity,
			&item.Name,
			&item.Price,
			&item.Filepath,
		)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}
		item.Filepath = PublicURL + item.Filepath
		cartItems = append(cartItems, item)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Error iterating rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cartItems)
}

type AddNewProductRequest struct {
	Name        string  `form:"name" binding:"required"`
	Price       float32 `form:"price" binding:"required"`
	City        string  `form:"city" binding:"required"`
	Province    string  `form:"province" binding:"required"`
	Country     string  `form:"country" binding:"required"`
	Trademark   string  `form:"trademark" binding:"required"`
	Address     string  `form:"address" binding:"required"`
	Description string  `form:"description" binding:"required"`
}

func AddNewProduct(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {

		var input AddNewProductRequest
		if err := c.ShouldBind(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation error: " + err.Error(),
			})
			return
		}

		fileHeader, err := c.FormFile("photo")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Foto produk wajib diunggah: " + err.Error(),
			})
			return
		}
		filepath := "products/" + fileHeader.Filename

		query := `
			INSERT INTO products (
				name, review_number, price, created_at, 
				filepath, city, province, country, trademark, 
				address, description, slug
			) 
			VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
		`

		_, err = db.ExecContext(c.Request.Context(), query,
			input.Name,
			0,
			input.Price,
			filepath,
			input.City,
			input.Province,
			input.Country,
			input.Trademark,
			input.Address,
			input.Description,
			"test",
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to insert product: " + err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Product created succesfully",
		})
	}
}
