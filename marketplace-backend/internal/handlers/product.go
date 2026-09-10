package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"marketplace/internal/global"
	"net/http"
)

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

	// Set the public URL
	publicURL := "https://txsegowmnagykxyqjxlz.supabase.co/storage/v1/object/public/public-marketplace/"

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
			p.Filepath = publicURL + p.Filepath
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
