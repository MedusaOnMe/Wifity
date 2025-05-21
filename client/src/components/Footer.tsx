import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="glass border-t border-white/5 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9333EA] to-[#06B6D4] flex items-center justify-center">
              <i className="ri-brain-line text-sm"></i>
            </div>
            <span className="font-display font-bold">NeuralCanvas<span className="text-[#06B6D4]">AI</span></span>
          </Link>
          
          <div className="flex space-x-4 mb-4 md:mb-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
          </div>
          
          <div className="flex space-x-3">
            <a href="#" className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-gray-300 hover:bg-[#9333EA] transition-colors">
              <i className="ri-twitter-x-line"></i>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-gray-300 hover:bg-[#9333EA] transition-colors">
              <i className="ri-discord-line"></i>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-gray-300 hover:bg-[#9333EA] transition-colors">
              <i className="ri-github-fill"></i>
            </a>
          </div>
        </div>
        
        <div className="text-center text-gray-500 text-xs mt-6">
          <p>© {new Date().getFullYear()} NeuralCanvasAI. All rights reserved. Not affiliated with OpenAI.</p>
          <p className="mt-1">API integration uses your own API keys and follows OpenAI's usage policies.</p>
        </div>
      </div>
    </footer>
  );
}
