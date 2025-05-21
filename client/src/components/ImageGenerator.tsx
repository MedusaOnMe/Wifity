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
              <div className="particles bg-[#0F172A]/80 min-h-[400px] flex flex-col items-center justify-center p-8 rounded-xl backdrop-blur-sm border border-white/5 relative overflow-hidden">
                {/* Neural network animation effect */}
                <div className="absolute inset-0 overflow-hidden opacity-30">
                  <svg width="100%" height="100%" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" stroke="rgba(147, 51, 234, 0.5)" strokeWidth="1">
                      <path d="M0,100 Q400,0 800,100" className="animate-pulse" />
                      <path d="M0,200 Q400,100 800,200" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                      <path d="M0,300 Q400,200 800,300" className="animate-pulse" style={{ animationDelay: '1s' }} />
                    </g>
                  </svg>
                </div>
                
                <div className="w-16 h-16 relative mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-[#9333EA] border-t-transparent animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-4 border-[#06B6D4] border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-4 rounded-full border-4 border-[#EC4899] border-l-transparent animate-spin" style={{ animationDuration: '2s' }}></div>
                </div>

                <h3 className="font-display text-2xl mb-2 text-gradient">Creating Neural Masterpiece</h3>
                <p className="text-gray-300 text-center max-w-md">Our advanced AI is processing your prompt and generating a unique visual creation. This artistic process typically takes 10-15 seconds...</p>
                
                <div className="mt-8 w-full max-w-md">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span className="flex items-center"><i className="ri-cpu-line mr-1"></i> Neural Processing</span>
                    <span className="flex items-center"><i className="ri-flashlight-line mr-1"></i> Rendering in progress</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden bg-gradient-to-r from-[#1E293B]/50 to-[#1E293B]/50 backdrop-blur-sm p-0.5">
                    <div className="relative h-full w-full rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#9333EA] via-[#06B6D4] to-[#EC4899]"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      <div className="absolute inset-y-0 left-0 bg-[#0F172A] right-1/4 animate-[progressAnimation_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!isPending && generatedImageUrl && (
              <div className="relative rounded-xl overflow-hidden group">
                {/* Decorative frame */}
                <div className="absolute inset-0 p-0.5 bg-gradient-to-br from-[#9333EA] via-[#06B6D4] to-[#EC4899] opacity-70 z-10"></div>
                
                <img 
                  src={generatedImageUrl} 
                  alt="AI generated image based on your prompt" 
                  className="w-full h-auto object-cover relative z-0"
                />
                
                <div className="absolute top-4 left-4 z-20">
                  <span className="glass px-3 py-1.5 rounded-full text-xs flex items-center space-x-1 border border-white/10">
                    <i className="ri-cpu-line text-[#9333EA] mr-1"></i>
                    <span>DALL-E 3</span>
                  </span>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0F172A]/95 to-transparent p-6 flex justify-between items-center z-20">
                  <div className="max-w-md">
                    <p className="text-sm text-gray-300 line-clamp-1 mb-1">{prompt.slice(0, 100)}{prompt.length > 100 ? '...' : ''}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <span className="mr-4 flex items-center"><i className="ri-aspect-ratio-line mr-1"></i> {size}</span>
                      <span className="mr-4 flex items-center"><i className="ri-palette-line mr-1"></i> {style}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleDownload}
                      className="glass p-2 rounded-lg hover:bg-[#334155]/80 transition-colors group-hover:scale-105 duration-200 flex items-center space-x-1"
                    >
                      <i className="ri-download-line text-[#06B6D4]"></i>
                      <span className="text-xs hidden group-hover:inline-block transition-all">Save</span>
                    </button>
                    <button className="glass p-2 rounded-lg hover:bg-[#334155]/80 transition-colors group-hover:scale-105 duration-200 flex items-center space-x-1">
                      <i className="ri-share-line text-[#EC4899]"></i>
                      <span className="text-xs hidden group-hover:inline-block transition-all">Share</span>
                    </button>
                    <button className="glass p-2 rounded-lg hover:bg-[#334155]/80 transition-colors group-hover:scale-105 duration-200 flex items-center space-x-1">
                      <i className="ri-refresh-line text-[#9333EA]"></i>
                      <span className="text-xs hidden group-hover:inline-block transition-all">Retry</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {!isPending && !generatedImageUrl && !isError && (
              <div className="bg-[#1E293B]/30 min-h-[400px] flex flex-col items-center justify-center p-8 rounded-xl border border-white/5 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden opacity-10">
                  <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(147, 51, 234, 0.3)" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <circle cx="400" cy="200" r="150" fill="none" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" strokeDasharray="5,5" />
                    <circle cx="400" cy="200" r="100" fill="none" stroke="rgba(236, 72, 153, 0.2)" strokeWidth="1" strokeDasharray="3,3" />
                  </svg>
                </div>
                
                <div className="relative w-28 h-28 mb-8">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#9333EA]/30 via-[#06B6D4]/30 to-[#EC4899]/30 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="ri-image-add-line text-5xl text-white"></i>
                  </div>
                </div>
                
                <h3 className="font-display text-2xl mb-3 text-gradient">Unleash AI Creativity</h3>
                <p className="text-gray-300 text-center max-w-md">Enter a detailed prompt above and watch as advanced neural networks transform your words into stunning visual art</p>
                
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <div className="glass px-3 py-1.5 rounded-full text-xs flex items-center space-x-1 border border-white/10">
                    <i className="ri-brush-3-line text-[#9333EA] mr-1"></i>
                    <span>Artistic Details</span>
                  </div>
                  <div className="glass px-3 py-1.5 rounded-full text-xs flex items-center space-x-1 border border-white/10">
                    <i className="ri-landscape-line text-[#06B6D4] mr-1"></i>
                    <span>Scene Description</span>
                  </div>
                  <div className="glass px-3 py-1.5 rounded-full text-xs flex items-center space-x-1 border border-white/10">
                    <i className="ri-emotion-line text-[#EC4899] mr-1"></i>
                    <span>Style Keywords</span>
                  </div>
                </div>
              </div>
            )}
            
            {isError && (
              <div className="bg-[#0F172A]/70 min-h-[400px] flex flex-col items-center justify-center p-8 rounded-xl border border-red-500/20 backdrop-blur-sm">
                <div className="w-24 h-24 relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="ri-error-warning-line text-4xl text-red-500"></i>
                  </div>
                </div>
                
                <h3 className="font-display text-2xl mb-3 text-red-400">Generation Failed</h3>
                <p className="text-gray-300 text-center max-w-md">
                  {typeof error === 'object' && error !== null && 'message' in error
                    ? String(error.message)
                    : "There was an issue with your request. This could be due to content policy restrictions or a temporary service issue."}
                </p>
                
                <button 
                  onClick={handleSubmit}
                  className="mt-8 px-5 py-2.5 glass bg-red-500/10 hover:bg-red-500/20 transition-colors rounded-xl border border-red-500/30 flex items-center"
                >
                  <i className="ri-restart-line mr-2"></i>
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
