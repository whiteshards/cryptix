
'use client';

import { useState, useEffect } from 'react';

export default function AuthModal({ isOpen, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Trigger animation after modal mounts
      setTimeout(() => setIsVisible(true), 10);
    } else {
      document.body.style.overflow = 'unset';
      setIsVisible(false);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleContinue = () => {
    window.location.href = 'https://discord.com/oauth2/authorize?client_id=1389474076375912520&response_type=code&redirect_uri=https%3A%2F%2Fcryptix-sigma.vercel.app%2Fcallback&scope=identify+guilds+email+guilds.join';
    onClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    // Delay actual close to allow exit animation
    setTimeout(() => onClose(), 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background blur overlay with fade in */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      ></div>

      {/* Modal with scale and fade animation */}
      <div className={`relative z-10 w-full max-w-md mx-4 transition-all duration-300 ease-out ${
        isVisible 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
      }`}>
        {/* Gradient border container with glow effect */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-green-500 via-green-400 to-green-600">
          {/* Animated star border effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 via-green-400 to-green-600 opacity-50 blur-[1px] animate-pulse"></div>
          
          {/* Subtle rotating glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 via-transparent to-green-500/20 animate-spin" style={{ animationDuration: '8s' }}></div>

          {/* Modal content */}
          <div className="relative bg-slate-900 rounded-2xl p-8 backdrop-blur-sm">
            {/* Alert title with slide down animation */}
            <div className={`text-center mb-6 transition-all duration-500 ease-out delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}>
              <h3 className="text-2xl font-bold text-white mb-2">Alert!</h3>
            </div>

            {/* Description with slide up animation */}
            <p className={`text-gray-300 text-center mb-8 leading-relaxed transition-all duration-500 ease-out delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              You're about to leave Cryptix to authenticate, authenticate with your discord and verify in the server and complete the invite process in the discord server to gain access to the free plan.
            </p>

            {/* Buttons with staggered slide up animation */}
            <div className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 ease-out delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 transition-all duration-200 font-medium hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
