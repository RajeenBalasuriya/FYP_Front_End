import { useEffect, useState } from "react";
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
import { Loader2, RefreshCw, History, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
    id: number;
    imageName: string;
    key: string;
    createdAt: string;
    status: string;
    userId: number;
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
                                    </TableRow>
                                ))
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-destructive">
                                        {error}
                                    </TableCell>
                                </TableRow>
                            ) : jobs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
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
        </div>
    );
}
