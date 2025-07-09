
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('cryptix_jwt');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/v1/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        if (data.success) {
          setUser(data.customer);
        } else {
          throw new Error('Invalid response');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
        // If token is invalid, redirect to login
        localStorage.removeItem('cryptix_jwt');
        localStorage.removeItem('cryptix_discord_id');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('cryptix_jwt');
    localStorage.removeItem('cryptix_discord_id');
    router.push('/');
  };

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Error loading dashboard</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Navigation */}
      <nav className="border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - User info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* User Avatar */}
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {getInitials(user.username)}
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-medium">{user.username}'s Key Systems</h1>
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button 
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">New</span>
              </button>
              <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile title */}
        <div className="sm:hidden mb-6">
          <h1 className="text-xl font-medium">{user.username}'s Key Systems</h1>
        </div>

        {/* Content Area */}
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          {user.keysystems && user.keysystems.length > 0 ? (
            // Show keysystems if they exist
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.keysystems.map((keysystem, index) => (
                  <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
                    <h3 className="text-lg font-medium mb-2">{keysystem.name}</h3>
                    <p className="text-gray-400 text-sm">{keysystem.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Show empty state
            <div className="text-center max-w-md mx-auto">
              {/* Icon container */}
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="w-3 h-3 bg-gray-600 rounded"></div>
                    <div className="w-3 h-3 bg-gray-600 rounded"></div>
                    <div className="w-3 h-3 bg-gray-600 rounded"></div>
                    <div className="w-3 h-3 bg-purple-500 rounded flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text content */}
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-white">Create A New KeySystem</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Deploy a KeySystem, Provision a Database, or create an Empty KeySystem to start from local.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
