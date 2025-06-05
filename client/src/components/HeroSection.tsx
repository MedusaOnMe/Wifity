import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const scrollToGenerator = () => {
    const element = document.getElementById("image-generator");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden dot-pattern">
      <div className="container mx-auto px-6 text-center relative z-10">
        {/* Hero content */}
        <div className="max-w-4xl mx-auto fade-in">
          {/* Main title */}
          <h1 className="text-6xl md:text-8xl font-display gradient-text mb-8 tracking-tight">
            Wifify
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-hsl(var(--muted-foreground)) mb-12 font-medium">
            Stack Your World with AI
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Button
              onClick={scrollToGenerator}
              className="btn-primary text-lg px-8 py-4 font-medium modern-card interactive-hover"
            >
              Start Creating
            </Button>
            <Button
              onClick={() =>
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth",
                })
              }
              variant="outline"
              className="btn-secondary text-lg px-8 py-4 font-medium modern-card"
            >
              View Gallery
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 blur-3xl floating"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-cyan-500/5 to-blue-500/5 blur-2xl floating" style={{animationDelay: '1s'}}></div>
      </div>
    </section>
  );
}
