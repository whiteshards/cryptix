'use client';

import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

function CountingNumber({ target, duration = 4000, prefix = '', suffix = '' }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const value = Math.floor(easeOutQuart * target);

      setCurrent(value);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    // Start animation after a small delay
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 500);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      clearTimeout(timeout);
    };
  }, [target, duration]);

  return (
    <span>
      {prefix}{current.toLocaleString()}{suffix}
    </span>
  );
}

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
    <section className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden pt-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-500/10 rounded-lg transform rotate-45"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-green-400/20 rounded-full"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-green-300/15 rounded-lg transform rotate-12"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-green-500/20 rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto text-center">
        {/* Badge */}
        <div className={`mb-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            MONETIZE YOUR SCRIPTS TODAY
          </span>
        </div>

        {/* Main Heading */}
        <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight transition-all duration-1200 ease-out delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Revolutionizing          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
          Roblox Scripting
          </span>
        </h1>

        {/* Subtitle */}
        <p className={`max-w-3xl mx-auto text-lg sm:text-xl text-gray-300 mb-12 leading-relaxed transition-all duration-1000 ease-out delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          A premium experience for Roblox Scripters to
          <br className="hidden sm:block" />
          monetize their scripts seamlessly.
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 ease-out delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md text-base font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
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

        {/* Stats with counting animation */}
        <div className={`mt-20 mb-12 sm:mb-0 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto transition-all duration-1200 ease-out delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              <CountingNumber target={30000} prefix="" suffix="+" />
            </div>
            <div className="text-gray-400">Daily Executions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              <CountingNumber target={5000} suffix="+" />
            </div>
            <div className="text-gray-400">Active Scripters</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              <CountingNumber target={100} suffix="%" />
            </div>
            <div className="text-gray-400">Security</div>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </section>
  );
}