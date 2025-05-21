import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { downloadImage } from "@/lib/image-utils";
import { GenerateImageParams } from "@shared/schema";

// Define style themes with their descriptions
const styleThemes = [
  { id: "none", name: "None", description: "No specific theme applied" },
  { id: "ghibli", name: "Studio Ghibli", description: "Animated style inspired by Studio Ghibli films" },
  { id: "minecraft", name: "Minecraft", description: "Blocky pixelated style like Minecraft" },
  { id: "pixar", name: "Pixar", description: "3D animated style similar to Pixar films" },
  { id: "cyberpunk", name: "Cyberpunk", description: "Futuristic cyberpunk aesthetic" },
  { id: "vaporwave", name: "Vaporwave", description: "Retro-futuristic 80s/90s aesthetic" },
  { id: "renaissance", name: "Renaissance", description: "Classical painting style" },
];

export default function ImageGenerator() {
  const [activeTab, setActiveTab] = useState<"generate" | "edit">("generate");
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<GenerateImageParams["size"]>("1024x1024");
  const [quality, setQuality] = useState<GenerateImageParams["quality"]>("standard");
  const [style, setStyle] = useState<GenerateImageParams["style"]>("vivid");
  const [styleTheme, setStyleTheme] = useState("none");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [maskStrength, setMaskStrength] = useState<number>(90);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cleanup function for when component unmounts or when preview changes
  useEffect(() => {
    // Return cleanup function
    return () => {
      if (imagePreview) {
        console.log("Cleaning up image preview URL on unmount");
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);
  
  // Reset form when changing tabs
  useEffect(() => {
    // Reset state when changing tabs to prevent stale data
    setPrompt("");
    if (imageFile && imagePreview) {
      console.log("Cleaning up image resources when changing tabs");
      URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [activeTab]);
  
  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: async (data: GenerateImageParams) => {
      // Apply style theme to prompt if selected
      if (styleTheme !== "none") {
        const theme = styleThemes.find(t => t.id === styleTheme);
        data.prompt = `${data.prompt} (in the style of ${theme?.name})`;
      }
      
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
  });
  
  // Image edit mutation
  const editImageMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile || !prompt) {
        throw new Error("Image and prompt are required");
      }
      
      console.log(`Processing image: ${imageFile.name}, Size: ${imageFile.size} bytes, Type: ${imageFile.type}`);
      
      // Check file type early
      if (!imageFile.type.startsWith('image/')) {
        throw new Error("File must be an image");
      }
      
      // Create a copy of the file to ensure it doesn't get revoked or modified
      // This helps prevent issues with the blob URL being invalidated
      const fileCopy = new File([imageFile], imageFile.name, { 
        type: imageFile.type,
        lastModified: imageFile.lastModified 
      });
      
      const formData = new FormData();
      formData.append("image", fileCopy);
      formData.append("prompt", prompt);
      formData.append("mask_strength", maskStrength.toString());
      
      if (styleTheme !== "none") {
        const theme = styleThemes.find(t => t.id === styleTheme);
        const styledPrompt = `${prompt} (in the style of ${theme?.name})`;
        formData.set("prompt", styledPrompt);
      }
      
      try {
        // Step 1: Create job and get job ID
        const jobResponse = await fetch("/api/images/edit/create-job", {
          method: "POST",
          body: formData,
        });
        
        if (!jobResponse.ok) {
          throw new Error("Failed to create image edit job");
        }
        
        const jobData = await jobResponse.json();
        const jobId = jobData.jobId;
        
        // Step 2: Start polling for job completion
        const maxPollTime = 5 * 60 * 1000; // 5 minutes
        const pollInterval = 2000; // 2 seconds
        const startTime = Date.now();
        
        // Helper function to poll job status
        const pollJobStatus = async (): Promise<any> => {
          // Check if we've exceeded max poll time
          if (Date.now() - startTime > maxPollTime) {
            throw new Error("Image processing timed out after 5 minutes. The server may still be processing your image.");
          }
          
          // Fetch job status
          const statusResponse = await fetch(`/api/jobs/${jobId}`);
          
          if (!statusResponse.ok) {
            throw new Error("Failed to check job status");
          }
          
          const statusData = await statusResponse.json();
          
          // Check job status
          if (statusData.status === 'completed') {
            return statusData.result;
          } else if (statusData.status === 'failed') {
            throw new Error("Image processing failed");
          } else {
            // Job still in progress, wait and poll again
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            return pollJobStatus();
          }
        };
        
        // Start polling
        return await pollJobStatus();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("Unknown error occurred while editing image");
        }
      }
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "generate") {
      generateMutation.mutate({ prompt, size, quality, style });
    } else {
      editImageMutation.mutate();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    // Clean up previous preview if it exists
    if (imagePreview) {
      console.log("Cleaning up previous image preview");
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    
    if (file) {
      // Validate image before proceeding
      if (!file.type.startsWith('image/')) {
        console.error(`Error: File type ${file.type} is not a supported image format`);
        return;
      }
      
      // Check file size - OpenAI has a 4MB limit
      const maxSizeInBytes = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSizeInBytes) {
        console.error(`Error: Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 4MB.`);
        return;
      }
      
      // Additional check for dimensions through loading the image
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      console.log("Created blob URL:", objectUrl);
      
      img.onload = () => {
        console.log("Image loaded successfully, dimensions:", img.width, "x", img.height);
        // Don't revoke the objectUrl here as it's needed for the preview
        const maxDimension = 4000; // OpenAI likely has dimension limits
        
        if (img.width > maxDimension || img.height > maxDimension) {
          console.log("Warning: Image dimensions are quite large. If you encounter errors, try resizing to smaller dimensions.");
        }
        
        // Set image file if all checks pass
        setImageFile(file);
        console.log(`File selected: ${file.name}, Size: ${(file.size / 1024).toFixed(2)}KB, Dimensions: ${img.width}x${img.height}, Type: ${file.type}`);
        setImagePreview(objectUrl);
      };
      
      img.onerror = () => {
        console.error("Failed to load image from blob URL:", objectUrl);
        URL.revokeObjectURL(objectUrl);
        console.error("Error: Unable to load image. The file may be corrupted or not a valid image.");
      };
      
      img.src = objectUrl;
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] || null;
    
    // Clean up previous preview if it exists
    if (imagePreview) {
      console.log("Cleaning up previous image preview (drop)");
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    
    if (file) {
      // Validate image before proceeding
      if (!file.type.startsWith('image/')) {
        console.error(`Error: File type ${file.type} is not a supported image format`);
        return;
      }
      
      // Check file size - OpenAI has a 4MB limit
      const maxSizeInBytes = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSizeInBytes) {
        console.error(`Error: Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 4MB.`);
        return;
      }
      
      // Additional check for dimensions through loading the image
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      console.log("Created blob URL (drop):", objectUrl);
      
      img.onload = () => {
        console.log("Image loaded successfully (drop), dimensions:", img.width, "x", img.height);
        // Don't revoke the objectUrl here as it's needed for the preview
        const maxDimension = 4000; // OpenAI likely has dimension limits
        
        if (img.width > maxDimension || img.height > maxDimension) {
          console.log("Warning: Image dimensions are quite large. If you encounter errors, try resizing to smaller dimensions.");
        }
        
        // Set image file if all checks pass
        setImageFile(file);
        console.log(`File dropped: ${file.name}, Size: ${(file.size / 1024).toFixed(2)}KB, Dimensions: ${img.width}x${img.height}, Type: ${file.type}`);
        setImagePreview(objectUrl);
      };
      
      img.onerror = () => {
        console.error("Failed to load image from blob URL (drop):", objectUrl);
        URL.revokeObjectURL(objectUrl);
        console.error("Error: Unable to load image. The file may be corrupted or not a valid image.");
      };
      
      img.src = objectUrl;
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };
  
  // Active mutation based on current tab
  const activeMutation = activeTab === "generate" ? generateMutation : editImageMutation;

  return (
    <section id="image-generator" className="py-16">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form Section */}
          <div className="w-full lg:w-1/2">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
              <span className="cryptic-symbols mr-2 opacity-50"></span>
              Manifest Your <span className="text-gradient">Vision</span>
            </h2>
            
            <Card className="glass mb-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "generate" | "edit")}>
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="generate">Generate</TabsTrigger>
                  <TabsTrigger value="edit">Edit Image</TabsTrigger>
                </TabsList>
                
                <TabsContent value="generate" className="p-6">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <Label htmlFor="prompt" className="mb-2 block">
                        Describe your vision <span className="text-muted-foreground">(be detailed)</span>
                      </Label>
                      <Textarea
                        id="prompt"
                        placeholder="A mystical gateway between worlds, ornate ancient symbols..."
                        className="min-h-32 bg-background/50"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="mb-6">
                      <Label htmlFor="style-theme" className="mb-2 block">
                        Style Theme
                      </Label>
                      <Select value={styleTheme} onValueChange={setStyleTheme}>
                        <SelectTrigger id="style-theme">
                          <SelectValue placeholder="Select a style theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleThemes.map((theme) => (
                            <SelectItem key={theme.id} value={theme.id}>
                              {theme.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {styleTheme !== "none" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {styleThemes.find(t => t.id === styleTheme)?.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                      <div className="flex-1">
                        <Label className="mb-2 block">Dimensions</Label>
                        <RadioGroup 
                          value={size} 
                          onValueChange={(value) => setSize(value as GenerateImageParams["size"])}
                          className="flex flex-col gap-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1024x1024" id="size-square" />
                            <Label htmlFor="size-square" className="font-normal cursor-pointer">
                              Square (1:1)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1024x1792" id="size-portrait" />
                            <Label htmlFor="size-portrait" className="font-normal cursor-pointer">
                              Portrait (9:16)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1792x1024" id="size-landscape" />
                            <Label htmlFor="size-landscape" className="font-normal cursor-pointer">
                              Landscape (16:9)
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="flex-1">
                        <Label className="mb-2 block">Quality</Label>
                        <RadioGroup 
                          value={quality} 
                          onValueChange={(value) => setQuality(value as GenerateImageParams["quality"])}
                          className="flex flex-col gap-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="standard" id="quality-standard" />
                            <Label htmlFor="quality-standard" className="font-normal cursor-pointer">
                              Standard
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hd" id="quality-hd" />
                            <Label htmlFor="quality-hd" className="font-normal cursor-pointer">
                              High Definition
                            </Label>
                          </div>
                        </RadioGroup>
                        
                        <Label className="mt-4 mb-2 block">Style</Label>
                        <RadioGroup 
                          value={style} 
                          onValueChange={(value) => setStyle(value as GenerateImageParams["style"])}
                          className="flex flex-col gap-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="vivid" id="style-vivid" />
                            <Label htmlFor="style-vivid" className="font-normal cursor-pointer">
                              Vivid
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="natural" id="style-natural" />
                            <Label htmlFor="style-natural" className="font-normal cursor-pointer">
                              Natural
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:opacity-90 transition-opacity"
                      disabled={activeMutation.isPending || !prompt.trim()}
                    >
                      {activeMutation.isPending ? (
                        <>
                          <span className="animate-pulse">Manifesting...</span>
                          <span className="cryptic-symbols ml-2 opacity-50"></span>
                        </>
                      ) : "Manifest Vision"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="edit" className="p-6">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <Label htmlFor="upload-image" className="mb-2 block">
                        Upload Image to Transform
                      </Label>
                      <div 
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        {imagePreview ? (
                          <div className="relative">
                            <img 
                              src={imagePreview} 
                              alt="Source" 
                              className="max-h-48 mx-auto rounded-md"
                              onError={(e) => {
                                console.error("Image preview failed to load");
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite loop
                                target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIGVycm9yPC90ZXh0Pjwvc3ZnPg==";
                              }}
                              onLoad={() => {
                                console.log("Image preview loaded successfully");
                              }}
                            />
                            <button 
                              type="button"
                              className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center"
                              onClick={() => {
                                console.log("Cleaning up image preview");
                                if (imagePreview) {
                                  // Clean up the blob URL when removing the image
                                  URL.revokeObjectURL(imagePreview);
                                }
                                setImageFile(null);
                                setImagePreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                            >
                              <i className="ri-close-line text-white"></i>
                            </button>
                          </div>
                        ) : (
                          <>
                            <i className="ri-upload-cloud-line text-3xl text-muted-foreground mb-2 block mx-auto"></i>
                            <p className="text-muted-foreground mb-2">Drag and drop an image, or click to upload</p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Select Image
                            </Button>
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
                    
                    <div className="mb-6">
                      <Label htmlFor="edit-prompt" className="mb-2 block">
                        Describe how to transform the image
                      </Label>
                      <Textarea
                        id="edit-prompt"
                        placeholder="Make the image look like winter, add snow falling"
                        className="min-h-24 bg-background/50"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="mb-6">
                      <Label htmlFor="style-theme-edit" className="mb-2 block">
                        Style Theme
                      </Label>
                      <Select value={styleTheme} onValueChange={setStyleTheme}>
                        <SelectTrigger id="style-theme-edit">
                          <SelectValue placeholder="Select a style theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleThemes.map((theme) => (
                            <SelectItem key={theme.id} value={theme.id}>
                              {theme.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <Label htmlFor="mask-strength">Transformation Strength: {maskStrength}%</Label>
                      </div>
                      <Slider
                        id="mask-strength"
                        min={1}
                        max={100}
                        step={1}
                        value={[maskStrength]}
                        onValueChange={(value) => setMaskStrength(value[0])}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Higher values apply more of your prompt to the image
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:opacity-90 transition-opacity"
                      disabled={activeMutation.isPending || !prompt.trim() || !imageFile}
                    >
                      {activeMutation.isPending ? (
                        <>
                          <span className="animate-pulse">Transforming...</span>
                          <span className="cryptic-symbols ml-2 opacity-50"></span>
                        </>
                      ) : "Transform Image"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
          
          {/* Result Section */}
          <div className="w-full lg:w-1/2">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
              <span className="cryptic-symbols mr-2 opacity-50"></span>
              Revealed <span className="text-gradient">Vision</span>
            </h2>
            
            <Card className="glass h-[30rem] flex items-center justify-center overflow-hidden relative">
              <CardContent className="p-0 w-full h-full flex items-center justify-center">
                {activeMutation.isPending ? (
                  <div className="text-center p-8">
                    <div className="w-24 h-24 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Creating your masterpiece...</p>
                  </div>
                ) : activeMutation.isError ? (
                  <div className="text-center p-8 max-w-md mx-auto">
                    <i className="ri-error-warning-line text-5xl text-red-500 mb-4 block"></i>
                    <p className="text-red-500 mb-2 font-medium">Something went wrong</p>
                    <p className="text-muted-foreground text-sm">
                      {activeMutation.error instanceof Error ? activeMutation.error.message : "Unknown error"}
                    </p>
                  </div>
                ) : (generateMutation.data || editImageMutation.data) ? (
                  <motion.div 
                    className="relative w-full h-full bg-black/20 backdrop-blur-sm flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    <img 
                      src={generateMutation.data?.url || editImageMutation.data?.url} 
                      alt={generateMutation.data?.prompt || "Edited image"}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      onError={(e) => {
                        console.error("Result image failed to load");
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIGVycm9yPC90ZXh0Pjwvc3ZnPg==";
                      }}
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-[#334155] hover:bg-[#475569] text-white"
                        onClick={() => downloadImage(
                          generateMutation.data?.url || editImageMutation.data?.url, 
                          `memex-${generateMutation.data?.id || editImageMutation.data?.id || 'edit'}`
                        )}
                      >
                        <i className="ri-download-line mr-1"></i> Save
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
                        onClick={() => {
                          const imageUrl = generateMutation.data?.url || editImageMutation.data?.url;
                          const promptText = generateMutation.data?.prompt || prompt;
                          const tweetText = `Check out this image I created with MemeX: "${promptText.substring(0, 50)}${promptText.length > 50 ? '...' : ''}"`;
                          const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.href)}`;
                          window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
                        }}
                      >
                        <i className="ri-twitter-x-fill mr-1"></i> Share
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center p-8 max-w-md mx-auto">
                    <i className="ri-image-line text-5xl text-muted-foreground/30 mb-4 block"></i>
                    <p className="text-muted-foreground">
                      Your meme masterpiece awaits...
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-2">
                      {activeTab === "generate" 
                        ? "Describe what you want to create in detail for best results."
                        : "Upload an image and describe how you want to transform it."
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
} 