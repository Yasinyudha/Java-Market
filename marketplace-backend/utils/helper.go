package utils

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/smtp"

	"github.com/joho/godotenv"
)

func GenerateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func SentOTPEmail(targetEmail, otp string) error {
	err := godotenv.Load()
	if err != nil {
		return err
	}

	from := "yasinyudha20@gmail.com"
	password := "fpjfdpqgdirvusqa"
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	message := fmt.Appendf(nil,
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: Your OTP Verification Code \r\n\r\n"+
			"Kode OTP Anda adalah: %s. Kode ini berlaku selama 5 menit.",
		from, targetEmail, otp,
	)

	auth := smtp.PlainAuth("", from, password, smtpHost)
	err = smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{targetEmail}, message)
	return err
}
