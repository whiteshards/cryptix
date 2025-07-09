
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

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
    setUsername('User');
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
    <div className="min-h-screen bg-[#1a1b2e]">
      <Navbar />
      
      {/* Profile Section */}
      <div className="pt-32 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            {/* Profile Avatar with first letter */}
            <div className="w-12 h-12 bg-[#2a2d47] rounded-full flex items-center justify-center border border-white/10">
              <span className="text-white font-medium text-lg">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div>
              <h1 className="text-white text-xl font-medium">
                {username}'s Projects
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-2 py-1 bg-[#2a2d47] text-white/80 text-xs rounded border border-white/10">
                  TRIAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
