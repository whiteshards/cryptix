
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [keySystemsData, setKeySystemsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('cryptix_jwt');
        
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/v1/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        
        if (data.success) {
          setUser(data.customer);
          // Check if user has keysystems property
          setKeySystemsData(data.customer.keysystems || []);
        } else {
          throw new Error('Failed to get user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message);
        // If token is invalid, redirect to login
        localStorage.removeItem('cryptix_jwt');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const getInitials = (discordId) => {
    // For now, use first character of discord ID since we don't have username
    // You can modify this when you have access to username
    return discordId ? discordId.charAt(0).toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-white hover:bg-gray-200 text-black py-2 px-4 rounded-md font-medium transition-colors duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Top Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - no logo as requested */}
            <div></div>
            
            {/* Right side */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white transition-colors duration-200">
                Help
              </button>
              
              {/* User Profile */}
              <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium font-inter">
                  {getInitials(user?.discord_id)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            {/* User Avatar */}
            <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-medium font-inter">
                {getInitials(user?.discord_id)}
              </span>
            </div>
            
            {/* User Info */}
            <div>
              <h1 className="text-2xl font-bold text-white font-inter">
                {user?.discord_id}'s Key Systems
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            <button className="bg-white hover:bg-gray-200 text-black py-2 px-4 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2 font-inter">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Key Systems Content */}
        <div className="space-y-6">
          {keySystemsData.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                {/* Roblox/Lua themed icon */}
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z"/>
                    <path d="M19.5 9.5L20.27 12.77L23.5 13.5L20.27 14.23L19.5 17.5L18.73 14.23L15.5 13.5L18.73 12.77L19.5 9.5Z"/>
                    <path d="M4.5 6.5L5.27 9.77L8.5 10.5L5.27 11.23L4.5 14.5L3.73 11.23L0.5 10.5L3.73 9.77L4.5 6.5Z"/>
                  </svg>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2 font-inter">
                  Create A New KeySystem
                </h3>
                
                <p className="text-gray-400 mb-6 font-inter">
                  Get started by creating your first Roblox script key system to monetize and protect your Lua scripts.
                </p>
                
                <button className="bg-white hover:bg-gray-200 text-black py-3 px-6 rounded-lg font-medium transition-colors duration-200 font-inter">
                  Create Your First KeySystem
                </button>
              </div>
            </div>
          ) : (
            /* Key Systems Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {keySystemsData.map((keySystem, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white font-inter">
                      {keySystem.name}
                    </h3>
                    <button className="text-gray-400 hover:text-white transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-2 font-inter">
                    <div>Keys: {keySystem.keys?.length || 0}</div>
                    <div>Status: {keySystem.activated ? 'Active' : 'Inactive'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
