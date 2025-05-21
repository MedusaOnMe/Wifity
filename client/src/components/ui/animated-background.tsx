import { useRef, useEffect } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas dimensions
    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener("resize", resize);
    resize();
    
    // Define cryptic symbols
    const symbols = "⌘⌥⌦⎋⌬⏣⏢⏥⌓⌔⌖⌗⏧⌄⌂⌁⌀⎔⎕⏨⏩⏪⏫⏬⏭⏮";
    
    // Configure columns
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Initialize drops array
    const drops: number[] = Array(columns).fill(0);
    
    // Animation function
    function draw() {
      if (!ctx || !canvas) return;
      
      // Semi-transparent black background for trail effect
      ctx.fillStyle = "rgba(15, 16, 26, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set text style
      ctx.fillStyle = "#8b5cf6";
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = "center";
      
      // Loop through drops
      for (let i = 0; i < drops.length; i++) {
        // Get random symbol
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        // Draw symbol
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // Set varying opacity for more depth
        ctx.globalAlpha = Math.random() * 0.5 + 0.2;
        
        // Random subtle color variations
        const hue = Math.random() * 20 + 270; // Purple base
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${ctx.globalAlpha})`;
        
        // Draw the symbol
        ctx.fillText(symbol, x, y);
        
        // Reset when hitting bottom or randomly
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        // Increment y coordinate
        drops[i]++;
      }
      
      // Reset opacity
      ctx.globalAlpha = 1;
      
      // Schedule next frame
      requestAnimationFrame(draw);
    }
    
    // Start animation
    const animationId = requestAnimationFrame(draw);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
      aria-hidden="true"
    />
  );
} 