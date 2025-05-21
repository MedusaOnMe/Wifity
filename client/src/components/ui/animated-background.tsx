import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0F172A]" />
      
      {/* Neural network visualization in the background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="neural-grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(147, 51, 234, 0.3)" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="neural-fade" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(147, 51, 234, 0.1)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0.1)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-grid)" />
          <rect width="100%" height="100%" fill="url(#neural-fade)" />
        </svg>
      </div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 right-0 w-full h-full">
        <motion.div 
          className="absolute right-[10%] top-[5%] w-96 h-96 rounded-full bg-[#9333EA]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            filter: "blur(90px)"
          }}
        />
        
        <motion.div 
          className="absolute right-[30%] top-[25%] w-64 h-64 rounded-full bg-[#EC4899]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.05, 0.1, 0.05],
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            filter: "blur(70px)"
          }}
        />
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-full">
        <motion.div 
          className="absolute left-[10%] bottom-[5%] w-96 h-96 rounded-full bg-[#06B6D4]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            filter: "blur(90px)"
          }}
        />
        
        <motion.div 
          className="absolute left-[40%] bottom-[15%] w-72 h-72 rounded-full bg-[#3B82F6]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            filter: "blur(80px)"
          }}
        />
      </div>
      
      {/* Floating particles */}
      <SVGParticles />
      
      {/* Scanner lines effect */}
      <motion.div 
        className="absolute inset-0 overflow-hidden opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 2 }}
      >
        <motion.div 
          className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent"
          animate={{ 
            y: ["-100vh", "200vh"],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#9333EA] to-transparent"
          animate={{ 
            y: ["-50vh", "250vh"],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.div>
    </div>
  );
}

function SVGParticles() {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Create particles
    const particlesCount = 15;
    const particles = [];
    
    for (let i = 0; i < particlesCount; i++) {
      const size = Math.random() * 3 + 1;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const opacity = Math.random() * 0.5 + 0.1;
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', size.toString());
      circle.setAttribute('fill', i % 2 === 0 ? '#9333EA' : '#06B6D4');
      circle.setAttribute('opacity', opacity.toString());
      
      svg.appendChild(circle);
      particles.push({ element: circle, x, y, size, speedX: Math.random() * 0.3 - 0.15, speedY: Math.random() * 0.3 - 0.15 });
    }
    
    // Animation loop
    let animationId: number;
    
    const animate = () => {
      particles.forEach(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Boundary check
        if (particle.x < 0 || particle.x > width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > height) particle.speedY *= -1;
        
        // Update element
        particle.element.setAttribute('cx', particle.x.toString());
        particle.element.setAttribute('cy', particle.y.toString());
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
      particles.forEach(particle => {
        if (particle.element.parentNode) {
          particle.element.parentNode.removeChild(particle.element);
        }
      });
    };
  }, []);
  
  return (
    <svg 
      ref={svgRef}
      className="absolute inset-0 w-full h-full z-0"
      xmlns="http://www.w3.org/2000/svg"
    />
  );
}
