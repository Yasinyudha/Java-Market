import React from "react";
import { createRoot } from "react-dom/client";
import { S3Client } from "@aws-sdk/client-s3";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

export const s3Client = new S3Client({
    endpoint: "http://localhost:9000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "admin",
        secretAccessKey: "password123",
    },
    forcePathStyle: true,
});

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
);
