import { useState } from "react";
import Header from "@/components/Header";
import GallerySection from "@/components/GallerySection";
import MobileNavDrawer from "@/components/MobileNavDrawer";

export default function GalleryPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Header onMenuClick={() => setIsMobileNavOpen(true)} />
      <GallerySection />
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
    </div>
  );
} 