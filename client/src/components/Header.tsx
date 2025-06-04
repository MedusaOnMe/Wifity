import { Link } from "wouter";
import { useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="glass sticky top-0 z-50 border-b border-hsl(var(--border))/20">
      <div className="container mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 finger-gradient rounded-full flex items-center justify-center finger-shadow">
              <span className="text-2xl">🖐️</span>
            </div>
            <span className="font-display text-2xl font-bold gradient-text">
              ditofy
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
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
              href="https://x.com/i/communities/1929531995563884891" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-hsl(var(--foreground)) hover:text-hsl(var(--primary)) transition-colors p-2 glass rounded-full"
              aria-label="Follow us on X (Twitter)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-3 text-hsl(var(--foreground)) hover:text-hsl(var(--primary)) glass rounded-full transition-colors"
            onClick={onMenuClick}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}