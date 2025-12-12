import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { uploadToS3, saveToBackend } from "./upload-utils";

interface FileDropzoneProps {
    onStepChange?: (step: number) => void;
    onError?: (hasError: boolean) => void;
}

export function FileDropzone({ onStepChange, onError }: FileDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (files && files.length > 0) {
            setFile(files[0]);
        }
    };

    // Step 2: File selected
    useEffect(() => {
        if (file) {
            onStepChange?.(2);
        }
    }, [file, onStepChange]);

    const showError = (message: string) => {
        setErrorMessage(message);
        setShowErrorDialog(true);
        onError?.(true);
    };

    const handleTryAgain = () => {
        setShowErrorDialog(false);
        setErrorMessage(null);
        setFile(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
        onError?.(false);
        onStepChange?.(1);
    };

    const handleSuccessClose = () => {
        setShowSuccessDialog(false);
        setFile(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
        onStepChange?.(1);
    };

    const handleUpload = async () => {
        if (!file) return;

        // Reset error state and start fresh
        onError?.(false);
        onStepChange?.(2);
        setIsUploading(true);

        try {
            // Step 2-3: Upload to S3 via Lambda
            const { key } = await uploadToS3(file);
            onStepChange?.(3);
            console.log("S3 key:", key);



            // Step 3-4: Save to backend
            await saveToBackend(key, file.name);
            onStepChange?.(4);



            // Step 5: Success
            onStepChange?.(5);
            setShowSuccessDialog(true);
        } catch (error) {
            console.error(error);
            showError(error instanceof Error ? error.message : "Unexpected error during upload. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Error Dialog */}
            <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Upload Failed</AlertDialogTitle>
                        <AlertDialogDescription>
                            {errorMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleTryAgain}>
                            Try Again
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Drag + Drop Container */}

            {/* Success Dialog */}
            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader className="items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <svg
                                className="w-6 h-6 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <AlertDialogTitle>Job Accepted!</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            Your job has been successfully accepted. You can view your job status from the dashboard.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center">
                        <AlertDialogAction onClick={handleSuccessClose} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                            Close
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Drag + Drop Container */}
            <div
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer",
                    "bg-card text-muted-foreground border-border transition-colors",
                    isDragging
                        ? "border-primary bg-accent/40 text-foreground"
                        : "hover:bg-accent/30 hover:border-primary/60"
                )}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFiles(e.dataTransfer.files);
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />

                <div className="flex flex-col items-center gap-2">
                    <svg
                        className={cn(
                            "w-10 h-10",
                            isDragging ? "text-primary" : "text-muted-foreground"
                        )}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
                        <path d="M12 12V4m0 0l-4 4m4-4l4 4" />
                    </svg>

                    {file ? (
                        <p className="font-medium text-foreground">{file.name}</p>
                    ) : (
                        <p className="text-sm">
                            <span className="font-medium text-foreground">Drag & drop</span>{" "}
                            degraded image here or click to browse
                        </p>
                    )}
                </div>
            </div>

            {/* Upload Button */}
            <Button
                className="w-full"
                disabled={!file || isUploading}
                onClick={handleUpload}
            >
                {isUploading
                    ? "Uploading..."
                    : file
                        ? `Restore: ${file.name}`
                        : "Start Restoration"}
            </Button>
        </div>
    );
}
