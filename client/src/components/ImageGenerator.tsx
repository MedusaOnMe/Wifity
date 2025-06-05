import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { downloadImage } from "@/lib/image-utils";
import { uploadImageToFirebase, onStorageChange } from "@/lib/firebase";
import { toast } from "@/components/ui/use-toast";

// Interface for image data
interface ImageData {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export default function ImageGenerator() {
  const [imageFile1, setImageFile1] = useState<File | null>(null);
  const [imagePreview1, setImagePreview1] = useState<string | null>(null);
  const [imageFile2, setImageFile2] = useState<File | null>(null);
  const [imagePreview2, setImagePreview2] = useState<string | null>(null);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Set up real-time listener for the latest images
  useEffect(() => {
    const unsubscribe = onStorageChange((images) => {
      if (images && images.length > 0) {
        const latestImage = images[0];
        setCurrentImage(latestImage);
        setIsUpdating(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Cleanup function for when component unmounts or when preview changes
  useEffect(() => {
    return () => {
      if (imagePreview1) {
        URL.revokeObjectURL(imagePreview1);
      }
      if (imagePreview2) {
        URL.revokeObjectURL(imagePreview2);
      }
    };
  }, [imagePreview1, imagePreview2]);
  
  // Dual image processing mutation
  const processMutation = useMutation({
    mutationFn: async () => {
      setIsUpdating(true);
      
      if (!imageFile1 || !imageFile2) {
        throw new Error("Both images are required");
      }
      
      const formData = new FormData();
      formData.append("image1", imageFile1);
      formData.append("image2", imageFile2);
      
      // Hardcoded prompt for combining two images
      const hardcodedPrompt = "Create a stunning artistic scene that seamlessly combines these two characters into one cohesive image. The characters should appear naturally together in various poses like standing side by side, sitting on a bench, in a car, at a diner, or any other natural setting. Make it look like they belong in the same world and are interacting in a believable way.";
      
      formData.append("prompt", hardcodedPrompt);
      
      const response = await fetch("/api/images/combine", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process images");
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      if (data?.url) {
        try {
          const imageResponse = await fetch(data.url);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch processed image: ${imageResponse.statusText}`);
          }
          
          const imageBlob = await imageResponse.blob();
          const stableUrl = URL.createObjectURL(imageBlob);
          
          try {
            await uploadImageToFirebase(stableUrl, "IconicDuo Creation");
          } finally {
            URL.revokeObjectURL(stableUrl);
          }
        } catch (error) {
          console.error("Failed to upload image to Firebase:", error);
          setIsUpdating(false);
        }
      }
    },
    onError: (error) => {
      setIsUpdating(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process images",
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile1 || !imageFile2) {
      toast({
        title: "Missing Images",
        description: "Please upload both images before creating your IconicDuo",
        variant: "destructive"
      });
      return;
    }
    
    setIsUpdating(true);
    processMutation.reset();
    processMutation.mutate();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
    const file = e.target.files?.[0] || null;
    
    const currentPreview = imageNumber === 1 ? imagePreview1 : imagePreview2;
    if (currentPreview) {
      URL.revokeObjectURL(currentPreview);
      if (imageNumber === 1) {
        setImagePreview1(null);
      } else {
        setImagePreview2(null);
      }
    }
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `File type ${file.type} is not a supported image format`,
          variant: "destructive"
        });
        return;
      }
      
      const maxSizeInBytes = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSizeInBytes) {
        toast({
          title: "File too large",
          description: `Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 4MB.`,
          variant: "destructive"
        });
        return;
      }
      
      try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          toast({
            title: "Invalid image",
            description: "Unable to load image. The file may be corrupted or not a valid image.",
            variant: "destructive"
          });
        };
        
        img.onload = () => {
          if (imageNumber === 1) {
            setImageFile1(file);
            setImagePreview1(objectUrl);
          } else {
            setImageFile2(file);
            setImagePreview2(objectUrl);
          }
        };
        
        img.src = objectUrl;
      } catch (error) {
        toast({
          title: "Error processing image",
          description: "An error occurred while processing the image file.",
          variant: "destructive"
        });
      }
    } else {
      if (imageNumber === 1) {
        setImageFile1(null);
        setImagePreview1(null);
      } else {
        setImageFile2(null);
        setImagePreview2(null);
      }
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };
  
  const handleDrop = (e: React.DragEvent, imageNumber: 1 | 2) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0] || null;
    
    const currentPreview = imageNumber === 1 ? imagePreview1 : imagePreview2;
    if (currentPreview) {
      URL.revokeObjectURL(currentPreview);
      if (imageNumber === 1) {
        setImagePreview1(null);
      } else {
        setImagePreview2(null);
      }
    }
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `File type ${file.type} is not a supported image format`,
          variant: "destructive"
        });
        return;
      }
      
      const maxSizeInBytes = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSizeInBytes) {
        toast({
          title: "File too large",
          description: `Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 4MB.`,
          variant: "destructive"
        });
        return;
      }
      
      try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          toast({
            title: "Invalid image",
            description: "Unable to load image. The file may be corrupted or not a valid image.",
            variant: "destructive"
          });
        };
        
        img.onload = () => {
          if (imageNumber === 1) {
            setImageFile1(file);
            setImagePreview1(objectUrl);
          } else {
            setImageFile2(file);
            setImagePreview2(objectUrl);
          }
        };
        
        img.src = objectUrl;
      } catch (error) {
        toast({
          title: "Error processing image",
          description: "An error occurred while processing the dropped image file.",
          variant: "destructive"
        });
      }
    } else {
      if (imageNumber === 1) {
        setImageFile1(null);
        setImagePreview1(null);
      } else {
        setImageFile2(null);
        setImagePreview2(null);
      }
    }
  };

  return (
    <section id="image-generator" className="py-16 relative">
      <div className="container px-6 mx-auto max-w-4xl">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-display gradient-text mb-4">
            Create Your IconicDuo
          </h2>
          <p className="text-lg text-hsl(var(--muted-foreground)) max-w-2xl mx-auto">
            Upload two character images and watch as AI seamlessly merges them into one stunning scene
          </p>
        </div>
        
        {/* Main Card */}
        <Card className="glass border-border/20">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Upload Section */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* First Image Upload */}
                <div className="space-y-3">
                  <Label htmlFor="upload-image1" className="text-lg font-display gradient-text">
                    Character 1
                  </Label>
                  
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
                      dragActive 
                        ? 'border-purple-400 bg-purple-500/5' 
                        : imagePreview1 
                          ? 'border-green-400 bg-green-500/5' 
                          : 'border-border hover:border-purple-400 hover:bg-purple-500/5'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 1)}
                  >
                    {imagePreview1 ? (
                      <div className="relative">
                        <img 
                          src={imagePreview1} 
                          alt="Character 1" 
                          className="max-h-48 mx-auto rounded-lg shadow-lg"
                        />
                        <button 
                          type="button"
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          onClick={() => {
                            if (imagePreview1) {
                              URL.revokeObjectURL(imagePreview1);
                            }
                            setImageFile1(null);
                            setImagePreview1(null);
                            if (fileInputRef1.current) fileInputRef1.current.value = '';
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl mb-3">👤</div>
                        <h3 className="text-lg font-display gradient-text mb-2">Drop first character here</h3>
                        <p className="text-muted-foreground mb-4">or click to browse</p>
                        <button 
                          type="button" 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                          onClick={() => fileInputRef1.current?.click()}
                        >
                          Choose Image
                        </button>
                      </>
                    )}
                    <input 
                      ref={fileInputRef1}
                      id="upload-image1" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 1)}
                    />
                  </div>
                </div>

                {/* Second Image Upload */}
                <div className="space-y-3">
                  <Label htmlFor="upload-image2" className="text-lg font-display gradient-text">
                    Character 2
                  </Label>
                  
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
                      dragActive 
                        ? 'border-purple-400 bg-purple-500/5' 
                        : imagePreview2 
                          ? 'border-green-400 bg-green-500/5' 
                          : 'border-border hover:border-purple-400 hover:bg-purple-500/5'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 2)}
                  >
                    {imagePreview2 ? (
                      <div className="relative">
                        <img 
                          src={imagePreview2} 
                          alt="Character 2" 
                          className="max-h-48 mx-auto rounded-lg shadow-lg"
                        />
                        <button 
                          type="button"
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          onClick={() => {
                            if (imagePreview2) {
                              URL.revokeObjectURL(imagePreview2);
                            }
                            setImageFile2(null);
                            setImagePreview2(null);
                            if (fileInputRef2.current) fileInputRef2.current.value = '';
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl mb-3">👤</div>
                        <h3 className="text-lg font-display gradient-text mb-2">Drop second character here</h3>
                        <p className="text-muted-foreground mb-4">or click to browse</p>
                        <button 
                          type="button" 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                          onClick={() => fileInputRef2.current?.click()}
                        >
                          Choose Image
                        </button>
                      </>
                    )}
                    <input 
                      ref={fileInputRef2}
                      id="upload-image2" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 2)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Merge Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white text-lg font-display py-4 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition-all"
                disabled={processMutation.isPending || !imageFile1 || !imageFile2}
              >
                {processMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating IconicDuo...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    👥 Create IconicDuo
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Result Display */}
        <div className="mt-8">
          <Card className="glass border-border/20">
            <CardContent className="p-8">
              {processMutation.isPending || isUpdating ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h4 className="text-lg font-display gradient-text mb-2">Creating your IconicDuo...</h4>
                  <p className="text-muted-foreground">This may take a moment as we merge your characters seamlessly</p>
                </div>
              ) : processMutation.isError ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">💔</div>
                  <h4 className="text-lg font-display text-red-400 mb-2">Oops! Something went wrong</h4>
                  <p className="text-muted-foreground">
                    {processMutation.error instanceof Error ? processMutation.error.message : "An unexpected error occurred"}
                  </p>
                </div>
              ) : processMutation.data ? (
                <div className="text-center">
                  <div className="inline-block rounded-lg overflow-hidden p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 shadow-lg">
                    <img 
                      src={processMutation.data?.url} 
                      alt="IconicDuo Creation"
                      className="max-w-full max-h-96 rounded-lg"
                    />
                  </div>
                  
                  {/* Download Button */}
                  <div className="mt-6">
                    <button 
                      className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
                      onClick={async () => {
                        try {
                          const imageUrl = processMutation.data?.url;
                          const imageId = processMutation.data?.id || 'iconicduo';
                          
                          if (!imageUrl) {
                            toast({
                              title: "Download failed",
                              description: "No image URL available for download",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          await downloadImage(imageUrl, `iconicduo-${imageId}`);
                          
                          toast({
                            title: "Download successful!",
                            description: "Your IconicDuo creation has been saved"
                          });
                        } catch (error) {
                          toast({
                            title: "Download failed",
                            description: error instanceof Error ? error.message : "Failed to download image",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Download IconicDuo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">👥</div>
                  <h4 className="text-xl font-display gradient-text mb-2">Ready to create your IconicDuo?</h4>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Upload two character images and let AI create a stunning merged scene
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}