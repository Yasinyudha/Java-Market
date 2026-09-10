import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./main";
import { useEffect, useRef, useState } from "react";

export function useFetchDataFromBucket(filePath: string) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // Use ref to track the active URL across async execution contexts
    const objectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!filePath) return;

        let active = true;

        const fetchImages = async () => {
            try {
                const command = new GetObjectCommand({
                    Bucket: "marketplace",
                    Key: filePath,
                });

                const response = await s3Client.send(command);

                if (response.Body && active) {
                    const byteArray =
                        await response.Body.transformToByteArray();
                    const blob = new Blob([byteArray], {
                        type: response.ContentType || "image/png",
                    });

                    // Clean up previous URL if filePath changes mid-lifecycle
                    if (objectUrlRef.current) {
                        URL.revokeObjectURL(objectUrlRef.current);
                    }

                    const newUrl = URL.createObjectURL(blob);
                    objectUrlRef.current = newUrl;
                    setImageUrl(newUrl);
                }
            } catch (err) {
                console.error("Error fetching bucket object:", err);
            }
        };

        fetchImages();

        // Cleanup executes on unmount or before filePath changes
        return () => {
            active = false;
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, [filePath]);

    return imageUrl;
}
