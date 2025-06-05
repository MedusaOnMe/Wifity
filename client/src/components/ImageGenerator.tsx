import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null, null, null]);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [textOnlyPrompt, setTextOnlyPrompt] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("prompt");
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null]);
  
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
      imagePreviews.forEach(preview => {
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [imagePreviews]);
  
  // Multi-image processing mutation
  const processMutation = useMutation({
    mutationFn: async () => {
      setIsUpdating(true);
      
      const uploadedImages = imageFiles.filter(file => file !== null);
      if (uploadedImages.length === 0) {
        throw new Error("At least one image is required");
      }
      
      const formData = new FormData();
      uploadedImages.forEach((file, index) => {
        formData.append(`image${index + 1}`, file!);
      });
      
      // Use custom prompt with wif stacking format
      const wifPrompt = customPrompt.trim() || "your custom stack here";
      const fullPrompt = `I want to create a realistic image using the "wif" stacking format. Each word or phrase in the format is an element that should be stacked visually from bottom to top, like a totem. Please generate a high-quality, photorealistic image with these instructions: - Stack each item in the exact order of my prompt - Ensure realistic lighting, shadows, and textures - Keep everything visually connected, no floating items - Use a neutral or photographic background, unless implied otherwise. My wif sequence is: ${wifPrompt}`;
      
      formData.append("prompt", fullPrompt);
      
      const response = await fetch("/api/images/generate-stack", {
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
      toast.error({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process images"
      });
    }
  });
  
  // Text-only generation function
  const handleTextOnlyGeneration = async () => {
    setIsUpdating(true);
    
    const formData = new FormData();
    const wifPrompt = textOnlyPrompt.trim();
    const fullPrompt = `I want to create a realistic image using the "wif" stacking format. Each word or phrase in the format is an element that should be stacked visually from bottom to top, like a totem. Please generate a high-quality, photorealistic image with these instructions: - Stack each item in the exact order of my prompt - Ensure realistic lighting, shadows, and textures - Keep everything visually connected, no floating items - Use a neutral or photographic background, unless implied otherwise. My wif sequence is: ${wifPrompt}`;
    
    formData.append("prompt", fullPrompt);
    
    try {
      const response = await fetch("/api/images/generate-text", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate image");
      }
      
      const data = await response.json();
      
      if (data?.url) {
        const imageResponse = await fetch(data.url);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`);
        }
        
        const imageBlob = await imageResponse.blob();
        const stableUrl = URL.createObjectURL(imageBlob);
        
        try {
          await uploadImageToFirebase(stableUrl, "Wifify Creation");
        } finally {
          URL.revokeObjectURL(stableUrl);
        }
      }
    } catch (error) {
      setIsUpdating(false);
      toast.error({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image"
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const uploadedImages = imageFiles.filter(file => file !== null);
    if (uploadedImages.length === 0) {
      toast.error({
        title: "Missing Images",
        description: "Please upload at least one image to create your Wifify"
      });
      return;
    }
    
    setIsUpdating(true);
    processMutation.reset();
    processMutation.mutate();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageIndex: number) => {
    const file = e.target.files?.[0] || null;
    
    const currentPreview = imagePreviews[imageIndex];
    if (currentPreview) {
      URL.revokeObjectURL(currentPreview);
    }
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error({
          title: "Invalid file type",
          description: `File type ${file.type} is not a supported image format`
        });
        return;
      }
      
      const maxSizeInBytes = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSizeInBytes) {
        toast.error({
          title: "File too large",
          description: `Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 4MB.`
        });
        return;
      }
      
      try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          toast.error({
            title: "Invalid image",
            description: "Unable to load image. The file may be corrupted or not a valid image."
          });
        };
        
        img.onload = () => {
          const newFiles = [...imageFiles];
          const newPreviews = [...imagePreviews];
          newFiles[imageIndex] = file;
          newPreviews[imageIndex] = objectUrl;
          setImageFiles(newFiles);
          setImagePreviews(newPreviews);
        };
        
        img.src = objectUrl;
      } catch (error) {
        toast.error({
          title: "Error processing image",
          description: "An error occurred while processing the image file."
        });
      }
    } else {
      const newFiles = [...imageFiles];
      const newPreviews = [...imagePreviews];
      newFiles[imageIndex] = null;
      newPreviews[imageIndex] = null;
      setImageFiles(newFiles);
      setImagePreviews(newPreviews);
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
  
  const handleDrop = (e: React.DragEvent, imageIndex: number) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0] || null;
    
    const currentPreview = imagePreviews[imageIndex];
    if (currentPreview) {
      URL.revokeObjectURL(currentPreview);
    }
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error({
          title: "Invalid file type",
          description: `File type ${file.type} is not a supported image format`
        });
        return;
      }
      
      const maxSizeInBytes = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSizeInBytes) {
        toast.error({
          title: "File too large",
          description: `Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 4MB.`
        });
        return;
      }
      
      try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          toast.error({
            title: "Invalid image",
            description: "Unable to load image. The file may be corrupted or not a valid image."
          });
        };
        
        img.onload = () => {
          const newFiles = [...imageFiles];
          const newPreviews = [...imagePreviews];
          newFiles[imageIndex] = file;
          newPreviews[imageIndex] = objectUrl;
          setImageFiles(newFiles);
          setImagePreviews(newPreviews);
        };
        
        img.src = objectUrl;
      } catch (error) {
        toast.error({
          title: "Error processing image",
          description: "An error occurred while processing the dropped image file."
        });
      }
    } else {
      const newFiles = [...imageFiles];
      const newPreviews = [...imagePreviews];
      newFiles[imageIndex] = null;
      newPreviews[imageIndex] = null;
      setImageFiles(newFiles);
      setImagePreviews(newPreviews);
    }
  };

  return (
    <section id="image-generator" className="py-16 relative">
      <div className="container px-6 mx-auto max-w-4xl">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-display gradient-text mb-4">
            Wifify Generator
          </h2>
          <p className="text-lg text-hsl(var(--muted-foreground)) max-w-2xl mx-auto">
            Generate stunning stacked images with text prompts or uploaded images
          </p>
        </div>
        
        {/* Main Card with Tabs */}
        <Card className="glass border-border/20">
          <CardContent className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prompt">Text Prompt</TabsTrigger>
                <TabsTrigger value="images">Image Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="prompt" className="space-y-6 mt-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!textOnlyPrompt.trim()) {
                    toast.error({
                      title: "Missing Prompt",
                      description: "Please enter a wif sequence to generate"
                    });
                    return;
                  }
                  handleTextOnlyGeneration();
                }} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="text-prompt" className="text-lg font-display gradient-text">
                      Your Wif Sequence
                    </Label>
                    <div className="relative">
                      <textarea
                        id="text-prompt"
                        value={textOnlyPrompt}
                        onChange={(e) => setTextOnlyPrompt(e.target.value)}
                        placeholder="Enter your wif sequence (e.g., 'pizza, cat, rainbow, mountain, spaceship')"
                        className="w-full p-4 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                      />
                      <div className="text-sm text-muted-foreground mt-2">
                        Each word or phrase will be stacked from bottom to top like a totem
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white text-lg font-display py-4 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition-all"
                    disabled={processMutation.isPending}
                  >
                    {processMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating Wifify...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        ✨ Generate Wifify
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="images" className="space-y-6 mt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="custom-prompt" className="text-lg font-display gradient-text">
                      Custom Wif Sequence (Optional)
                    </Label>
                    <div className="relative">
                      <textarea
                        id="custom-prompt"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Enter your wif sequence or leave blank for auto-generation from images"
                        className="w-full p-4 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                      />
                      <div className="text-sm text-muted-foreground mt-2">
                        If left blank, we'll analyze your images to create a sequence
                      </div>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div key={index} className="space-y-3">
                        <Label htmlFor={`upload-image${index}`} className="text-lg font-display gradient-text">
                          Image {index + 1} {index === 0 ? "(Required)" : "(Optional)"}
                        </Label>
                        
                        <div 
                          className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 ${
                            dragActive 
                              ? 'border-purple-400 bg-purple-500/5' 
                              : imagePreviews[index] 
                                ? 'border-green-400 bg-green-500/5' 
                                : 'border-border hover:border-purple-400 hover:bg-purple-500/5'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          {imagePreviews[index] ? (
                            <div className="relative">
                              <img 
                                src={imagePreviews[index]!} 
                                alt={`Image ${index + 1}`} 
                                className="max-h-32 mx-auto rounded-lg shadow-lg"
                              />
                              <button 
                                type="button"
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-sm"
                                onClick={() => {
                                  if (imagePreviews[index]) {
                                    URL.revokeObjectURL(imagePreviews[index]!);
                                  }
                                  const newFiles = [...imageFiles];
                                  const newPreviews = [...imagePreviews];
                                  newFiles[index] = null;
                                  newPreviews[index] = null;
                                  setImageFiles(newFiles);
                                  setImagePreviews(newPreviews);
                                  if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="text-2xl mb-2">📷</div>
                              <p className="text-sm text-muted-foreground mb-2">Drop image here</p>
                              <button 
                                type="button" 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-sm rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                                onClick={() => fileInputRefs.current[index]?.click()}
                              >
                                Choose
                              </button>
                            </>
                          )}
                          <input 
                            ref={(el) => fileInputRefs.current[index] = el}
                            id={`upload-image${index}`} 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, index)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white text-lg font-display py-4 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition-all"
                    disabled={processMutation.isPending || imageFiles.filter(file => file !== null).length === 0}
                  >
                    {processMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Wifify...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        🏗️ Generate Wifify
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Result Display */}
        <div className="mt-8">
          <Card className="glass border-border/20">
            <CardContent className="p-8">
              {processMutation.isPending || isUpdating ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h4 className="text-lg font-display gradient-text mb-2">Creating your Wifify...</h4>
                  <p className="text-muted-foreground">This may take a moment as we stack your elements perfectly</p>
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
                      alt="Wifify Creation"
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
                          const imageId = processMutation.data?.id || 'wifify';
                          
                          if (!imageUrl) {
                            toast.error({
                              title: "Download failed",
                              description: "No image URL available for download"
                            });
                            return;
                          }
                          
                          await downloadImage(imageUrl, `wifify-${imageId}`);
                          
                          toast.success({
                            title: "Download successful!",
                            description: "Your Wifify has been saved"
                          });
                        } catch (error) {
                          toast.error({
                            title: "Download failed",
                            description: error instanceof Error ? error.message : "Failed to download image"
                          });
                        }
                      }}
                    >
                      Download Wifify
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">🏗️</div>
                  <h4 className="text-xl font-display gradient-text mb-2">Ready to create your Wifify?</h4>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Upload images and enter a custom prompt to generate your unique stacked creation
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