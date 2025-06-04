import { useEffect } from "react";
import { Link, useLocation } from "wouter";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute top-0 right-0 w-64 h-full bg-white border-l border-gray-200 p-6">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-display font-semibold text-gray-900">Menu</h3>
          <button 
            className="p-1 text-gray-600 hover:text-gray-900" 
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="flex flex-col space-y-2">
          <Link href="/">
            <a className={`py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${location === '/' ? 'bg-gray-100 font-medium' : ''}`}>
              Create
            </a>
          </Link>
          <Link href="/gallery">
            <a className={`py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${location === '/gallery' ? 'bg-gray-100 font-medium' : ''}`}>
              Gallery
            </a>
          </Link>
          <a 
            href="https://x.com/i/communities/1929531995563884891" 
            target="_blank" 
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Follow on X
          </a>
        </nav>
      </div>
    </div>
  );
}