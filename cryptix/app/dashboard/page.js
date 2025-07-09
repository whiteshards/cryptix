
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function DashboardNavbar({ username }) {
  const router = useRouter();
  
  const handleLogout = () => {
    localStorage.removeItem('cryptix_jwt');
    localStorage.removeItem('cryptix_password');
    localStorage.removeItem('cryptix_discord_id');
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1b2e]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Logo and user info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              {/* Profile Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border border-white/10">
                <span className="text-white font-medium text-sm">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Username and Projects */}
              <div>
                <h1 className="text-white font-medium text-base">
                  {username}'s Projects
                </h1>
              </div>
            </div>
            
            {/* Trial badge */}
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded border border-green-500/30">
                TRIAL
              </span>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            <button className="text-gray-400 hover:text-white transition-colors duration-200">
              Refer
            </button>
            
            <button className="text-gray-400 hover:text-white transition-colors duration-200">
              Invite
            </button>
            
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
              New
            </button>
          </div>
        </div>
        
        {/* Trial info bar */}
        <div className="mt-4 flex justify-between items-center text-sm">
          <div className="text-green-400">
            30 days or $5.00 | Your trial expires in 30 days or when you're out of credits. Upgrade to keep your services online.
          </div>
          <button className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
            Choose a Plan
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('cryptix_jwt');
    if (!token) {
      router.push('/login');
      return;
    }

    // For now, use a placeholder username - in production this would come from API
    setUsername('Vxivs');
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f1419]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <DashboardNavbar username={username} />
      
      {/* Main content area */}
      <div className="pt-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Content will be added later */}
        </div>
      </div>
    </div>
  );
}
