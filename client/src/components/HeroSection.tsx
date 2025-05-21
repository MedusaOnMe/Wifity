import { useState } from "react";
import { motion } from "framer-motion";

export default function HeroSection() {
  const [hovered, setHovered] = useState(false);
  
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1 
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Transform <span className="text-gradient">Words</span> into 
            <span className="relative ml-2">
              <span 
                className="glitch" 
                data-text="Visions"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                Visions
              </span>
              {hovered && (
                <span className="absolute -right-8 top-0 cryptic-symbols opacity-50 text-sm"></span>
              )}
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Speak your intentions into the void. Watch as the unseen forces manifest your desires into visual form. Each creation bears the mark of the unknown.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <a 
              href="#image-generator" 
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Begin Manifestation
            </a>
            <a 
              href="/gallery" 
              className="px-6 py-3 rounded-lg glass hover:bg-[#262a45]/50 transition-colors"
            >
              View Visions
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 