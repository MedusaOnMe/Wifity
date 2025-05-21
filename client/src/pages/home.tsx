import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ImageGenerator from "@/components/ImageGenerator";
import GallerySection from "@/components/GallerySection";
import Footer from "@/components/Footer";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { AnimatedBackground } from "@/components/ui/animated-background";

export default function Home() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen relative">
      <AnimatedBackground />
      
      <Header onMenuClick={() => setIsMobileNavOpen(true)} />
      
      <main className="flex-1 pt-20 pb-10">
        <div className="container mx-auto px-4">
          <HeroSection />
          <ImageGenerator />
          <GallerySection />
        </div>
      </main>
      
      <Footer />
      
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
    </div>
  );
}
