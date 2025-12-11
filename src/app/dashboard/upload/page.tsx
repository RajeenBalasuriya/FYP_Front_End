import { useState } from "react"
import { FileDropzone } from "@/components/file-upload/uploader"
import { ProcessingFlow } from "@/components/file-upload/processing-flow"

export default function UploadPage() {
    // Tracks the current step in the processing flow (1-4)
    const [currentStep, setCurrentStep] = useState(1);
    const [hasError, setHasError] = useState(false);

    return (
        <main className="min-h-screen bg-background text-foreground flex justify-center">
            <div className="max-w-3xl w-full py-16 px-6 space-y-10">

                {/* Page Header */}
                <header className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">
                        File Upload
                    </h1>
                    <p className="text-muted-foreground">
                        Upload documents, images, or any file using drag and drop.
                    </p>
                </header>

                {/* Processing Flow Visualization */}
                <section className="p-6 rounded-xl border border-border bg-card shadow-sm">
                    <ProcessingFlow currentStep={currentStep} hasError={hasError} />
                </section>

                {/* Upload Card */}
                <section className="p-8 rounded-xl border border-border bg-card shadow-sm space-y-8">
                    <h2 className="text-xl font-semibold text-foreground">
                        Upload your file
                    </h2>

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
