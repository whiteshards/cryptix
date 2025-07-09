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
    <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden pt-36 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-lg transform rotate-45"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-lg transform rotate-12"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-white/10 rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto text-center">
        {/* Badge */}
        <div className={`mb-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white border border-white/20">
            MONETIZE YOUR SCRIPTS TODAY
          </span>
        </div>

        {/* Main Heading */}
        <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight transition-all duration-1200 ease-out delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400">
            Monetizing
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-white to-gray-300">
            Roblox Scripting
          </span>
        </h1>

        {/* Subtitle */}
        <p className={`max-w-4xl mx-auto text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 mb-12 leading-relaxed transition-all duration-1000 ease-out delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          A premium experience for Roblox Scripters to
          <br className="hidden sm:block" />
          monetize their scripts seamlessly.
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 ease-out delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full sm:w-auto bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-md text-base font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-white/25"
          >
            Free Invite
          </button>
          <button className="w-full sm:w-auto group flex items-center justify-center text-gray-300 hover:text-white px-6 py-3 text-base font-medium transition-colors duration-200">
            Features
            <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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