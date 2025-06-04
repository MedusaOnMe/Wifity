import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const scrollToGenerator = () => {
    const element = document.getElementById("image-generator");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6 text-center relative z-10">
        {/* Hero content */}
        <div className="max-w-4xl mx-auto">
          {/* Main title */}
          <h1 className="text-6xl md:text-8xl font-display gradient-text mb-6 tracking-tight">
            Ditofy
          </h1>
          
          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-hsl(var(--muted-foreground)) mb-4 font-medium">
            Transform Characters into
          </p>
          
          {/* Finger art emphasis */}
          <div className="relative inline-block mb-8">
            <h2 className="text-4xl md:text-6xl font-display gradient-text-secondary finger-shadow">
              🖐️ Finger Art
            </h2>
            <div className="absolute -inset-2 finger-gradient opacity-20 rounded-full blur-xl"></div>
          </div>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-hsl(var(--muted-foreground)) mb-12 max-w-2xl mx-auto leading-relaxed">
            Turn any character into adorable cartoon-style finger puppet art. 
            Upload an image or describe what you want, and watch the magic happen!
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              onClick={scrollToGenerator}
              className="btn-primary text-lg px-8 py-4 interactive-hover"
            >
              Start Creating ✨
            </Button>
            <Button 
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              variant="outline"
              className="glass border-hsl(var(--border)) text-hsl(var(--foreground)) text-lg px-8 py-4 interactive-hover"
            >
              View Gallery 🎨
            </Button>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="ditofy-card p-6 interactive-hover">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="font-display text-xl mb-2 gradient-text">AI-Powered</h3>
              <p className="text-hsl(var(--muted-foreground))">
                Advanced AI transforms characters into cute finger puppet style
              </p>
            </div>
            
            <div className="ditofy-card p-6 interactive-hover">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-display text-xl mb-2 gradient-text-secondary">Lightning Fast</h3>
              <p className="text-hsl(var(--muted-foreground))">
                Get your finger art creations in seconds, not minutes
              </p>
            </div>
            
            <div className="ditofy-card p-6 interactive-hover">
              <div className="text-4xl mb-4">🖼️</div>
              <h3 className="font-display text-xl mb-2 gradient-text-accent">High Quality</h3>
              <p className="text-hsl(var(--muted-foreground))">
                Professional-grade results with realistic finger textures
              </p>
            </div>
          </div>
          
          {/* Contract address */}
          <div className="mt-16 p-4 ditofy-card max-w-2xl mx-auto">
            <p className="text-sm text-hsl(var(--muted-foreground)) mb-2 font-mono">
              Contract Address:
            </p>
            <p className="font-mono text-sm gradient-text break-all">
              5tTAohWn8aGvCgdzrcuvenCs5uthyE8yntMTffPBpump
            </p>
          </div>
        </div>
      </div>
      
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-blue-500/5 to-cyan-500/5 blur-3xl"></div>
      </div>
    </section>
  );
}
