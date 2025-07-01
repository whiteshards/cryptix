
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [discordId, setDiscordId] = useState('');
  const [jwtToken, setJwtToken] = useState('');

  useEffect(() => {
    // Check for JWT token in localStorage
    const token = localStorage.getItem('cryptix_jwt');
    const discord_id = localStorage.getItem('cryptix_discord_id');

    if (!token) {
      // No JWT token found, redirect to landing page
      router.push('/');
      return;
    }

    setJwtToken(token);
    setDiscordId(discord_id || 'Not available');
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('cryptix_jwt');
    localStorage.removeItem('cryptix_discord_id');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">Cryptix Dashboard</h1>
            <button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discord ID Card */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Discord Information</h2>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400">Discord ID:</span>
                <p className="text-white font-mono text-sm break-all">{discordId}</p>
              </div>
            </div>
          </div>

          {/* JWT Token Card */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Authentication Token</h2>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400">JWT Token:</span>
                <p className="text-white font-mono text-xs break-all bg-slate-700 p-3 rounded mt-2">
                  {jwtToken}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to Cryptix!</h2>
          <p className="text-gray-400">
            You have successfully authenticated with Discord. Your account is now set up and ready to use.
          </p>
        </div>
      </div>
    </div>
  );
}
