
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardNavbar() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    // For now, use a placeholder username - in production this would come from API
    setUsername('Vxivs');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cryptix_jwt');
    localStorage.removeItem('cryptix_password');
    localStorage.removeItem('cryptix_discord_id');
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1015] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Help */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">C</span>
              </div>
            </div>
            
            {/* Help */}
            <button className="text-gray-400 hover:text-white text-sm transition-colors">
              Help
            </button>
          </div>

          {/* Center - Profile Section */}
          <div className="flex items-center space-x-3">
            {/* Profile Avatar */}
            <div className="w-6 h-6 bg-[#2a2d47] rounded-full flex items-center justify-center border border-white/10">
              <span className="text-white font-medium text-xs">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-white text-sm font-medium">
                {username}'s Projects
              </h1>
              <span className="px-2 py-0.5 bg-[#2a2d47] text-white/80 text-xs rounded border border-white/10 font-medium">
                TRIAL
              </span>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Settings */}
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* Refer */}
            <button className="text-gray-400 hover:text-white text-sm transition-colors">
              Refer
            </button>
            
            {/* Invite */}
            <button className="text-gray-400 hover:text-white text-sm transition-colors">
              Invite
            </button>
            
            {/* New Button */}
            <button className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
              New
            </button>

            {/* Profile Menu */}
            <div className="w-6 h-6 bg-[#2a2d47] rounded-full flex items-center justify-center border border-white/10 cursor-pointer hover:border-white/20 transition-colors" onClick={handleLogout}>
              <span className="text-white font-medium text-xs">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
