import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, History, CheckCircle2, Clock, Eye, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL || "https://xghdixt5x3.execute-api.ap-south-1.amazonaws.com";

interface Job {
    id: number;
    imageName: string;
    key: string;
    outputS3Key: string;
    createdAt: string;
    status: string;
    userId: number;
    niqe?: number;
    brisque?: number;
}

interface JobsResponse {
    data: Job[];
    total: number;
    page: number;
    lastPage: number;
}

export default function JobHistoryPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [isRefresing, setIsRefresing] = useState(false);

    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [restoredImageUrl, setRestoredImageUrl] = useState<string | null>(null);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);

    const fetchJobs = async (pageNumber: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/jobs?page=${pageNumber}&limit=5`);

            let result: JobsResponse;
            if (Array.isArray(response.data)) {
                result = response.data[0];
            } else {
                result = response.data;
            }

            setJobs(result.data);
            setTotalPages(result.lastPage);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
            setError("Failed to load jobs.");
        } finally {
            setIsLoading(false);
            setIsRefresing(false);
        }
    };

    useEffect(() => {
        fetchJobs(page);
    }, [page]);

    const handleRefresh = () => {
        setIsRefresing(true);
        fetchJobs(page);
    };

    const handlePrevious = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNext = () => {
        if (page < totalPages) setPage(page + 1);
    };

    const handleViewResults = async (job: Job) => {
        setSelectedJob(job);
        setIsDialogOpen(true);
        setIsLoadingImages(true);
        setImageError(null);
        setOriginalImageUrl(null);
        setRestoredImageUrl(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication required.");

            // Fetch original image signed URL
            const origParams = new URLSearchParams({ key: job.key });
            const origResponse = await axios.get(
                `${LAMBDA_BASE_URL}/image/download?${origParams.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOriginalImageUrl(origResponse.data.url);

            // Fetch restored image signed URL
            if (job.outputS3Key) {
                const restParams = new URLSearchParams({ key: job.outputS3Key });
                const restResponse = await axios.get(
                    `${LAMBDA_BASE_URL}/image/download?${restParams.toString()}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setRestoredImageUrl(restResponse.data.url);
            }
        } catch (err: any) {
            console.error("Failed to load results:", err);
            setImageError(err.response?.data?.error || err.message || "Failed to load images from cloud.");
        } finally {
            setIsLoadingImages(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto anime-fade-in">
            {/* Lively Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-8 shadow-sm">
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <History className="w-5 h-5" />
                            <span className="text-sm font-semibold uppercase tracking-wider">Overview</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                            Job History
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-lg">
                            Track the status of your uploaded files and processing jobs.
                        </p>
                    </div>

                    {/* decorative stats or icon */}
                    <div className="hidden sm:flex gap-6 text-sm font-medium text-muted-foreground/80">
                        <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-lg border shadow-sm">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span>Processing Pending</span>
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-lg border shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Completed Ready</span>
                        </div>
                    </div>
                </div>

                {/* Background decorative blob */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Content Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Recent Activities</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        className={cn("gap-2", isRefresing && "animate-spin-once")}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("w-4 h-4", isRefresing && "animate-spin")} />
                        Refresh
                    </Button>
                </div>

                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[80px] font-bold">#</TableHead>
                                <TableHead className="font-bold">Image Name</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="font-bold text-right">Created At</TableHead>
                                <TableHead className="font-bold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        {/* 
                            We put strict keys on the TableBody to force a re-mount animation 
                            when the page changes. 
                         */}
                        <TableBody key={page} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>
                                        <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                                        <TableCell><div className="h-6 w-16 bg-muted rounded-full animate-pulse" /></TableCell>
                                        <TableCell className="text-right"><div className="h-4 w-24 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                                        <TableCell className="text-right"><div className="h-8 w-24 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-destructive">
                                        {error}
                                    </TableCell>
                                </TableRow>
                            ) : jobs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No jobs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                jobs.map((job, index) => (
                                    <TableRow key={job.id} className="group hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium text-muted-foreground">
                                            {(page - 1) * 5 + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                    <History className="w-4 h-4" />
                                                </div>
                                                {job.imageName}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                job.status === 'PENDING'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : job.status === 'COMPLETED'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                            )}>
                                                {job.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                                                {job.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                {job.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground font-mono text-xs">
                                            {new Date(job.createdAt).toLocaleString(undefined, {
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {job.status === 'COMPLETED' ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewResults(job)}
                                                    className="gap-2 shrink-0 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Results
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">N/A</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{totalPages}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevious}
                            disabled={page <= 1 || isLoading}
                            className="transition-all active:scale-95"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={page >= totalPages || isLoading}
                            className="transition-all active:scale-95"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* View Results Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-muted shadow-2xl">
                    <DialogHeader className="p-5 border-b bg-muted/20">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Restoration Pipeline Results
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col h-[75vh] md:h-[80vh] overflow-y-auto custom-scrollbar">
                        {isLoadingImages ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="animate-pulse">Fetching high-resolution assets...</p>
                            </div>
                        ) : imageError ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-destructive p-12">
                                <div className="p-4 bg-destructive/10 rounded-full">
                                    <AlertCircle className="w-10 h-10" />
                                </div>
                                <h3 className="font-semibold text-lg">Load Failed</h3>
                                <p className="text-sm opacity-90 max-w-md text-center">{imageError}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Visual Splice */}
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
                                    {/* Left Pane - Original */}
                                    <div className="relative isolate min-h-[40vh] bg-[#0A0A0A] flex flex-col items-center justify-center group overflow-hidden">
                                        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-semibold text-white/90 shadow-xl">
                                            Original Input
                                        </div>
                                        {originalImageUrl ? (
                                            <img
                                                src={originalImageUrl}
                                                alt="Original input"
                                                className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-[1.02]"
                                            />
                                        ) : (
                                            <span className="text-muted-foreground italic">Missing Original Asset</span>
                                        )}
                                    </div>

                                    {/* Right Pane - Restored */}
                                    <div className="relative isolate min-h-[40vh] bg-[#000000] flex flex-col items-center justify-center group overflow-hidden pattern-dots pattern-white/5 pattern-size-4">
                                        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-full text-xs font-semibold text-primary shadow-xl flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5" /> Output Generated
                                        </div>
                                        {restoredImageUrl ? (
                                            <img
                                                src={restoredImageUrl}
                                                alt="Restored output"
                                                className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-[1.02]"
                                            />
                                        ) : (
                                            <span className="text-muted-foreground italic">Missing Restored Asset</span>
                                        )}
                                    </div>
                                </div>

                                {/* IQA Metrics Ribbon */}
                                <div className="px-6 pb-6 pt-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-primary/10 text-primary rounded-md shrink-0">
                                            <History className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-semibold text-foreground uppercase tracking-wide">Image Quality Evaluation (Blind)</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* NIQE Card */}
                                        <div className="bg-muted/30 border rounded-xl p-5 hover:bg-muted/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-lg text-foreground tracking-tight">NIQE Score</h4>
                                                {selectedJob?.niqe ? (
                                                    <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/60">
                                                        {Number(selectedJob.niqe).toFixed(3)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-sm">N/A</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                <strong className="text-foreground/80">Natural Image Quality Evaluator.</strong> Measures unnatural distortions without a reference image. <span className="text-primary font-medium dark:text-emerald-400">Lower values indicate better quality</span> and more natural textures.
                                            </p>
                                        </div>

                                        {/* BRISQUE Card */}
                                        <div className="bg-muted/30 border rounded-xl p-5 hover:bg-muted/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-lg text-foreground tracking-tight">BRISQUE Score</h4>
                                                {selectedJob?.brisque ? (
                                                    <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-indigo-500 to-primary/60">
                                                        {Number(selectedJob.brisque).toFixed(3)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-sm">N/A</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                <strong className="text-foreground/80">Blind/Referenceless Image Spatial Quality Evaluator.</strong> Assesses perceptual artifacts based on natural scene statistics. <span className="text-primary font-medium dark:text-emerald-400">Lower scores indicate less distortion.</span>
                                            </p>
                                        </div>
                                    </div>

                                    {(!selectedJob?.niqe && !selectedJob?.brisque) && (
                                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-lg flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            Metrics were not successfully calculated for this job.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
