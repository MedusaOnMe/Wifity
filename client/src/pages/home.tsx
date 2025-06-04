import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ImageGenerator from "@/components/ImageGenerator";
import GallerySection from "@/components/GallerySection";
import MobileNavDrawer from "@/components/MobileNavDrawer";

export default function Home() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen relative animated-bg">
      <Header onMenuClick={() => setIsMobileNavOpen(true)} />
      
      <main className="flex-1">
        <HeroSection />
        <ImageGenerator />
        <GallerySection />
      </main>
      
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
    </div>
  );
}
