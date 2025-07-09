
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data.success) {
        setUser(data.customer);
      } else {
        throw new Error(data.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err.message);
      // If unauthorized, redirect to login
      if (err.message.includes('401') || err.message.includes('token')) {
        localStorage.removeItem('cryptix_jwt');
        localStorage.removeItem('cryptix_discord_id');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cryptix_jwt');
    localStorage.removeItem('cryptix_password');
    localStorage.removeItem('cryptix_discord_id');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-black px-4 py-2 rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (username) => {
    if (!username) return 'U';
    return username.charAt(0).toUpperCase();
  };

  const hasKeySystems = user?.keysystems && user.keysystems.length > 0;

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Top Navigation */}
      <nav className="bg-[#161b22] border-b border-[#30363d] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left side - User info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold font-['Inter']">
                  {getInitials(user?.username)}
                </span>
              </div>
              <span className="text-[#f0f6fc] font-medium font-['Inter']">
                {user?.username}'s Key Systems
              </span>
              <span className="bg-[#238636] text-[#f0f6fc] px-2 py-1 rounded text-xs font-medium">
                TRIAL
              </span>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            <button className="text-[#7d8590] hover:text-[#f0f6fc] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="text-[#7d8590] hover:text-[#f0f6fc] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="bg-[#21262d] border border-[#30363d] text-[#f0f6fc] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#30363d] transition-colors">
              Refer
            </button>
            <button className="bg-[#21262d] border border-[#30363d] text-[#f0f6fc] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#30363d] transition-colors">
              Invite
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Trial Banner */}
      <div className="bg-[#1f2937] border-b border-[#30363d] px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-[#10b981] font-medium">30 days or $5.00</span>
            <span className="text-[#9ca3af]">Your trial expires in 30 days or when you're out of credits. Upgrade to keep your services online.</span>
          </div>
          <button className="text-[#60a5fa] hover:text-[#93c5fd] text-sm font-medium">
            Choose a Plan
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {hasKeySystems ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.keysystems.map((keysystem, index) => (
              <div key={index} className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 hover:border-[#7c3aed] transition-colors cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-[#30363d] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#7d8590]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[#f0f6fc] font-medium font-['Inter']">{keysystem.name || `Key System ${index + 1}`}</h3>
                    <p className="text-[#7d8590] text-sm">{keysystem.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#7d8590]">
                    {keysystem.status || 'Active'}
                  </span>
                  <span className="text-[#7d8590]">
                    {keysystem.createdAt ? new Date(keysystem.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-8 max-w-md w-full text-center">
              <div className="w-16 h-16 bg-[#30363d] rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#7d8590]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-[#f0f6fc] text-xl font-semibold mb-2 font-['Inter']">Create A New KeySystem</h2>
              <p className="text-[#7d8590] mb-6 font-['Inter']">
                Deploy a GitHub Repository, Provision a Database, or create an Empty Project to start from local.
              </p>
              <div className="text-[#7d8590] text-sm">
                No key systems available yet.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
