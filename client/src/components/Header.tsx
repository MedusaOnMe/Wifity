import { Link } from "wouter";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="glass fixed top-0 left-0 right-0 z-50 border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9333EA] to-[#06B6D4] flex items-center justify-center">
              <i className="ri-brain-line text-xl"></i>
            </div>
            <h1 className="font-display font-bold text-xl">NeuralCanvas<span className="text-[#06B6D4]">AI</span></h1>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/gallery">
              <a className="font-medium hover:text-[#06B6D4] transition-colors duration-200">Gallery</a>
            </Link>
            <a href="#" className="font-medium hover:text-[#06B6D4] transition-colors duration-200">Models</a>
            <a href="#" className="font-medium hover:text-[#06B6D4] transition-colors duration-200">How It Works</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link href="/gallery">
              <a className="glass px-3 py-1.5 rounded-full text-sm flex items-center space-x-1 hover:bg-[#334155] transition-all duration-200">
                <i className="ri-history-line"></i>
                <span>History</span>
              </a>
            </Link>
            <button className="glass bg-[#9333EA]/20 px-3 py-1.5 rounded-full text-sm flex items-center space-x-1 hover:bg-[#9333EA]/30 transition-all duration-200">
              <i className="ri-user-line"></i>
              <span>Account</span>
            </button>
            <button className="md:hidden text-xl" onClick={onMenuClick}>
              <i className="ri-menu-line"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
