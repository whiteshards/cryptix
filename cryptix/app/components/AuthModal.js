
'use client';

import { useState, useEffect } from 'react';

export default function AuthModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleContinue = () => {
    window.open('https://discord.com/oauth2/authorize?client_id=1389474076375912520&response_type=code&redirect_uri=https%3A%2F%2Fcryptix-sigma.vercel.app%2Fcallback&scope=identify+guilds+email+guilds.join', '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background blur overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Gradient border container */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-green-500 via-green-400 to-green-600">
          {/* Animated star border effects */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 via-green-400 to-green-600 opacity-50 blur-[1px]"></div>
          
          {/* Primary animated border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 via-green-300 to-green-500 opacity-75 animate-spin" style={{animationDuration: '3s'}}></div>
          
          {/* Secondary trail effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-60 animate-pulse" style={{animationDuration: '2s'}}></div>
          
          {/* Rotating highlight */}
          <div className="absolute inset-0 rounded-2xl" style={{
            background: 'conic-gradient(from 0deg, transparent 270deg, #10b981 300deg, #22c55e 330deg, transparent 360deg)',
            animation: 'spin 4s linear infinite',
            opacity: 0.8
          }}></div>
          
          {/* Trail sparkle effect */}
          <div className="absolute inset-0 rounded-2xl" style={{
            background: 'conic-gradient(from 180deg, transparent 90deg, #34d399 120deg, #22c55e 150deg, transparent 180deg)',
            animation: 'spin 6s linear infinite reverse',
            opacity: 0.6
          }}></div>
          
          {/* Modal content */}
          <div className="relative bg-slate-900 rounded-2xl p-8"></div>
            {/* Alert title */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Alert!</h3>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-center mb-8 leading-relaxed">
              You're about to leave Cryptix to authenticate, authenticate with your discord and verify in the server and complete the invite process in the discord server to gain access to the free plan.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
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
