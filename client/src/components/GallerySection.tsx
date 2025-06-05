import { useState, useEffect } from "react";
import { getAllImagesFromFirebase, onStorageChange } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadImage } from "@/lib/image-utils";

interface Image {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  displayTitle?: string;
}

export default function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
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
        setIsError(true);
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

  // Handle image click
  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };
  
  // Close the details modal
  const closeDetails = () => {
    setSelectedImage(null);
  };

  return (
    <section id="gallery" className="py-16 relative dot-pattern">
      <div className="container px-6 mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-display gradient-text mb-4">
            IconicDuo Gallery
          </h2>
        </div>
      
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="iconic-card p-0 overflow-hidden interactive-hover">
                <Skeleton className="w-full aspect-square" style={{background: 'hsl(var(--muted))'}} />
                <div className="p-4">
                  <Skeleton className="h-4 w-full mb-2" style={{background: 'hsl(var(--muted))'}} />
                  <Skeleton className="h-4 w-3/4" style={{background: 'hsl(var(--muted))'}} />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center p-8 max-w-md mx-auto iconic-card">
            <div className="text-6xl mb-4">💔</div>
            <p className="text-red-400 mb-2 font-display text-lg">Failed to load gallery</p>
            <p className="text-hsl(var(--muted-foreground)) text-sm">
              {error ? error.message : "Unknown error"}
            </p>
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {images.map((image: Image) => (
              <div key={image.id} className="iconic-card p-0 overflow-hidden cursor-pointer" onClick={() => handleImageClick(image)}>
                <div className="aspect-square overflow-hidden finger-gradient p-2">
                  <img 
                    src={image.url} 
                    alt="IconicDuo creation" 
                    className="w-full h-full object-cover iconic-rounded"
                    loading="lazy" 
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 max-w-md mx-auto iconic-card">
            <div className="text-8xl mb-6">👥</div>
            <p className="text-hsl(var(--foreground)) mb-2 font-display text-xl">
              No IconicDuos yet!
            </p>
            <p className="text-hsl(var(--muted-foreground))">
              Create some IconicDuos to see them here!
            </p>
          </div>
        )}
      </div>
      
      {/* Image details modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: 'hsl(var(--background) / 0.8)'}}>
          <div className="iconic-card max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="relative">
              <button 
                className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center z-10 hover:bg-red-600 transition-colors"
                onClick={closeDetails}
              >
                ×
              </button>
              
              <div className="overflow-hidden max-h-[60vh] finger-gradient p-4">
                <img 
                  src={selectedImage.url} 
                  alt="ditofied image" 
                  className="w-full object-contain iconic-rounded finger-shadow"
                />
              </div>
              
              <div className="p-8">
                <h3 className="text-2xl font-display gradient-text mb-2">
                  IconicDuo Creation
                </h3>
                <p className="text-sm text-hsl(var(--muted-foreground)) mb-6 font-mono">
                  Created: {new Date(selectedImage.timestamp).toLocaleString()}
                </p>
                
                <div className="flex gap-4">
                  <Button 
                    className="btn-accent"
                    onClick={() => downloadImage(selectedImage.url, `iconicduo-${selectedImage.id.split('/').pop() || 'creation'}`)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/5 to-cyan-500/5 blur-3xl"></div>
      </div>
    </section>
  );
}