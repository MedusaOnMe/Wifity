import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const [location] = useLocation();
  
  // Close drawer when location changes (navigation occurs)
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location, isOpen, onClose]);

  // Prevent body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div 
            className="absolute top-0 right-0 w-64 h-full glass border-l border-white/5 p-6"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-display font-bold">Menu</h3>
              <button className="p-1" onClick={onClose}>
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <nav className="flex flex-col space-y-4">
              <Link href="/">
                <a className={`py-2 px-4 rounded-lg hover:bg-[#334155] transition-colors ${location === '/' ? 'bg-[#334155]/70 text-white' : ''}`}>
                  Home
                </a>
              </Link>
              <Link href="/gallery">
                <a className={`py-2 px-4 rounded-lg hover:bg-[#334155] transition-colors ${location === '/gallery' ? 'bg-[#334155]/70 text-white' : ''}`}>
                  Gallery
                </a>
              </Link>
              <a href="#" className="py-2 px-4 rounded-lg hover:bg-[#334155] transition-colors">Models</a>
              <a href="#" className="py-2 px-4 rounded-lg hover:bg-[#334155] transition-colors">How It Works</a>
              <a href="#" className="py-2 px-4 rounded-lg hover:bg-[#334155] transition-colors">History</a>
              <a href="#" className="py-2 px-4 rounded-lg hover:bg-[#334155] transition-colors">Account</a>
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
