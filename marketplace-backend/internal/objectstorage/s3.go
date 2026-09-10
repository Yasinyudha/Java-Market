package objectstorage

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

type S3Client struct {
	Client *s3.Client
	Bucket string
}

func InitS3() (*S3Client, error) {
	// 1. Muat variabel dari .env
	_ = godotenv.Load()

	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")
	bucketName := os.Getenv("MINIO_BUCKET")

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
		o.UsePathStyle = true
	})

	return &S3Client{
		Client: client,
		Bucket: bucketName,
	}, nil
}
