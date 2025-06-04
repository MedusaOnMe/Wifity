import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadImage } from "@/lib/image-utils";
import { GenerateImageParams } from "@shared/schema";
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
  const [activeTab, setActiveTab] = useState<"generate" | "edit">("generate");
  const [prompt, setPrompt] = useState("");
  const [size] = useState<GenerateImageParams["size"]>("1024x1024");
  const [quality] = useState<GenerateImageParams["quality"]>("standard");
  const [style] = useState<GenerateImageParams["style"]>("vivid");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [maskStrength] = useState<number>(90);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);
  
  // Reset form when changing tabs
  useEffect(() => {
    setPrompt("");
    if (imageFile && imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [activeTab]);
  
  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: async (data: GenerateImageParams) => {
      setIsUpdating(true);
      
      // Convert to finger art
      data.prompt = `Take the input image and transform its main character into a cartoon-style drawing painted onto a human finger. The finger should be photographed in high-resolution, with visible fingerprint texture. Adapt the subject's key features (like hairstyle, color, costume, or iconic accessories) to fit the rounded shape of the fingertip while keeping it cute, simple, and expressive — like a finger puppet. Background should be plain or themed based on the original character's environment. The result should look like a whimsical, hand-drawn finger art tribute — not a real person, but a stylized cartoon drawn on a finger: ${data.prompt}`;
      
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate image");
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      if (data?.url) {
        try {
          const imageResponse = await fetch(data.url);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`);
          }
          
          const imageBlob = await imageResponse.blob();
          const stableUrl = URL.createObjectURL(imageBlob);
          
          try {
            await uploadImageToFirebase(stableUrl, data.prompt);
          } finally {
            URL.revokeObjectURL(stableUrl);
          }
        } catch (error) {
          console.error("Failed to upload image to Firebase:", error);
          setIsUpdating(false);
        }
      }
    }
  });
  
  // Image edit mutation - no prompt needed, automatic conversion
  const editImageMutation = useMutation({
    mutationFn: async () => {
      setIsUpdating(true);
      
      if (!imageFile) {
        throw new Error("Image is required");
      }
      
      const fileCopy = new File([imageFile], imageFile.name, { 
        type: imageFile.type,
        lastModified: imageFile.lastModified 
      });
      
      const formData = new FormData();
      formData.append("image", fileCopy);
      
      // Automatic conversion prompt - no user input needed
      const autoPrompt = "Take the input image and transform its main character into a cartoon-style drawing painted onto a human finger. The finger should be photographed in high-resolution, with visible fingerprint texture. Adapt the subject's key features (like hairstyle, color, costume, or iconic accessories) to fit the rounded shape of the fingertip while keeping it cute, simple, and expressive — like a finger puppet. Background should be plain or themed based on the original character's environment. The result should look like a whimsical, hand-drawn finger art tribute — not a real person, but a stylized cartoon drawn on a finger.";
      
      formData.append("prompt", autoPrompt);
      formData.append("mask_strength", maskStrength.toString());
      
      try {
        const jobResponse = await fetch("/api/images/edit/create-job", {
          method: "POST",
          body: formData,
        });
        
        if (!jobResponse.ok) {
          throw new Error("Failed to create image edit job");
        }
        
        const jobData = await jobResponse.json();
        const jobId = jobData.jobId;
        
        const maxPollTime = 5 * 60 * 1000; // 5 minutes
        const pollInterval = 2000; // 2 seconds
        const startTime = Date.now();
        
        const pollJobStatus = async (): Promise<any> => {
          if (Date.now() - startTime > maxPollTime) {
            throw new Error("Image processing timed out after 5 minutes.");
          }
          
          const statusResponse = await fetch(`/api/jobs/${jobId}`);
        
          if (!statusResponse.ok) {
            throw new Error("Failed to check job status");
          }
          
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed') {
            return statusData.result;
          } else if (statusData.status === 'failed') {
            throw new Error("Image processing failed");
          } else {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            return pollJobStatus();
          }
        };
        
        return await pollJobStatus();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        throw error;
      }
    },
    onSuccess: async (data) => {
      if (data?.url) {
        try {
          const imageResponse = await fetch(data.url);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch edited image: ${imageResponse.statusText}`);
          }
          
          const imageBlob = await imageResponse.blob();
          const stableUrl = URL.createObjectURL(imageBlob);
          
          try {
            await uploadImageToFirebase(stableUrl, "ditofied");
          } finally {
            URL.revokeObjectURL(stableUrl);
          }
        } catch (error) {
          console.error("Failed to upload image to Firebase:", error);
        }
      }
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    if (activeTab === "generate") {
      generateMutation.reset();
      editImageMutation.reset();
      generateMutation.mutate({ prompt, size, quality, style });
    } else {
      generateMutation.reset();
      editImageMutation.reset();
      editImageMutation.mutate();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error({
          title: "Invalid file type",
          description: `File type ${file.type} is not a supported image format`,
          variant: "destructive"
        });
        return;
      }
      
      const maxSizeInBytes = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSizeInBytes) {
        toast.error({
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
          toast.error({
            title: "Invalid image",
            description: "Unable to load image. The file may be corrupted or not a valid image.",
            variant: "destructive"
          });
        };
        
        img.onload = () => {
          setImageFile(file);
          setImagePreview(objectUrl);
        };
        
        img.src = objectUrl;
      } catch (error) {
        toast.error({
          title: "Error processing image",
          description: "An error occurred while processing the image file.",
          variant: "destructive"
        });
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
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
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0] || null;
    
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error({
          title: "Invalid file type",
          description: `File type ${file.type} is not a supported image format`,
          variant: "destructive"
        });
        return;
      }
      
      const maxSizeInBytes = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSizeInBytes) {
        toast.error({
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
          toast.error({
            title: "Invalid image",
            description: "Unable to load image. The file may be corrupted or not a valid image.",
            variant: "destructive"
          });
        };
        
        img.onload = () => {
          setImageFile(file);
          setImagePreview(objectUrl);
        };
        
        img.src = objectUrl;
      } catch (error) {
        toast.error({
          title: "Error processing image",
          description: "An error occurred while processing the dropped image file.",
          variant: "destructive"
        });
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };
  
  const activeMutation = activeTab === "generate" ? generateMutation : editImageMutation;

  return (
    <section id="image-generator" className="py-16 relative">
      <div className="container px-6 mx-auto max-w-4xl">
        {/* Simple Header */}
        <div className="text-center mb-6">
        </div>
        
        {/* Main Card */}
        <div className="ditofy-card">
          <div className="p-8">
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "generate" | "edit")}>
              <div className="mb-8">
                <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 glass">
                  <TabsTrigger 
                    value="generate"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white font-medium"
                  >
                    🎨 Generate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="edit"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-medium"
                  >
                    🖼️ Transform
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="generate" className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Prompt Section */}
                  <div className="space-y-3">
                    <Label htmlFor="prompt" className="text-lg font-display gradient-text">
                      🎭 What character should we turn into finger art?
                    </Label>
                    <Textarea
                      id="prompt"
                      placeholder="A cute cat wearing sunglasses, Pikachu, Mario, or describe any character..."
                      className="min-h-32 input-modern text-base"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <Button 
                    type="submit" 
                    className="w-full btn-primary text-lg font-display"
                    disabled={activeMutation.isPending || !prompt.trim()}
                  >
                    {activeMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 custom-spinner"></div>
                        Creating Finger Art...
                      </span>
                    ) : (
                      <span>✨ Ditofy It!</span>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="edit" className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Upload Section */}
                  <div className="space-y-3">
                    <Label htmlFor="upload-image" className="text-lg font-display gradient-text">
                      🖼️ Upload your image to transform
                    </Label>
                    
                    <div 
                      className={`border-2 border-dashed ditofy-rounded p-8 text-center transition-all duration-300 ${
                        dragActive 
                          ? 'border-purple-400 glass shimmer' 
                          : imagePreview 
                            ? 'border-green-400 glass' 
                            : 'border-hsl(var(--border)) glass hover:border-purple-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {imagePreview ? (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Source" 
                            className="max-h-64 mx-auto ditofy-rounded finger-shadow"
                          />
                          <button 
                            type="button"
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            onClick={() => {
                              if (imagePreview) {
                                URL.revokeObjectURL(imagePreview);
                              }
                              setImageFile(null);
                              setImagePreview(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-6xl mb-4 animate-pulse">🖼️</div>
                          <h3 className="text-lg font-display gradient-text mb-2">Drop your image here</h3>
                          <p className="text-hsl(var(--muted-foreground)) mb-4">or click to browse files</p>
                          <button 
                            type="button" 
                            className="btn-accent interactive-hover"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Choose Image
                          </button>
                          <p className="text-xs text-hsl(var(--muted-foreground)) mt-4 font-mono">
                            Supports PNG, JPG, WEBP • Max 4MB
                          </p>
                        </>
                      )}
                      <input 
                        ref={fileInputRef}
                        id="upload-image" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                  
                  {/* Transform Button */}
                  <Button 
                    type="submit" 
                    className="w-full btn-secondary text-lg font-display"
                    disabled={activeMutation.isPending || !imageFile}
                  >
                    {activeMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 custom-spinner"></div>
                        Creating Finger Art...
                      </span>
                    ) : (
                      <span>🎨 Transform to Finger Art!</span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Result Display */}
        <div className="mt-8">
          <div className="ditofy-card">
            <div className="p-8">
              {activeMutation.isPending ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 custom-spinner mx-auto mb-4"></div>
                  <h4 className="text-lg font-display gradient-text mb-2">Creating Finger Art Magic ✨</h4>
                  <p className="text-hsl(var(--muted-foreground))">Transforming your character into adorable finger art...</p>
                </div>
              ) : activeMutation.isError ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">💔</div>
                  <h4 className="text-lg font-display text-red-400 mb-2">Oops! Something went wrong</h4>
                  <p className="text-hsl(var(--muted-foreground))">
                    {activeMutation.error instanceof Error ? activeMutation.error.message : "An unexpected error occurred"}
                  </p>
                </div>
              ) : (generateMutation.data || editImageMutation.data) ? (
                <div className="text-center">
                  <div className="inline-block ditofy-rounded overflow-hidden finger-gradient p-6 finger-shadow">
                    <img 
                      src={generateMutation.data?.url || editImageMutation.data?.url} 
                      alt={generateMutation.data?.prompt || "Finger art creation"}
                      className="max-w-full max-h-96 ditofy-rounded"
                    />
                  </div>
                  
                  {/* Download Button */}
                  <div className="mt-6">
                    <button 
                      className="btn-accent interactive-hover"
                      onClick={async () => {
                        try {
                          const imageUrl = generateMutation.data?.url || editImageMutation.data?.url;
                          const imageId = generateMutation.data?.id || editImageMutation.data?.id || 'ditofied';
                          
                          if (!imageUrl) {
                            toast.error({
                              title: "Download failed",
                              description: "No image URL available for download"
                            });
                            return;
                          }
                          
                          await downloadImage(imageUrl, `ditofy-${imageId}`);
                          
                          toast.success({
                            title: "🎉 Download successful!",
                            description: "Your finger art masterpiece has been saved to your device"
                          });
                        } catch (error) {
                          toast.error({
                            title: "Download failed",
                            description: error instanceof Error ? error.message : "Failed to download image"
                          });
                        }
                      }}
                    >
                      📥 Download Finger Art
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6 animate-pulse">🖐️</div>
                  <h4 className="text-xl font-display gradient-text mb-2">Ready to create finger art?</h4>
                  <p className="text-hsl(var(--muted-foreground)) max-w-lg mx-auto">
                    {activeTab === "generate" 
                      ? "Describe any character you'd like to transform into adorable finger art!"
                      : "Upload an image and we'll turn it into whimsical finger puppet art!"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}