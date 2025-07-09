
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
          setKeySystemsData(data.customer.keysystems || []);
        } else {
          throw new Error('Failed to get user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message);
        localStorage.removeItem('cryptix_jwt');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900">
      {/* Account Activation Alert */}
      {user && !user.activated && (
        <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                  30 days or $5.00
                </span>
                <span className="text-green-300 text-sm">
                  Your trial expires in 30 days or when you're out of credits. Upgrade to keep your services online.
                </span>
              </div>
              <button className="text-green-300 hover:text-green-200 text-sm font-medium transition-colors duration-200">
                Choose a Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div></div>

            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                Help
              </button>

              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium font-inter">
                  {getInitials(user?.username)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
          <div className="flex items-center space-x-4 mb-6 sm:mb-0">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium font-inter">
                {getInitials(user?.username)}
              </span>
            </div>

            <h1 className="text-xl font-medium text-white font-inter">
              {user?.username}'s Key Systems
            </h1>

            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded border border-green-500/30">
              TRIAL
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200 rounded-md hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200 rounded-md hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200 rounded-md hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>

            <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200 rounded-md hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2 font-inter text-sm">
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
            /* Empty State - Clean design matching reference */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 mb-6 border-2 border-dashed border-purple-500/30 rounded-xl flex items-center justify-center bg-purple-500/5">
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-3 h-3 bg-purple-500/30 rounded-sm flex items-center justify-center">
                    <svg className="w-2 h-2 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="w-3 h-3 bg-purple-500/20 rounded-sm flex items-center justify-center">
                    <svg className="w-2 h-2 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="w-3 h-3 bg-purple-500/10 rounded-sm flex items-center justify-center">
                    <svg className="w-2 h-2 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="w-3 h-3 bg-purple-500/10 rounded-sm flex items-center justify-center">
                    <svg className="w-2 h-2 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium text-white mb-3 font-inter">
                Create A New KeySystem
              </h3>

              <p className="text-gray-400 font-inter text-sm max-w-md leading-relaxed">
                Deploy a GitHub Repository, Provision a Database, or create an Empty Project to start from local.
              </p>
            </div>
          ) : (
            /* Key Systems Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {keySystemsData.map((keySystem, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-200 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white font-inter">
                      {keySystem.name}
                    </h3>
                    <button className="text-gray-400 hover:text-white transition-colors duration-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
