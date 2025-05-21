import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "@shared/schema";
import { downloadImage } from "@/lib/image-utils";

export default function Gallery() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  const { data: images, isLoading, error } = useQuery({
    queryKey: ['/api/images'],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      
      <Header onMenuClick={() => setIsMobileNavOpen(true)} />
      
      <main className="flex-1 pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl">
              Your <span className="text-gradient">AI Creations</span>
            </h1>
            <Link href="/" className="glass px-4 py-2 rounded-lg hover:bg-[#334155] transition-colors flex items-center gap-2">
              <i className="ri-add-line"></i>
              Create New
            </Link>
          </div>
          
          {error ? (
            <Card className="glass border-red-500/20">
              <CardContent className="p-6 text-center">
                <p>Error loading images. Please try again later.</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="glass">
                  <div className="h-56 bg-primary-700/30 animate-pulse"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-primary-700/30 animate-pulse rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-primary-700/30 animate-pulse rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : images && images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image: Image) => (
                <Card key={image.id} className="glass overflow-hidden group relative">
                  <img 
                    src={image.url} 
                    alt={image.prompt.slice(0, 50)} 
                    className="w-full h-56 object-cover"
                  />
                  <CardContent className="p-4">
                    <p className="font-medium line-clamp-2 text-sm">{image.prompt}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(image.createdAt).toLocaleString()}
                      </span>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => downloadImage(image.url, `memex-${image.id}`)}
                          className="p-1.5 rounded-lg bg-primary-700 hover:bg-primary-600 transition-colors"
                        >
                          <i className="ri-download-line text-sm"></i>
                        </button>
                        <button className="p-1.5 rounded-lg bg-primary-700 hover:bg-primary-600 transition-colors">
                          <i className="ri-share-line text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-[#334155]/50 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-image-line text-3xl text-[#06B6D4]"></i>
                </div>
                <h3 className="font-display text-xl mb-2">No images yet</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  Start generating amazing AI art using our powerful image generator.
                </p>
                <Link href="/" className="inline-block px-4 py-2 bg-gradient-to-r from-[#9333EA] to-[#06B6D4] rounded-lg text-white font-medium">
                  Create Your First Image
                </Link>
              </CardContent>
            </Card>
          )}
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
