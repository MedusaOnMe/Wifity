import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0F172A]" />
      
      <div className="absolute top-0 right-0 w-2/3 h-2/3 opacity-20">
        <motion.div 
          className="absolute right-[10%] top-[5%] w-80 h-80 rounded-full bg-[#9333EA]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            filter: "blur(80px)"
          }}
        />
      </div>
      
      <div className="absolute bottom-0 left-0 w-2/3 h-2/3 opacity-20">
        <motion.div 
          className="absolute left-[10%] bottom-[5%] w-80 h-80 rounded-full bg-[#06B6D4]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            filter: "blur(80px)"
          }}
        />
      </div>
      
      <SVGParticles />
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
