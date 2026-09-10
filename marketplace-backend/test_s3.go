package main

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Muat variabel dari .env
	_ = godotenv.Load()

	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")
	bucketName := "marketplace"

	// Bersihkan URL dari awalan http:// atau https://
	cleanEndpoint := strings.TrimPrefix(endpoint, "https://")
	cleanEndpoint = strings.TrimPrefix(cleanEndpoint, "http://")

	// 2. Load Config menggunakan Static Credentials (dari .env)
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("ap-south-1"), // Region default Supabase
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		log.Fatalf("Gagal memuat config AWS: %v", err)
	}

	// 3. Buat S3 Client dengan Custom Endpoint Supabase
	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String("https://" + cleanEndpoint)
		o.UsePathStyle = true // Wajib bernilai true untuk Supabase/MinIO
	})

	// 4. List objects menggunakan client yang sudah dikonfigurasi
	output, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		log.Fatalf("Gagal membaca bucket: %v", err)
	}

	log.Printf("Menampilkan isi bucket '%s':", bucketName)
	if len(output.Contents) == 0 {
		log.Println("Bucket saat ini kosong.")
	} else {
		for _, object := range output.Contents {
			log.Printf("key=%s size=%d", aws.ToString(object.Key), *object.Size)
		}
	}
}
