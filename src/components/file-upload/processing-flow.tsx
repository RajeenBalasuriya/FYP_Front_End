import { Check, CloudUpload, FileScan, Server, BrainCircuit, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
    id: number;
    title: string;
    icon: any;
    description: string;
}

const steps: Step[] = [
    {
        id: 1,
        title: "Upload",
        icon: CloudUpload,
        description: "Uploading to S3",
    },
    {
        id: 2,
        title: "Sanity Check",
        icon: FileScan,
        description: "Lambda Verification",
    },
    {
        id: 3,
        title: "Processing",
        icon: Server,
        description: "Backend Handoff",
    },
    {
        id: 4,
        title: "Model",
        icon: BrainCircuit,
        description: "AI Analysis",
    },
];

interface ProcessingFlowProps {
    currentStep?: number; // 1 to 4
    hasError?: boolean;
    className?: string;
}

export function ProcessingFlow({ currentStep = 1, hasError = false, className }: ProcessingFlowProps) {
    return (
        <div className={cn("w-full py-4", className)}>
            <div className="relative flex items-center justify-between w-full">

                {/* Connecting Lines Layer */}
                <div className="absolute top-1/2 left-0 w-full -translate-y-[20px] flex items-center px-8 sm:px-12 pointer-events-none z-0">
                    <div className="w-full h-0.5 bg-muted rounded-full">
                        <div
                            className={cn(
                                "h-full transition-all duration-500 ease-in-out",
                                hasError ? "bg-destructive" : "bg-primary"
                            )}
                            style={{ width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (steps.length - 1)) * 100))}%` }}
                        />
                    </div>
                </div>

                {/* Steps Layer */}
                {steps.map((step) => {
                    const isCompleted = step.id < currentStep;
                    const isCurrent = step.id === currentStep;
                    const isActive = isCompleted || isCurrent;
                    const isErrorStep = hasError && isCurrent;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center group">
                            <div
                                className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-background",
                                    isErrorStep
                                        ? "border-destructive text-destructive shadow-[0_0_10px_-2px_rgba(239,68,68,0.5)] scale-110 ring-4 ring-destructive/10"
                                        : isActive
                                            ? "border-primary text-primary shadow-[0_0_10px_-2px_rgba(var(--primary),0.5)]"
                                            : "border-muted-foreground/30 text-muted-foreground/30",
                                    isCurrent && !hasError && "scale-110 ring-4 ring-primary/10"
                                )}
                            >
                                {isErrorStep ? (
                                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                ) : isCompleted ? (
                                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                                ) : (
                                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                )}
                            </div>
                            <div className="mt-3 flex flex-col items-center text-center space-y-0.5 min-w-[100px]">
                                <span
                                    className={cn(
                                        "text-xs sm:text-sm font-medium transition-colors duration-300",
                                        isErrorStep
                                            ? "text-destructive"
                                            : isActive
                                                ? "text-foreground"
                                                : "text-muted-foreground/60"
                                    )}
                                >
                                    {isErrorStep ? "Error - Try Again" : step.title}
                                </span>
                                <span
                                    className={cn(
                                        "text-[10px] sm:text-xs transition-colors duration-300 hidden sm:block",
                                        isErrorStep
                                            ? "text-destructive/70"
                                            : isActive
                                                ? "text-muted-foreground"
                                                : "text-muted-foreground/40"
                                    )}
                                >
                                    {step.description}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

