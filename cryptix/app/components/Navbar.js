'use client';

import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [discordId, setDiscordId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('cryptix_jwt');
    if (token) {
      setIsAuthenticated(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setDiscordId(payload.discordId);
      } catch (error) {
        console.error("Error decoding JWT:", error);
        localStorage.removeItem('cryptix_jwt');
        localStorage.removeItem('cryptix_password');
        setIsAuthenticated(false);
        router.push('/');
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('cryptix_jwt');
    localStorage.removeItem('cryptix_password');
    setIsAuthenticated(false);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-white">Cryptix</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm font-medium">
                Features
              </a>
              <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm font-medium">
                Create Account
              </a>
              {isAuthenticated ? (
                <a href="/dashboard" className="text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm font-medium">
                  Dashboard
                </a>
              ) : (
                <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm font-medium">
                  Dashboard
                </a>
              )}
              <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm font-medium">
                Support
              </a>
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Get Invite
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
          <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800 rounded-lg mt-2 transform transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-4 scale-95'
          }`}>
            <a href="#" className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium transition-all duration-200 hover:translate-x-1">
              Features
            </a>
            <a href="#" className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium transition-all duration-200 hover:translate-x-1">
              Create Account
            </a>
             {isAuthenticated ? (
                <a href="/dashboard" className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium transition-all duration-200 hover:translate-x-1">
                  Dashboard
                </a>
              ) : (
                <a href="#" className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium transition-all duration-200 hover:translate-x-1">
                  Dashboard
                </a>
              )}
            <a href="#" className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium transition-all duration-200 hover:translate-x-1">
              Support
            </a>
            {!isAuthenticated ? (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full text-left bg-green-500 hover:bg-green-600 text-white px-3 py-2 text-base font-medium transition-all duration-200 hover:translate-x-1"
              >
                Get Invite
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="w-full text-left bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-base font-medium transition-all duration-200 hover:translate-x-1"
              >
                Logout
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