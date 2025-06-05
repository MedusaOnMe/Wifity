import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="glass border-t border-hsl(var(--border)) py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo Section */}
          <div>
            <Link href="/" className="flex items-center gap-3 transition-all hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl text-white shadow-lg">
                📐
              </div>
              <div>
                <span className="font-display text-2xl font-bold gradient-text">
                  Wifify
                </span>
                <div className="text-sm text-hsl(var(--muted-foreground))">Stack Your World</div>
              </div>
            </Link>
          </div>
          
          {/* Quick Links */}
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="text-hsl(var(--foreground)) hover:text-hsl(var(--primary)) transition-colors font-medium"
            >
              Create
            </Link>
            <Link 
              href="/gallery" 
              className="text-hsl(var(--foreground)) hover:text-hsl(var(--primary)) transition-colors font-medium"
            >
              Gallery
            </Link>
            <a
              href="https://x.com/i/communities/1930184588879335841"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hsl(var(--foreground)) hover:text-hsl(var(--primary)) transition-colors font-medium"
            >
              Community
            </a>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full h-px bg-hsl(var(--border)) my-8"></div>
        
        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-hsl(var(--muted-foreground)) text-sm">
              © {currentYear} Wifify. All rights reserved.
            </p>
            <p className="text-hsl(var(--muted-foreground)) text-xs mt-1">
              Create stunning stacked compositions with AI.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}