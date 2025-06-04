import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo Section */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <div>
                <span className="font-display text-lg font-semibold text-gray-700">
                  No-ify
                </span>
                <div className="text-xs text-gray-500">Simple nofacify</div>
              </div>
            </Link>
          </div>
          
          {/* Quick Links */}
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Convert
            </Link>
            <Link 
              href="/gallery" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Gallery
            </Link>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full h-px bg-gray-200 my-6"></div>
        
        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-600 text-sm">
              © {currentYear} No-ify. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Convert images to clean, minimalist nofacified versions.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}