'use client';

import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [discordId, setDiscordId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('cryptix_jwt');
    const discordIdStored = localStorage.getItem('cryptix_discord_id');

    if (token) {
      setIsAuthenticated(true);
      if (discordIdStored) {
        setDiscordId(discordIdStored);
      }
    } else {
      setIsAuthenticated(false);
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('cryptix_jwt');
    localStorage.removeItem('cryptix_password');
    localStorage.removeItem('cryptix_discord_id');
    setIsAuthenticated(false);
    router.push('/');
  };

  // Hide navbar on mobile for landing page
  if (isMobile && pathname === '/') {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1015] border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#6366f1] rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">Cryptix</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
              Documentation
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
              Pricing
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
              Status
            </a>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                  Dashboard
                </a>
                <button
                  onClick={handleLogout}
                  className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white transition-colors duration-200"
            >
              <svg className={`h-6 w-6 transform transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className={`px-2 pt-4 pb-3 space-y-1 transform transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-4 scale-95'
          }`}>
            <a href="#" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium transition-all duration-200">
              Documentation
            </a>
            <a href="#" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium transition-all duration-200">
              Pricing
            </a>
            <a href="#" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium transition-all duration-200">
              Status
            </a>
            {isAuthenticated ? (
              <>
                <a href="/dashboard" className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium transition-all duration-200">
                  Dashboard
                </a>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-2 text-base font-medium transition-all duration-200 rounded-lg mt-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full text-left bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-2 text-base font-medium transition-all duration-200 rounded-lg mt-2"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  );
}