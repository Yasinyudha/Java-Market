package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func FetchCategory(w http.ResponseWriter, r *http.Request) {
	// Set the public URL
	publicURL := "https://txsegowmnagykxyqjxlz.supabase.co/storage/v1/object/public/public-marketplace/"

	// Set the most three biggest category
	biggestCategory := [3]string{"sport", "food", "fashion"}

	// Set final public URL
	var finalUrls []string
	for _, category := range biggestCategory {
		finalUrls = append(finalUrls, fmt.Sprintf("%s/category/%s-category.jpg", publicURL, category))
	}

	response := map[string][]string{
		"categories":   biggestCategory[:],
		"category_url": finalUrls,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
