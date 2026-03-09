"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    HardDrive
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

export default function ViewGallery() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Preview dialog state
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
    // Track which images have finished loading
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

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

    // Handle successful image load
    const handleImageLoad = (key: string) => {
        setLoadedImages((prev) => new Set(prev).add(key));
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
            const response = await fetch(image.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = image.key.split("/").pop() || "restored-image";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: IMAGES_PER_PAGE }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-lg">
                    <CardContent className="p-0">
                        <div className="aspect-square w-full shimmer" />
                        <div className="p-4 space-y-3">
                            <Skeleton className="h-4 w-3/4 shimmer" />
                            <Skeleton className="h-3 w-1/2 shimmer" />
                        </div>
                    </CardContent>
                </Card>
            ))}
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
                            My Gallery
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
                    {/* Image grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {images.map((image, index) => (
                            <div
                                key={image.key}
                                className={`gallery-card rounded-xl overflow-hidden cursor-pointer animate-fade-in-up ${getAnimationDelay(index)}`}
                                onClick={() => setSelectedIndex(index)}
                            >
                                <div className="gallery-image-container aspect-square bg-muted">
                                    {imageLoadErrors.has(image.key) ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                            <ImageOff className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Loading skeleton - visible until image loads */}
                                            {!loadedImages.has(image.key) && (
                                                <div className="absolute inset-0 image-loading-skeleton">
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                                        <div className="image-loading-icon">
                                                            <Images className="h-8 w-8 text-muted-foreground/50" />
                                                        </div>
                                                        <div className="loading-dots flex gap-1.5">
                                                            <span className="loading-dot" />
                                                            <span className="loading-dot" />
                                                            <span className="loading-dot" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <img
                                                src={image.url}
                                                alt={`Restored image ${index + 1}`}
                                                loading="lazy"
                                                className={`w-full h-full object-cover image-reveal ${loadedImages.has(image.key) ? 'image-revealed' : 'image-loading'
                                                    }`}
                                                onLoad={() => handleImageLoad(image.key)}
                                                onError={() => handleImageError(image.key)}
                                            />
                                            <div className="gallery-overlay" />
                                        </>
                                    )}
                                </div>
                                <div className="p-4 space-y-2">
                                    <p className="font-medium truncate text-sm" title={image.key}>
                                        {image.key.split("/").pop()}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <HardDrive className="h-3 w-3" />
                                            {formatSize(image.size)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(image.lastModified)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                            <div className="p-5 flex items-center justify-between border-t bg-muted/30">
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
                                <Button
                                    onClick={() => handleDownload(images[selectedIndex])}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
