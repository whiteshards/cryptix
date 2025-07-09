
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '../components/DashboardNavbar';

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
      <DashboardNavbar />
      
      {/* Main Content */}
      <div className="pt-24 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Trial notification */}
          <div className="mb-8 p-4 bg-[#1a1d29] border border-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/80">
                <span className="text-green-400">30 days or $5.00</span> | Your trial expires in 30 days or when you're out of credits. Upgrade to keep your services online.
              </div>
              <button className="text-sm text-white/80 hover:text-white transition-colors">
                Choose a Plan
              </button>
            </div>
          </div>

          {/* Create New Project Section */}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-[#2a2d47] rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-xl font-medium text-white mb-2">Create a New Project</h2>
              <p className="text-gray-400 mb-6 max-w-md">
                Deploy a GitHub Repository, Provision a Database, or create an Empty Project to start from local.
              </p>
              
              <button className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Create Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
