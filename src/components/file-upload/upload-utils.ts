import axios from 'axios';
import api from '@/lib/api';

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL || "https://xghdixt5x3.execute-api.ap-south-1.amazonaws.com";
const UPLOAD_URL = `${LAMBDA_BASE_URL}/image/upload`;

/**
 * Converts a File to base64 string (without data:... prefix)
 */
export function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1]; // remove data:image/... prefix
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Gets the file extension from a filename
 */
export function getFileExtension(filename: string): string | undefined {
    return filename.split(".").pop()?.toLowerCase();
}

/**
 * Uploads a file to S3 via Lambda
 */
export async function uploadToS3(file: File): Promise<{ key: string }> {
    const ext = getFileExtension(file.name);
    if (!ext) {
        throw new Error("Could not detect file extension");
    }

    const base64 = await toBase64(file);

    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No auth token found");
    }

    const response = await axios.post<{ key: string }>(
        UPLOAD_URL,
        {
            file: base64,
            ext,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,

            },
        }
    );

    return { key: response.data.key };
}


/**
 * Sends the S3 key to the backend for storage
 */
export async function saveToBackend(
    key: string,
    imageName: string,
    modelUsed: "initial" | "trained" | "final",
    outputS3Key: string | null,
    mixWeather?: boolean
): Promise<void> {

    await new Promise(resolve => setTimeout(resolve, 1500));
    await api.post("/jobs", { key, imageName, modelUsed, outputS3Key, mixWeather });
}
