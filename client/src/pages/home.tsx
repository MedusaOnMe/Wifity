import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ImageGenerator from "@/components/ImageGenerator";
import GallerySection from "@/components/GallerySection";
import MobileNavDrawer from "@/components/MobileNavDrawer";

export default function Home() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen relative animated-bg circuit-pattern">
      <Header onMenuClick={() => setIsMobileNavOpen(true)} />
      
      <main className="flex-1 relative z-10">
        <HeroSection />
        <ImageGenerator />
        <GallerySection />
      </main>
      
      {/* Floating decoration elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/4 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
    </div>
  );
}
