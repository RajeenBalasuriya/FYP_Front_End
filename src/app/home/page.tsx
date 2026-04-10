import { Link } from "react-router-dom";
import { CloudFog, CloudRain, Sun, Snowflake, GalleryVerticalEnd, ArrowRight } from "lucide-react";
import loginImage from "@/assets/login.jpg";
import signupImage from "@/assets/signup.jpeg";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col font-sans">
      {/* Navbar Structure */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2 font-bold text-lg md:text-xl">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-5" />
            </div>
            Weather Former.
          </div>
          <div className="flex items-center gap-4">
            {/* The ModeToggle is already placed in App.tsx absolutely, we do not need it here, but we will leave space for it */}
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center relative pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Animated Background Weather Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10 z-0">
          <Sun className="absolute top-[10%] left-[15%] size-24 md:size-32 text-yellow-500 animate-[pulse_4s_ease-in-out_infinite]" />
          <CloudRain className="absolute top-[20%] right-[10%] size-28 md:size-40 text-blue-500 animate-[bounce_6s_ease-in-out_infinite]" />
          <CloudFog className="absolute bottom-[20%] left-[5%] size-32 md:size-48 text-gray-400 animate-[pulse_5s_ease-in-out_infinite]" />
          <Snowflake className="absolute bottom-[10%] right-[20%] size-20 md:size-28 text-cyan-400 animate-[bounce_7s_ease-in-out_infinite]" />
        </div>

        {/* Content Wrapper */}
        <div className="z-10 w-full flex flex-col items-center text-center mt-10 md:mt-16 lg:mt-24">
          <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm md:text-base font-medium transition-colors hover:bg-muted mb-8 group cursor-pointer">
            ✨ Advanced Weather Restoration App
            <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-pretty leading-tight mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            See Weather Differently. <br /> Restore Every Detail.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Enhance visibility and restore true colors in your images affected by haze, rain, or snow using our state-of-the-art vision models.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
            <Link
              to="/signup"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 hover:scale-105 active:scale-95 duration-200 w-full sm:w-auto"
            >
              Get Started for Free
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95 duration-200 w-full sm:w-auto"
            >
              Sign In to Account
            </Link>
          </div>
        </div>

        {/* Image Showcase Section */}
        <div className="z-10 mt-20 md:mt-32 w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative">
          
          {/* Card 1 */}
          <div className="group relative w-full aspect-[4/3] sm:aspect-video md:aspect-[4/3] lg:aspect-video rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-2 border border-border/50">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10 duration-500"></div>
            <img 
              src={loginImage} 
              alt="Clear sky restoration" 
              className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-white text-xl md:text-2xl font-bold tracking-tight mb-2">Haze Removal</h3>
              <p className="text-white/80 text-sm md:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                Peer through the thickest fog and haze with crystal clear precision.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative w-full aspect-[4/3] sm:aspect-video md:aspect-[4/3] lg:aspect-video rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-2 border border-border/50 md:mt-12 lg:mt-16">
            {/* The second card has a slight margin-top offset on medium+ screens for a dynamic layout */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10 duration-500"></div>
            <img 
              src={signupImage} 
              alt="Rain removal restoration" 
              className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-white text-xl md:text-2xl font-bold tracking-tight mb-2">Rain & Snow Clear</h3>
              <p className="text-white/80 text-sm md:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                Strip away rain streaks and falling snow to reveal the true scene.
              </p>
            </div>
          </div>
          
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Weather Former. All rights reserved. Building the future of image restoration.
        </div>
      </footer>
    </div>
  );
}
