
'use client';

import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
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
                Trading
              </a>
              <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm font-medium">
                Portfolio
              </a>
              <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm font-medium">
                Support
              </a>
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800 rounded-lg mt-2">
              <a href="#" className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium">
                Features
              </a>
              <a href="#" className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium">
                Trading
              </a>
              <a href="#" className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium">
                Portfolio
              </a>
              <a href="#" className="text-gray-300 hover:text-green-400 block px-3 py-2 text-base font-medium">
                Support
              </a>
              <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
