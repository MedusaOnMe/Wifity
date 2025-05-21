import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#262a45]/30">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="text-gradient">Meme</span>X
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">
            Create
          </Link>
          <Link href="/gallery" className="text-foreground/80 hover:text-foreground transition-colors">
            Explore
          </Link>
          <a 
            href="/about" 
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            About
          </a>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={onMenuClick}
          >
            <i className="ri-menu-line text-xl" aria-hidden="true"></i>
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
} 