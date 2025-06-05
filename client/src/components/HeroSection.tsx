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
            IconicDuo
          </h1>

          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-hsl(var(--muted-foreground)) mb-8 font-medium">
            Merge two characters into one
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              onClick={scrollToGenerator}
              className="btn-primary text-lg px-8 py-4"
            >
              Create Iconic Duo
            </Button>
            <Button
              onClick={() =>
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth",
                })
              }
              variant="outline"
              className="glass border-hsl(var(--border)) text-hsl(var(--foreground)) text-lg px-8 py-4"
            >
              Gallery
            </Button>
          </div>

          {/* Contract address */}
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
