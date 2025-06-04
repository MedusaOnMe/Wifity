import { useState, useEffect } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { getAllImagesFromFirebase, onStorageChange } from "@/lib/firebase";
import { downloadImage } from "@/lib/image-utils";

interface Image {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  displayTitle?: string;
}

export default function Gallery() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Set up real-time listener for Firebase Storage changes
  useEffect(() => {
    setIsLoading(true);
    
    // Initial load of images
    const loadImages = async () => {
      try {
        const initialImages = await getAllImagesFromFirebase();
        setImages(initialImages);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load initial images:", err);
        setError(err instanceof Error ? err : new Error("Unknown error loading images"));
        setIsLoading(false);
      }
    };
    
    loadImages();
    
    // Set up real-time listener
    const unsubscribe = onStorageChange((updatedImages) => {
      setImages(updatedImages);
      setIsLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header onMenuClick={() => setIsMobileNavOpen(true)} />
      
      <main className="flex-1 pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-800">
              Gallery
            </h1>
            <Link href="/" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <span>+</span>
              Create More
            </Link>
          </div>
          
          {error ? (
            <Card className="glass border-red-500/20">
              <CardContent className="p-6 text-center">
                <p>Error loading images. Please try again later.</p>
                <p className="text-xs text-red-400 mt-2">{error.message}</p>
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
                    <p className="font-medium line-clamp-2 text-sm">{image.displayTitle || image.prompt}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(image.timestamp).toLocaleString()}
                      </span>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => downloadImage(image.url, `memex-${image.id.split('/').pop() || 'image'}`)}
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
      
      
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
    </div>
  );
}
