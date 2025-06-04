import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

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
    
    // Enhanced animation variables
    let gradientPosition = 0;
    const speed = 0.01; // Faster for more visible movement
    
    function draw() {
      if (!ctx || !canvas) return;
      
      // Create a dynamic moving gradient
      gradientPosition += speed;
      const offset = Math.sin(gradientPosition) * 0.15; // Much more visible movement
      
      // Dynamic gradient background with enhanced animation
      const gradient = ctx.createLinearGradient(
        0, 0,
        canvas.width, canvas.height
      );
      
      // Clamp values to valid range [0, 1]
      gradient.addColorStop(Math.max(0, Math.min(1, 0 + offset)), '#0a0b14');
      gradient.addColorStop(Math.max(0, Math.min(1, 0.3 + offset)), '#1a1b3a');
      gradient.addColorStop(Math.max(0, Math.min(1, 0.6 + offset)), '#2a1f5a');
      gradient.addColorStop(Math.max(0, Math.min(1, 1 + offset)), '#0a0b14');
      
      // Fill background
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add multiple animated gradient overlays
      const secondaryOffset = Math.cos(gradientPosition * 0.7) * 0.3;
      const secondaryGradient = ctx.createRadialGradient(
        canvas.width * (0.2 + secondaryOffset), canvas.height * 0.8, 0,
        canvas.width * 0.8, canvas.height * 0.2, canvas.width * 0.7
      );
      
      secondaryGradient.addColorStop(0, 'rgba(139, 92, 246, 0.08)');
      secondaryGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.04)');
      secondaryGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = secondaryGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Third dynamic overlay
      const tertiaryOffset = Math.sin(gradientPosition * 0.5) * 0.2;
      const tertiaryGradient = ctx.createRadialGradient(
        canvas.width * (0.7 + tertiaryOffset), canvas.height * 0.3, 0,
        canvas.width * 0.3, canvas.height * 0.7, canvas.width * 0.5
      );
      
      tertiaryGradient.addColorStop(0, 'rgba(236, 72, 153, 0.06)');
      tertiaryGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.03)');
      tertiaryGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = tertiaryGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Enhanced vignette effect
      const radialGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.6
      );
      
      radialGradient.addColorStop(0, 'rgba(0,0,0,0)');
      radialGradient.addColorStop(1, 'rgba(0,0,0,0.4)');
      
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
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
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[-1]"
        aria-hidden="true"
      />
      
      {/* Much more visible floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        {/* Large visible floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-gradient-to-r from-primary/15 to-accent/12 blur-3xl"
          animate={{
            y: [-30, 30, -30],
            x: [-20, 20, -20],
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-accent/12 to-secondary/10 blur-3xl"
          animate={{
            y: [40, -40, 40],
            x: [25, -25, 25],
            scale: [1, 1.4, 1],
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        <motion.div
          className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/12 blur-2xl"
          animate={{
            y: [-25, 25, -25],
            x: [-15, 15, -15],
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />
        
        {/* Floating geometric shapes with trails */}
        <motion.div
          className="absolute top-1/5 right-1/3 w-4 h-4 bg-primary/40 rounded-full"
          animate={{
            y: [-50, 50, -50],
            opacity: [0.3, 1, 0.3],
            scale: [1, 2, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 left-1/5 w-3 h-3 bg-accent/50 rounded-full"
          animate={{
            y: [40, -40, 40],
            x: [20, -20, 20],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 3, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        <motion.div
          className="absolute top-3/4 right-2/3 w-5 h-5 bg-secondary/35 rounded-full"
          animate={{
            y: [-30, 30, -30],
            opacity: [0.25, 0.75, 0.25],
            rotate: [0, 360],
            scale: [1, 2.5, 1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />
        
        {/* Dynamic wave patterns */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-[0.08]"
          style={{
            background: `radial-gradient(ellipse at 30% 60%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), 
                        radial-gradient(ellipse at 70% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
                        radial-gradient(ellipse at 90% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 40%)`,
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Enhanced animated grid */}
        <motion.div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '60px 60px'],
            opacity: [0.02, 0.06, 0.02],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Pulsing corner accents */}
        <motion.div
          className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-accent/15 to-transparent rounded-full blur-2xl"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
    </>
  );
} 