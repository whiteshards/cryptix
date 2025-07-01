
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check for JWT token in localStorage
    const token = localStorage.getItem('cryptix_jwt');

    if (!token) {
      // No JWT token found, redirect to login page
      router.push('/login');
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('cryptix_jwt');
    localStorage.removeItem('cryptix_password');
    router.push('/');
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'scripthub', label: 'Script Hub', icon: '📝' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'account', label: 'Account', icon: '👤' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">Cryptix</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'account') {
                    router.push('/dashboard/@me');
                  } else {
                    setActiveTab(item.id);
                  }
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-0">
        {/* Top Bar */}
        <div className="bg-slate-800 border-b border-slate-700 h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-white capitalize">{activeTab}</h2>
          <div></div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <h4 className="text-lg font-semibold text-white mb-2">Total Scripts</h4>
                  <p className="text-3xl font-bold text-green-400">0</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <h4 className="text-lg font-semibold text-white mb-2">Active Keys</h4>
                  <p className="text-3xl font-bold text-blue-400">0</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <h4 className="text-lg font-semibold text-white mb-2">Total Users</h4>
                  <p className="text-3xl font-bold text-purple-400">0</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scripthub' && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Script Hub</h3>
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <p className="text-gray-400">No scripts available yet. Create your first script to get started!</p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Analytics</h3>
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <p className="text-gray-400">Analytics data will be displayed here once you have active scripts.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
