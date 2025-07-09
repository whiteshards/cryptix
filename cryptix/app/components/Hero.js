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
    <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden px-2 sm:px-6 lg:px-8 pt-2">
      {/* Animated grid background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}
        />
        <style jsx>{`
          @keyframes gridMove {
            0% {
              transform: translate(0, 0);
            }
            100% {
              transform: translate(50px, 50px);
            }
          }
        `}</style>
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-16 h-16 bg-white/3 rounded-lg transform rotate-45"></div>
        <div className="absolute bottom-40 right-20 w-12 h-12 bg-white/5 rounded-full"></div>
        <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-white/3 rounded-lg transform rotate-12"></div>
        <div className="absolute bottom-20 left-1/4 w-10 h-10 bg-white/5 rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className={`mb-6 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-gray-400 uppercase tracking-wider">
            MONETIZE YOUR SCRIPTS TODAY
          </span>
        </div>

        {/* Main Heading */}
        <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight transition-all duration-1200 ease-out delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
        <p className={`max-w-2xl mx-auto text-base sm:text-lg text-gray-400 mb-8 leading-relaxed transition-all duration-1000 ease-out delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          A premium experience for Roblox Scripters to monetize their scripts seamlessly.
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-3 justify-center items-center transition-all duration-1000 ease-out delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="px-6 py-2.5 bg-white hover:bg-blue-700 text-black text-sm font-medium rounded-md transition-all duration-200"
          >
            Free Invite
          </button>
          <button className="px-6 py-2.5 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200 group flex items-center">
            Features
            <svg className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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