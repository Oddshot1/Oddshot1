import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  return (
    <>
      {/* Main Header */}
      <div className="container py-6 lg:py-8">
        <div className="text-center space-y-3 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            404
          </h1>
          <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
            Page not found
          </p>
        </div>
      </div>

      <section className="relative py-10 lg:py-20 overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <p className="text-xl text-muted-foreground">
                Oops! The page you're looking for doesn't exist.
              </p>
              <p className="text-sm text-muted-foreground/70">
                It might have been moved or deleted. Let's get you back on track.
              </p>
            </div>

            <div className="relative rounded-full p-[2px] h-12 inline-block">
              {/* Rotating border beam */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-[-100%] animate-spin-slow"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #8b5cf6 50%, #ec4899 60%, #8b5cf6 70%, transparent 80%, transparent 100%)',
                  }}
                />
              </div>
              {/* Static border background */}
              <div className="absolute inset-0 rounded-full border border-purple-500/30" />
              {/* Button content */}
              <div className="relative h-full w-full rounded-full bg-background">
                <Link to="/">
                  <Button 
                    size="lg" 
                    className="h-full gap-2 px-8 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    Return to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default NotFound;
