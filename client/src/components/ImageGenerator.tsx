import { useState, ChangeEvent, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadImage } from "@/lib/image-utils";

const SAMPLE_PROMPTS = [
  "Cyberpunk City",
  "Ethereal Fantasy",
  "Sci-Fi Portrait",
  "Abstract Neon"
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("A digital art masterpiece showing a futuristic AI brain connecting with human creativity, vibrant colors, intricate details, cyberpunk style with neon accents");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [style, setStyle] = useState<"vivid" | "natural">("vivid");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/images/generate", {
        prompt,
        size,
        quality,
        style
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedImageUrl(data.url);
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      toast({
        title: "Image generated successfully!",
        description: "Your AI creation is ready to view and download."
      });
    },
    onError: (err: any) => {
      toast({
        title: "Generation failed",
        description: err.message || "There was an error generating your image. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a description for your image.",
        variant: "destructive"
      });
      return;
    }
    mutate();
  };
  
  const handlePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };
  
  const handleSamplePromptClick = (samplePrompt: string) => {
    setPrompt(samplePrompt);
  };
  
  const handleDownload = () => {
    if (generatedImageUrl) {
      downloadImage(generatedImageUrl, `neuralcanvas-${Date.now()}`);
    }
  };
  
  return (
    <section className="mb-16">
      <Card className="glass rounded-3xl border border-white/5 overflow-hidden glow-border relative backdrop-blur-sm">
        {/* Neural circuit design overlay */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="circuit-board" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M20 60 L40 60 L40 30 L60 30 L60 60 L100 60" fill="none" stroke="rgba(147, 51, 234, 0.5)" strokeWidth="1"/>
              <path d="M60 60 L60 100 L30 100 L30 80" fill="none" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="1"/>
              <circle cx="20" cy="60" r="3" fill="rgba(147, 51, 234, 0.5)"/>
              <circle cx="60" cy="30" r="3" fill="rgba(6, 182, 212, 0.5)"/>
              <circle cx="60" cy="60" r="3" fill="rgba(236, 72, 153, 0.5)"/>
              <circle cx="100" cy="60" r="3" fill="rgba(147, 51, 234, 0.5)"/>
              <circle cx="30" cy="100" r="3" fill="rgba(6, 182, 212, 0.5)"/>
              <circle cx="30" cy="80" r="3" fill="rgba(147, 51, 234, 0.5)"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#circuit-board)"/>
          </svg>
        </div>
        
        <CardContent className="p-0">
          <div className="p-6 md:p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9333EA] to-[#06B6D4] flex items-center justify-center mr-3">
                  <i className="ri-brush-3-line text-lg"></i>
                </div>
                <h2 className="font-display font-bold text-2xl">Neural <span className="text-gradient">Image Creator</span></h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Engine:</span>
                <select className="glass py-1 px-3 rounded-full text-sm border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#9333EA] bg-transparent">
                  <option>DALL-E 3</option>
                  <option disabled>Stable Diffusion</option>
                  <option disabled>Midjourney Style</option>
                </select>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="relative">
                  <div className="glass relative rounded-xl overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-[#06B6D4] border border-white/10">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9333EA] via-[#06B6D4] to-[#EC4899] opacity-70"></div>
                    <textarea 
                      value={prompt}
                      onChange={handlePromptChange}
                      placeholder="Describe the image you want to create... Be detailed and specific for best results."
                      className="w-full p-4 pr-12 h-32 md:h-40 bg-transparent text-gray-100 focus:outline-none resize-none font-medium"
                    />
                    <div className="absolute bottom-3 right-3 flex space-x-2">
                      <button type="button" className="p-2 rounded-lg bg-[#1E293B]/50 hover:bg-[#334155] transition-colors group">
                        <i className="ri-magic-line text-[#9333EA] group-hover:text-[#b366f3] transition-colors"></i>
                      </button>
                      <button type="button" className="p-2 rounded-lg bg-[#1E293B]/50 hover:bg-[#334155] transition-colors group">
                        <i className="ri-terminal-line text-[#06B6D4] group-hover:text-[#25d8f5] transition-colors"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {SAMPLE_PROMPTS.map((samplePrompt, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSamplePromptClick(samplePrompt)}
                      className="glass px-3 py-1 rounded-full text-xs bg-[#334155]/30 cursor-pointer hover:bg-[#334155]/50 hover:text-[#06B6D4] transition-colors"
                    >
                      {samplePrompt}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="glass p-3 rounded-xl border border-white/5 relative overflow-hidden group hover:border-[#9333EA]/30 transition-colors">
                    <div className="absolute top-0 left-0 w-0 h-1 bg-[#9333EA] group-hover:w-full transition-all duration-300"></div>
                    <label className="text-xs text-gray-400 block mb-1 flex items-center">
                      <i className="ri-aspect-ratio-line mr-1 text-[#9333EA]"></i>
                      Dimensions
                    </label>
                    <select 
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="bg-transparent w-full focus:outline-none text-sm"
                    >
                      <option value="1024x1024">1024 × 1024 (Square)</option>
                      <option value="1024x1792">1024 × 1792 (Portrait)</option>
                      <option value="1792x1024">1792 × 1024 (Landscape)</option>
                    </select>
                  </div>
                  
                  <div className="glass p-3 rounded-xl border border-white/5 relative overflow-hidden group hover:border-[#06B6D4]/30 transition-colors">
                    <div className="absolute top-0 left-0 w-0 h-1 bg-[#06B6D4] group-hover:w-full transition-all duration-300"></div>
                    <label className="text-xs text-gray-400 block mb-1 flex items-center">
                      <i className="ri-hd-line mr-1 text-[#06B6D4]"></i>
                      Resolution
                    </label>
                    <select 
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="bg-transparent w-full focus:outline-none text-sm"
                    >
                      <option value="standard">Standard (Fast)</option>
                      <option value="hd">HD (Premium)</option>
                    </select>
                  </div>
                  
                  <div className="glass p-3 rounded-xl border border-white/5 relative overflow-hidden group hover:border-[#EC4899]/30 transition-colors col-span-2 md:col-span-1">
                    <div className="absolute top-0 left-0 w-0 h-1 bg-[#EC4899] group-hover:w-full transition-all duration-300"></div>
                    <label className="text-xs text-gray-400 block mb-1 flex items-center">
                      <i className="ri-palette-line mr-1 text-[#EC4899]"></i>
                      Rendering Style
                    </label>
                    <select 
                      value={style}
                      onChange={(e) => {
                        if (e.target.value === "vivid" || e.target.value === "natural") {
                          setStyle(e.target.value);
                        }
                      }}
                      className="bg-transparent w-full focus:outline-none text-sm"
                    >
                      <option value="vivid">Vivid (Enhanced Colors)</option>
                      <option value="natural">Natural (Realistic Look)</option>
                    </select>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={isPending}
                  className="relative overflow-hidden bg-gradient-to-r from-[#9333EA] to-[#06B6D4] hover:opacity-90 transition-all py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 text-white h-12 shadow-lg shadow-[#9333EA]/20 group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#06B6D4] to-[#9333EA] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  
                  {isPending ? (
                    <div className="flex items-center justify-center gap-2 relative z-10">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Masterpiece...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 relative z-10">
                      <i className="ri-ai-generate text-lg"></i>
                      <span>Generate Image</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
          
          <div className="relative">
            {isPending && (
              <div className="particles bg-[#0F172A]/50 min-h-[400px] flex flex-col items-center justify-center p-8">
                <div className="w-12 h-12 rounded-full border-4 border-[#9333EA] border-t-transparent animate-spin mb-6"></div>
                <h3 className="font-display text-xl mb-2">Creating Your Vision</h3>
                <p className="text-gray-400 text-center max-w-md">Our AI is generating your image now. This usually takes 10-15 seconds depending on complexity...</p>
                
                <div className="mt-8 w-full max-w-md">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Processing Image</span>
                    <span>In progress...</span>
                  </div>
                  <div className="w-full bg-[#334155]/30 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#06B6D4] h-full w-3/4 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            
            {!isPending && generatedImageUrl && (
              <div className="relative">
                <img 
                  src={generatedImageUrl} 
                  alt="AI generated image based on your prompt" 
                  className="w-full h-auto object-cover"
                />
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0F172A]/90 to-transparent p-4 flex justify-between items-center">
                  <div>
                    <span className="text-xs bg-[#9333EA]/30 px-2 py-1 rounded-md">DALL-E 3</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleDownload}
                      className="p-2 rounded-lg bg-[#1E293B]/70 hover:bg-[#334155] transition-colors"
                    >
                      <i className="ri-download-line"></i>
                    </button>
                    <button className="p-2 rounded-lg bg-[#1E293B]/70 hover:bg-[#334155] transition-colors">
                      <i className="ri-share-line"></i>
                    </button>
                    <button className="p-2 rounded-lg bg-[#1E293B]/70 hover:bg-[#334155] transition-colors">
                      <i className="ri-more-2-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {!isPending && !generatedImageUrl && !isError && (
              <div className="bg-[#1E293B]/30 min-h-[400px] flex flex-col items-center justify-center p-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#9333EA]/30 to-[#06B6D4]/30 flex items-center justify-center mb-6">
                  <i className="ri-image-add-line text-4xl text-[#06B6D4]"></i>
                </div>
                <h3 className="font-display text-xl mb-2">Ready to Create</h3>
                <p className="text-gray-400 text-center max-w-md">Enter a detailed prompt above and click Generate to create your AI masterpiece</p>
              </div>
            )}
            
            {isError && (
              <div className="bg-[#0F172A]/50 min-h-[400px] flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                  <i className="ri-error-warning-line text-3xl text-red-500"></i>
                </div>
                <h3 className="font-display text-xl mb-2">Generation Failed</h3>
                <p className="text-gray-400 text-center max-w-md">
                  {typeof error === 'object' && error !== null && 'message' in error
                    ? String(error.message)
                    : "There was an issue with your request. This could be due to content policy restrictions or a temporary service issue."}
                </p>
                <button 
                  onClick={handleSubmit}
                  className="mt-6 px-4 py-2 bg-[#334155] rounded-lg hover:bg-[#475569] transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
