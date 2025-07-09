
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f1015]">
      {/* Profile Section */}
      <div className="pt-32 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              {/* Profile Avatar with first letter */}
              <div className="w-8 h-8 bg-[#2a2d47] rounded-full flex items-center justify-center border border-white/10">
                <span className="text-white font-medium text-sm">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <h1 className="text-white text-lg font-medium">
                  {username}'s Projects
                </h1>
                <span className="px-2 py-1 bg-[#2a2d47] text-white/80 text-xs rounded border border-white/10 font-medium">
                  TRIAL
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <span className="text-sm">Refer</span>
              </button>
              
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <span className="text-sm">Invite</span>
              </button>
              
              <button className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
                New
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
