
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
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Gradient border container */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 animate-pulse">
          {/* Star border effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 opacity-75 blur-sm animate-pulse"></div>
          
          {/* Modal content */}
          <div className="relative bg-slate-900 rounded-2xl p-8">
            {/* Alert icon and title */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
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
