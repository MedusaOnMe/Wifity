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
    <section id="gallery" className="py-16 bg-gray-50">
      <div className="container px-4 mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
          Gallery
        </h2>
      
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="bg-white border border-gray-200 overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="w-full aspect-square bg-gray-200" />
                  <div className="p-3">
                    <Skeleton className="h-4 w-full mb-2 bg-gray-200" />
                    <Skeleton className="h-4 w-3/4 bg-gray-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center p-8 max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg">
            <svg className="w-12 h-12 text-red-500 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 mb-2 font-medium">Failed to load gallery</p>
            <p className="text-gray-600 text-sm">
              {error ? error.message : "Unknown error"}
            </p>
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image: Image) => (
              <div key={image.id}>
                <Card 
                  className="bg-white border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow rounded-2xl"
                  onClick={() => handleImageClick(image)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img 
                        src={image.url} 
                        alt="nofacified image" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        loading="lazy" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">
              No images found in the gallery
            </p>
            <p className="text-sm text-gray-500">
              Create some nofacified images to see them here!
            </p>
          </div>
        )}
      </div>
      
      {/* Image details modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl">
            <div className="relative">
              <button 
                className="absolute top-4 right-4 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center z-10 hover:bg-gray-900"
                onClick={closeDetails}
              >
                ×
              </button>
              
              <div className="overflow-hidden max-h-[50vh] bg-gray-100">
                <img 
                  src={selectedImage.url} 
                  alt="nofacified image" 
                  className="w-full object-contain"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  nofacified Image
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Created: {new Date(selectedImage.timestamp).toLocaleString()}
                </p>
                
                <div className="flex space-x-3">
                  <Button 
                    size="sm" 
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                    onClick={() => downloadImage(selectedImage.url, `noify-${selectedImage.id.split('/').pop() || 'silhouette'}`)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}