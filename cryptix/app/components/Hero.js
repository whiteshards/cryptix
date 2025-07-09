'use client';

import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';



export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-16 h-16 bg-white/3 rounded-lg transform rotate-45"></div>
        <div className="absolute bottom-40 right-20 w-12 h-12 bg-white/5 rounded-full"></div>
        <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-white/3 rounded-lg transform rotate-12"></div>
        <div className="absolute bottom-20 left-1/4 w-10 h-10 bg-white/5 rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center px-4">
        {/* Badge */}
        <div className={`mb-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-gray-400 uppercase tracking-wider border border-gray-700/50">
            MONETIZE YOUR SCRIPTS TODAY
          </span>
        </div>

        {/* Main Heading */}
        <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight transition-all duration-1200 ease-out delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400">
            Monetizing
          </span>
          {' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-white to-gray-300">
            the future
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-white to-gray-300">
            of Roblox Scripting
          </span>
        </h1>

        {/* Subtitle */}
        <p className={`max-w-3xl mx-auto text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed transition-all duration-1000 ease-out delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          A premium experience for Roblox Scripters to monetize their scripts seamlessly.
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 ease-out delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Free Invite
          </button>
          <button className="px-8 py-3 text-gray-300 hover:text-white text-base font-medium transition-colors duration-200 group flex items-center">
            Features
            <svg className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </section>
  );
}