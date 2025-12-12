import { useState } from "react"
import { FileDropzone } from "@/components/file-upload/uploader"
import { ProcessingFlow } from "@/components/file-upload/processing-flow"
import { CloudRain, Wand2 } from "lucide-react"

export default function UploadPage() {
    // Tracks the current step in the processing flow (1-4)
    const [currentStep, setCurrentStep] = useState(1);
    const [hasError, setHasError] = useState(false);

    return (
        <main className="min-h-screen bg-background text-foreground flex justify-center">
            <div className="max-w-3xl w-full py-16 px-6 space-y-10">

                {/* Page Header */}
                <header className="space-y-4 text-center sm:text-left">
                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Wand2 className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Image Restoration
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                        Upload weather-degraded images to restore clarity and detail using our advanced AI models.
                        We handle rain, fog, and snow removal automatically.
                    </p>
                </header>

                {/* Processing Flow Visualization */}
                <section className="p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
                    <ProcessingFlow currentStep={currentStep} hasError={hasError} />
                </section>

                {/* Upload Card */}
                <section className="p-8 rounded-2xl border border-border bg-card shadow-lg space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <CloudRain className="w-32 h-32" />
                    </div>

                    <div className="relative z-10 space-y-1">
                        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                            Upload Source Image
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Supported formats: JPG, PNG, WEBP. Max file size: 10MB.
                        </p>
                    </div>

                    {/* Upload Component */}
                    <FileDropzone
                        onStepChange={setCurrentStep}
                        onError={setHasError}
                    />
                </section>
            </div>
        </main>
    );
}
