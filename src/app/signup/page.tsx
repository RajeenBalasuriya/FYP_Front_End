import { GalleryVerticalEnd } from "lucide-react";
import { SignupForm } from "@/components/signup-form";
import signUpImage from "@/assets/signup.jpeg";

export default function SignUpPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Weather Former.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden group bg-muted">
        {/* LEFT EDGE WHITE GRADIENT BLEND (FIXES SHARP LINE) */}
        <div
          className="
    pointer-events-none
    absolute inset-y-0 left-0 w-40
    bg-gradient-to-r
    from-[var(--background)]
    via-[color-mix(in oklab, var(--background) 80%, transparent)]
    to-transparent
    z-20
  "
        ></div>

        {/* HOVER DARK OVERLAY */}
        <div
          className="
      absolute inset-0 bg-black/0 
      transition-all duration-700 
      group-hover:bg-black/60
      z-10
    "
        ></div>

        {/* IMAGE (HIGH BLUR ON HOVER) */}
        <img
          src={signUpImage}
          alt="Image"
          className="
      absolute inset-0 h-full w-full object-cover
      transition-all duration-700 ease-out
      group-hover:blur-xl
      group-hover:brightness-50
    "
        />

        {/* TEXT REVEAL */}
        <div
          className="
      relative z-30 text-white text-3xl md:text-4xl font-semibold 
      opacity-0 group-hover:opacity-100 
      transition-all duration-700 
      group-hover:translate-y-0 translate-y-2
      text-center px-4
    "
        >
          See weather differently.
        </div>
      </div>
    </div>
  );
}
