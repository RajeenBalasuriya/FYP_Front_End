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
 * Uploads an array of files to S3 via Lambda
 */
interface UploadKey {
    key: string;
    originalName: string;
}

export async function uploadBatchToS3(files: File[]): Promise<UploadKey[]> {
    if (files.length === 0) return [];

    const payloads = await Promise.all(
        files.map(async (file) => ({
            file: await toBase64(file),
            ext: getFileExtension(file.name) || "jpg",
            name: file.name
        }))
    );

    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No auth token found");
    }

    const response = await axios.post<{ uploaded: UploadKey[] }>(
        UPLOAD_URL,
        { files: payloads },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.uploaded;
}

/**
 * Sends the batch summary to the backend for storage
 */
export async function saveBatchToBackend(
    uploadedFiles: UploadKey[],
    modelUsed: "initial" | "trained" | "final",
    mixWeather?: boolean
): Promise<void> {

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const payloads = uploadedFiles.map((file) => ({
        key: file.key,
        imageName: file.originalName,
        modelUsed,
        mixWeather,
        outputS3Key: null
    }));
    
    await api.post("/jobs/batch", payloads);
}
