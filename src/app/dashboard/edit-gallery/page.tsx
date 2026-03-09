"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    ChevronLeft,
    ChevronRight,
    Download,
    AlertCircle,
    ImageOff,
    Loader2,
    Images,
    Sparkles,
    Clock,
    HardDrive,
    Trash2
} from "lucide-react";

// Types
interface GalleryImage {
    key: string;
    url: string;
    size: number;
    lastModified: string;
}

interface GalleryResponse {
    items: GalleryImage[];
    nextCursor: string | null;
}

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL || "https://xghdixt5x3.execute-api.ap-south-1.amazonaws.com";
const IMAGES_PER_PAGE = 12;

// Animation delay classes for staggered entrance
const getAnimationDelay = (index: number): string => {
    const delays = [
        'animation-delay-100', 'animation-delay-200', 'animation-delay-300', 'animation-delay-400',
        'animation-delay-500', 'animation-delay-600', 'animation-delay-700', 'animation-delay-800',
        'animation-delay-900', 'animation-delay-1000', 'animation-delay-1100', 'animation-delay-1200'
    ];
    return delays[index % delays.length];
};

export default function EditGallery() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Database mapped metadata
    const [metadataMap, setMetadataMap] = useState<Record<string, { imageName: string, niqe?: number, brisque?: number }>>({});

    // Preview dialog state
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

    // Deletion state
    const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Intersection observer ref for infinite scroll
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // Fetch images from API
    const fetchImages = useCallback(async (cursor?: string | null) => {
        if (isLoading || (!hasMore && cursor)) return;

        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Authentication required. Please log in.");
            }

            const params = new URLSearchParams({ limit: IMAGES_PER_PAGE.toString() });
            if (cursor) {
                params.append("cursor", cursor);
            }

            const response = await axios.get<GalleryResponse>(
                `${LAMBDA_BASE_URL}/image/restored?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;

            if (!data || !Array.isArray(data.items)) {
                throw new Error("Unable to access gallery data. Please try again later.");
            }

            const { items, nextCursor: newCursor } = data;

            // Immediately fetch rich metadata from MySQL backend using the returned S3 keys
            if (items.length > 0) {
                try {
                    const keysToFetch = items.map(img => img.key);
                    const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3005";
                    const metaRes = await axios.post(
                        `${backendUrl}/api/v1/jobs/metadata-batch`,
                        { keys: keysToFetch },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (Array.isArray(metaRes.data)) {
                        setMetadataMap(prev => {
                            const updatedMap = { ...prev };
                            metaRes.data.forEach((dbJob: any) => {
                                updatedMap[dbJob.outputS3Key] = dbJob;
                            });
                            return updatedMap;
                        });
                    }
                } catch (metaErr) {
                    console.error("Failed to fetch batch metadata from backend:", metaErr);
                }
            }

            setImages((prev) => {
                const existingKeys = new Set(prev.map((img) => img.key));
                const newItems = items.filter((img) => !existingKeys.has(img.key));
                return [...prev, ...newItems];
            });

            setNextCursor(newCursor);
            setHasMore(newCursor !== null);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                    return;
                }
                setError(err.response?.data?.message || "Failed to load images");
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
            setIsInitialLoad(false);
        }
    }, [isLoading, hasMore]);

    // Initial load
    useEffect(() => {
        fetchImages();
    }, []);

    // Set up intersection observer for infinite scroll
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    fetchImages(nextCursor);
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [hasMore, isLoading, nextCursor, fetchImages]);

    // Handle image load error
    const handleImageError = (key: string) => {
        setImageLoadErrors((prev) => new Set(prev).add(key));
    };

    // Navigate preview
    const navigatePreview = (direction: "prev" | "next") => {
        if (selectedIndex === null) return;

        const newIndex = direction === "prev"
            ? Math.max(0, selectedIndex - 1)
            : Math.min(images.length - 1, selectedIndex + 1);

        setSelectedIndex(newIndex);
    };

    // Download image
    const handleDownload = async (image: GalleryImage) => {
        try {
            // Using fetch to download cross-origin images often triggers strict CORS blocks 
            // since S3 doesn't return Access-Control-Allow-Origin headers for the raw GET requests.
            // Instead, we can force a download by appending 'response-content-disposition=attachment' 
            // to the S3 URL if possible, or by simply opening it in a new tab if it's an AWS Signed URL.

            // For AWS S3 URLs, the cleanest way to force download without CORS issues from the frontend
            // is creating a hidden anchor tab that targets _blank.
            const a = document.createElement("a");
            a.href = image.url;
            a.download = image.key.split("/").pop() || "restored-image.jpg";
            a.target = "_blank"; // Fallback to opening in new tab if S3 ignores the download attr
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download failed:", err);
            // Fallback
            window.open(image.url, "_blank");
        }
    };

    // Delete image handler
    const handleDelete = async () => {
        if (!imageToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication required.");

            // 1. Delete from S3 directly via Lambda (API Gateway CORS now updated)
            await axios.delete(`${LAMBDA_BASE_URL}/image/delete?key=${encodeURIComponent(imageToDelete.key)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Delete metadata from NestJS Backend synchronously
            const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3005";
            await axios.delete(`${backendUrl}/api/v1/jobs/gallery-item?outputS3Key=${encodeURIComponent(imageToDelete.key)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. Remove the image from the visual grid
            setImages((prev) => prev.filter((img) => img.key !== imageToDelete.key));

            // Close preview overlay if the deleted image was active
            if (selectedIndex !== null && images[selectedIndex]?.key === imageToDelete.key) {
                setSelectedIndex(null);
            }

            // Close dialog
            setImageToDelete(null);

        } catch (err: any) {
            console.error("Deletion failed:", err);
            alert("Failed to delete the image. " + (err.response?.data?.message || err.message));
        } finally {
            setIsDeleting(false);
        }
    };

    // Format file size
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Format date
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Calculate total size
    const totalSize = useMemo(() => {
        const bytes = images.reduce((acc, img) => acc + img.size, 0);
        return formatSize(bytes);
    }, [images]);

    // Skeleton loader for initial load
    const renderSkeletons = () => (
        <div className="rounded-md border animate-fade-in-up">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Preview</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Modified</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-12 w-12 rounded-md shimmer" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-48 shimmer mb-2" /><Skeleton className="h-3 w-32 shimmer opacity-50" /></TableCell>
                            <TableCell><Skeleton className="h-3 w-16 shimmer mb-1" /><Skeleton className="h-3 w-16 shimmer" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24 shimmer" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32 shimmer" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto shimmer" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    // Error state
    if (error && images.length === 0) {
        return (
            <div className="p-6">
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                    <div className="rounded-full bg-destructive/10 p-6 empty-state-icon">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold">Failed to Load Gallery</h3>
                        <p className="text-muted-foreground max-w-md">{error}</p>
                    </div>
                    <Button onClick={() => fetchImages()} variant="outline" size="lg" className="gap-2">
                        <Loader2 className="h-4 w-4" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            {/* Hero Section */}
            <div className="gallery-hero animate-fade-in-up">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <Images className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight gradient-text-animated">
                            Edit Gallery
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Your collection of AI-restored images. Each image has been enhanced using advanced
                        weather restoration algorithms.
                    </p>

                    {/* Stats Row */}
                    {!isInitialLoad && (
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            <div className="stats-badge">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>{images.length} images</span>
                            </div>
                            {images.length > 0 && (
                                <>
                                    <div className="stats-badge">
                                        <HardDrive className="h-3.5 w-3.5" />
                                        <span>{totalSize} total</span>
                                    </div>
                                    <div className="stats-badge">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>
                                            Latest: {formatDate(images[0]?.lastModified || new Date().toISOString())}
                                        </span>
                                    </div>
                                </>
                            )}
                            {hasMore && (
                                <span className="text-xs text-muted-foreground ml-2">
                                    • Scroll for more
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {isInitialLoad ? (
                renderSkeletons()
            ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 animate-fade-in-up">
                    <div className="rounded-full bg-muted p-6 empty-state-icon">
                        <ImageOff className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold">No Images Yet</h3>
                        <p className="text-muted-foreground max-w-md">
                            Your restored images will appear here. Upload some images to get started!
                        </p>
                    </div>
                    <Button asChild size="lg" className="gap-2">
                        <a href="/dashboard/file-upload">
                            <Sparkles className="h-4 w-4" />
                            Upload Images
                        </a>
                    </Button>
                </div>
            ) : (
                <>
                    {/* Data Table */}
                    <div className="rounded-md border animate-fade-in-up bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Preview</TableHead>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Quality</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Modified</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {images.map((image, index) => (
                                    <TableRow key={image.key} className={`${getAnimationDelay(index)}`}>
                                        <TableCell>
                                            <div
                                                className="h-12 w-12 rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setSelectedIndex(index)}
                                            >
                                                {imageLoadErrors.has(image.key) ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={image.url}
                                                        alt="thumbnail"
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                        onError={() => handleImageError(image.key)}
                                                    />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[200px] truncate" title={image.key}>
                                            <div className="flex flex-col">
                                                <span>{metadataMap[image.key]?.imageName || image.key.split("/").pop()}</span>
                                                <span className="text-xs text-muted-foreground font-normal truncate opacity-50" title={image.key}>
                                                    {image.key.split("/").pop()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {metadataMap[image.key]?.niqe !== null && metadataMap[image.key]?.niqe !== undefined ? (
                                                <div className="flex flex-col text-xs text-muted-foreground">
                                                    <span title="Natural Image Quality Evaluator (Lower is better)">NIQE: {metadataMap[image.key].niqe?.toFixed(2)}</span>
                                                    <span title="Blind/Referenceless Image Spatial Quality Evaluator (Lower is better)">BRISQUE: {metadataMap[image.key].brisque?.toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">Calculating...</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatSize(image.size)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(image.lastModified)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Download"
                                                    onClick={() => handleDownload(image)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Delete"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    onClick={() => setImageToDelete(image)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Load more trigger */}
                    <div ref={loadMoreRef} className="flex justify-center py-8">
                        {isLoading && (
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Loading more images...</span>
                            </div>
                        )}
                        {!hasMore && images.length > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Sparkles className="h-4 w-4" />
                                <span>You've seen all your images</span>
                            </div>
                        )}
                        {error && images.length > 0 && (
                            <div className="flex flex-col items-center gap-3">
                                <p className="text-destructive text-sm">{error}</p>
                                <Button onClick={() => fetchImages(nextCursor)} variant="outline" size="sm">
                                    Retry
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Preview Dialog */}
            <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
                <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0 bg-background/95 backdrop-blur-xl border-0 shadow-2xl gallery-modal-content">
                    <DialogHeader className="p-5 pb-0 flex-row items-center justify-between">
                        <DialogTitle className="font-semibold truncate flex-1 text-lg">
                            {selectedIndex !== null && images[selectedIndex]?.key.split("/").pop()}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedIndex !== null && images[selectedIndex] && (
                        <div className="relative">
                            {/* Main image */}
                            <div className="relative bg-black/30 flex items-center justify-center min-h-[50vh]">
                                <img
                                    src={images[selectedIndex].url}
                                    alt={`Preview ${selectedIndex + 1}`}
                                    className="max-h-[70vh] max-w-full object-contain"
                                />

                                {/* Navigation buttons */}
                                {selectedIndex > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 gallery-nav-btn bg-background/80 hover:bg-background h-12 w-12 rounded-full shadow-lg"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigatePreview("prev");
                                        }}
                                    >
                                        <ChevronLeft className="h-7 w-7" />
                                    </Button>
                                )}
                                {selectedIndex < images.length - 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 gallery-nav-btn bg-background/80 hover:bg-background h-12 w-12 rounded-full shadow-lg"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigatePreview("next");
                                        }}
                                    >
                                        <ChevronRight className="h-7 w-7" />
                                    </Button>
                                )}

                                {/* Image counter pill */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                                    {selectedIndex + 1} / {images.length}
                                </div>
                            </div>

                            {/* Info bar */}
                            <div className="p-5 flex items-center justify-between border-t bg-muted/30 flex-wrap gap-4">
                                <div className="flex items-center gap-5 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <HardDrive className="h-4 w-4" />
                                        {formatSize(images[selectedIndex].size)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" />
                                        {formatDate(images[selectedIndex].lastModified)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="destructive"
                                        onClick={() => setImageToDelete(images[selectedIndex])}
                                        className="gap-2 shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-none shadow-none"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                    <Button
                                        onClick={() => handleDownload(images[selectedIndex])}
                                        className="gap-2 shrink-0"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Deletion Confirmation Dialog */}
            <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && !isDeleting && setImageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your restored image from the cloud storage and remove the metadata from our records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting
                                </>
                            ) : (
                                "Yes, delete image"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
