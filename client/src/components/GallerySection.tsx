import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
    <section id="gallery" className="py-16">
      <div className="container px-4 mx-auto">
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
          <span className="cryptic-symbols mr-2 opacity-50"></span>
          <span className="text-gradient">Explore</span> Creations
        </h2>
      
      {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="glass overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="w-full aspect-square" />
                  <div className="p-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
        ) : isError ? (
          <div className="text-center p-8 max-w-md mx-auto bg-red-500/10 rounded-lg">
            <i className="ri-error-warning-line text-5xl text-red-500 mb-4 block"></i>
            <p className="text-red-500 mb-2 font-medium">Failed to load gallery</p>
            <p className="text-muted-foreground text-sm">
              {error ? error.message : "Unknown error"}
            </p>
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image: Image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <Card 
                  className="glass overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleImageClick(image)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square overflow-hidden">
              <img 
                src={image.url} 
                        alt={image.prompt || "Generated image"} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        loading="lazy" 
                      />
                  </div>
                    <div className="p-3">
                      <p className="font-medium line-clamp-1">{image.displayTitle || image.prompt || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(image.timestamp).toLocaleDateString()}
                      </p>
                </div>
              </CardContent>
            </Card>
              </motion.div>
          ))}
        </div>
      ) : (
          <div className="text-center p-8 max-w-md mx-auto">
            <i className="ri-gallery-line text-5xl text-muted-foreground/30 mb-4 block"></i>
            <p className="text-muted-foreground">
              No images found in the gallery
            </p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              Create some images to see them here!
            </p>
          </div>
        )}
      </div>
      
      {/* Image details modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <motion.div 
            className="bg-background rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="relative">
              <button 
                className="absolute top-4 right-4 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center z-10"
                onClick={closeDetails}
              >
                <i className="ri-close-line text-white"></i>
              </button>
              
              <div className="overflow-hidden max-h-[50vh]">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.prompt || "Generated image"} 
                  className="w-full object-contain"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{selectedImage.displayTitle || selectedImage.prompt || "Untitled"}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Created: {new Date(selectedImage.timestamp).toLocaleString()}
                </p>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-[#334155] hover:bg-[#475569] text-white"
                    onClick={() => downloadImage(selectedImage.url, `memex-${selectedImage.id.split('/').pop() || 'image'}`)}
                  >
                    <i className="ri-download-line mr-1"></i> Save
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
                    onClick={() => {
                      const promptText = selectedImage.prompt;
                      const tweetText = `Check out this image from MemeX: "${promptText?.substring(0, 50)}${promptText?.length > 50 ? '...' : ''}"`;
                      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(selectedImage.url)}`;
                      window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
                    }}
                  >
                    <i className="ri-twitter-x-fill mr-1"></i> Share
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
