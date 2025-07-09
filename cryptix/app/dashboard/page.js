
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication and fetch profile
    const token = localStorage.getItem('cryptix_jwt');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserProfile(token);
  }, [router]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('/api/v1/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, redirect to login
          localStorage.removeItem('cryptix_jwt');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data.success) {
        setUserProfile(data.customer);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
      // If there's an error, still allow them to see the dashboard with limited functionality
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

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

  const username = userProfile?.username || 'User';
  const keysystems = userProfile?.keysystems || [];

  return (
    <div className="min-h-screen bg-[#0f1015]">
      {/* Profile Section (Navbar) */}
      <div className="pt-8 px-8">
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
                  {username}'s Dashboard
                </h1>
                {userProfile?.activated !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userProfile.activated 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {userProfile.activated ? 'Activated' : 'Pending Activation'}
                  </span>
                )}
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
              
              <button className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
                New
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Your Keysystems Section */}
      <div className="px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#1a1b2e] rounded-lg border border-white/10 p-6">
            <h2 className="text-white text-xl font-semibold mb-6">Your Keysystems</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">
                  Error loading profile data: {error}
                </p>
              </div>
            )}

            {keysystems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-base">
                  No Key Systems In Your Account, Click The "New" Button To Create One.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {keysystems.map((keysystem, index) => (
                  <div key={index} className="bg-[#2a2d47] rounded-lg border border-white/10 p-4 hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium text-sm truncate">
                        {keysystem.name || `Keysystem ${index + 1}`}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        keysystem.active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {keysystem.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {keysystem.id && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">ID:</span>
                          <span className="text-gray-300 font-mono text-xs">{keysystem.id}</span>
                        </div>
                      )}
                      {keysystem.createdAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Created:</span>
                          <span className="text-gray-300">{new Date(keysystem.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
                        Edit
                      </button>
                      <button className="px-3 py-1.5 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded text-xs font-medium transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
