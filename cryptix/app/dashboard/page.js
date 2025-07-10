
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingKeysystem, setEditingKeysystem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKeysystem, setDeletingKeysystem] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    maxKeyPerPerson: 1,
    keyTimer: 12,
    permanentKeys: false,
    keyCooldown: 10
  });
  const [editFormData, setEditFormData] = useState({
    maxKeyPerPerson: 1,
    keyTimer: 12,
    permanentKeys: false,
    keyCooldown: 10,
    active: true
  });
  const [activeTab, setActiveTab] = useState('keysystems');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Fetching Your Data...');

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
      // Simulate smooth loading progress
      setLoadingProgress(20);
      setLoadingText('Authenticating...');

      await new Promise(resolve => setTimeout(resolve, 300));
      setLoadingProgress(40);

      const response = await fetch('/api/v1/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setLoadingProgress(60);
      setLoadingText('Loading Profile...');
      await new Promise(resolve => setTimeout(resolve, 200));

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
      setLoadingProgress(80);
      setLoadingText('Preparing Dashboard...');
      await new Promise(resolve => setTimeout(resolve, 300));

      if (data.success) {
        setUserProfile(data.customer);
        setIsAuthenticated(true);
        setLoadingProgress(100);
        setLoadingText('Initializing Dashboard');
        await new Promise(resolve => setTimeout(resolve, 400));
      } else {
        throw new Error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
      setLoadingText('Error occurred, loading limited view...');
      // If there's an error, still allow them to see the dashboard with limited functionality
      setIsAuthenticated(true);
    } finally {
      setTimeout(() => setIsLoading(false), 200);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="w-full max-w-md px-8">
          {/* Loading Text */}
          <div className="text-center mb-8">
            <div className="text-white text-lg font-medium mb-2 transition-all duration-500 ease-out">
              {loadingText}
            </div>
            <div className="text-gray-400 text-sm">
              Please wait while we prepare your workspace
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
            {/* Animated Progress Bar */}
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#d946ef] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${loadingProgress}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>

            {/* Progress Glow */}
            <div 
              className="absolute top-0 left-0 h-full bg-[#6366f1]/50 rounded-full blur-sm transition-all duration-500 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>

          {/* Progress Percentage */}
          <div className="text-center mt-4">
            <span className="text-gray-300 text-sm font-mono transition-all duration-300">
              {loadingProgress}%
            </span>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#d946ef] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes loading-progress {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const username = userProfile?.username || 'User';
  const keysystems = userProfile?.keysystems || [];

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleInputChange = (field, value) => {
    if (field === 'permanentKeys') {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        keyTimer: value ? 0 : 12 
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleEditInputChange = (field, value) => {
    if (field === 'permanentKeys') {
      setEditFormData(prev => ({ 
        ...prev, 
        [field]: value,
        keyTimer: value ? 0 : 12 
      }));
    } else {
      setEditFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCreateKeysystem = async () => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to create keysystem');
        return;
      }

      showToast('Keysystem created successfully!', 'success');
      setShowModal(false);
      setFormData({
        name: '',
        maxKeyPerPerson: 1,
        keyTimer: 12,
        permanentKeys: false,
        keyCooldown: 10
      });

      // Refresh the page to show the new keysystem
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      showToast(error.message || 'An error occurred while creating the keysystem');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditKeysystem = (keysystem) => {
    setEditingKeysystem(keysystem);
    setEditFormData({
      maxKeyPerPerson: keysystem.maxKeyPerPerson,
      keyTimer: keysystem.keyTimer,
      permanentKeys: keysystem.permanent,
      keyCooldown: keysystem.keyCooldown,
      active: keysystem.active
    });
    setShowEditModal(true);
  };

  const handleUpdateKeysystem = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: editingKeysystem.id,
          ...editFormData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to update keysystem');
        return;
      }

      showToast('Keysystem updated successfully!', 'success');
      setShowEditModal(false);
      setEditingKeysystem(null);

      // Refresh the page to show the updated keysystem
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      showToast(error.message || 'An error occurred while updating the keysystem');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteKeysystem = (keysystem) => {
    setDeletingKeysystem(keysystem);
    setShowDeleteModal(true);
  };

  const confirmDeleteKeysystem = async () => {
    if (!deletingKeysystem) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: deletingKeysystem.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to delete keysystem');
        return;
      }

      showToast('Keysystem deleted successfully!', 'success');
      setShowDeleteModal(false);
      setDeletingKeysystem(null);

      // Refresh the page to show the changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      showToast(error.message || 'An error occurred while deleting the keysystem');
    } finally {
      setIsDeleting(false);
    }
  };

  const sidebarItems = [
    { id: 'keysystems', name: 'Keysystems', icon: '🔑' },
    { id: 'statistics', name: 'Statistics', icon: '📊' },
    { id: 'keys', name: 'Keys', icon: '🗝️' },
    { id: 'store', name: 'Store', icon: '🛒' },
    { id: 'api', name: 'API', icon: '⚡' },
    { id: 'integrations', name: 'Integrations', icon: '🔗' },
    { id: 'documentation', name: 'Documentation', icon: '📚' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex">
      {/* Sidebar */}
      <div className="w-64 min-h-screen bg-gradient-to-b from-[#1a1a2e]/80 to-[#0f0f23]/80 backdrop-blur-xl border-r border-white/10">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#d946ef] bg-clip-text text-transparent">
            Cryptix
          </h1>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">{username}</h3>
              <p className="text-gray-400 text-xs">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20 text-white border border-[#6366f1]/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-sm">{item.name}</span>
                {activeTab === item.id && (
                  <div className="ml-auto w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Create Button */}
        <div className="absolute bottom-6 left-4 right-4">
          <button 
            onClick={() => setShowModal(true)}
            className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5856eb] hover:to-[#7c3aed] text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            + New Keysystem
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1a2e]/50 to-[#16213e]/50 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {sidebarItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
              </h1>
              <p className="text-gray-400 text-sm">
                Manage your keysystems and monitor performance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-[#6366f1]/10 to-[#8b5cf6]/10 border border-[#6366f1]/20 rounded-lg px-4 py-2">
                <span className="text-[#6366f1] text-sm font-medium">
                  {keysystems.length} Keysystems
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 h-full overflow-y-auto">
          {activeTab === 'keysystems' && (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm">
                    Error loading profile data: {error}
                  </p>
                </div>
              )}

              {keysystems.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔑</span>
                  </div>
                  <h3 className="text-white text-lg font-medium mb-2">No Keysystems Found</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Create your first keysystem to get started with key management.
                  </p>
                  <button 
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5856eb] hover:to-[#7c3aed] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                  >
                    Create Keysystem
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {keysystems.map((keysystem, index) => (
                    <div key={index} className="bg-gradient-to-r from-[#1a1a2e]/50 to-[#16213e]/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-[#6366f1]/30 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <button
                              onClick={() => router.push(`/dashboard/scripts?id=${keysystem.id}`)}
                              className="text-white font-semibold text-lg hover:bg-gradient-to-r hover:from-[#6366f1] hover:to-[#8b5cf6] hover:bg-clip-text hover:text-transparent transition-all duration-200"
                            >
                              {keysystem.name || `Keysystem ${index + 1}`}
                            </button>
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              keysystem.active 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {keysystem.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Keysystem ID</p>
                              <p className="text-white font-mono text-sm">
                                {keysystem.id ? keysystem.id.substring(0, 12) + '...' : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Max Keys</p>
                              <p className="text-white text-sm font-medium">
                                {keysystem.maxKeyPerPerson || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Key Timer</p>
                              <p className="text-white text-sm font-medium">
                                {keysystem.permanent ? 'Permanent' : `${keysystem.keyTimer || 0}h`}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Created</p>
                              <p className="text-white text-sm font-medium">
                                {keysystem.createdAt ? new Date(keysystem.createdAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 ml-6">
                          <button 
                            onClick={() => handleEditKeysystem(keysystem)}
                            className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5856eb] hover:to-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteKeysystem(keysystem)}
                            disabled={isDeleting}
                            className="border border-red-500/50 text-red-400 hover:text-red-300 hover:border-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-white text-lg font-medium mb-2">Statistics Dashboard</h3>
              <p className="text-gray-400 text-sm">
                Advanced analytics and reporting features coming soon...
              </p>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗝️</span>
              </div>
              <h3 className="text-white text-lg font-medium mb-2">Key Management</h3>
              <p className="text-gray-400 text-sm">
                Comprehensive key management interface coming soon...
              </p>
            </div>
          )}

          {activeTab === 'store' && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-white text-lg font-medium mb-2">Store</h3>
              <p className="text-gray-400 text-sm">
                Marketplace and premium features coming soon...
              </p>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-white text-lg font-medium mb-2">API Documentation</h3>
              <p className="text-gray-400 text-sm">
                Developer tools and API documentation coming soon...
              </p>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-white text-lg font-medium mb-2">Integrations</h3>
              <p className="text-gray-400 text-sm">
                Third-party integrations and webhooks coming soon...
              </p>
            </div>
          )}

          {activeTab === 'documentation' && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-white text-lg font-medium mb-2">Documentation</h3>
              <p className="text-gray-400 text-sm">
                Comprehensive guides and tutorials coming soon...
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-white text-lg font-medium mb-2">Settings</h3>
              <p className="text-gray-400 text-sm">
                Account and application settings coming soon...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Keysystem Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-xl font-bold">Create New Keysystem</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-3">
                      Keysystem Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter keysystem name"
                      className="w-full bg-[#2a2d47]/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Max Key Per Person */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-3">
                      Max Key Per Person
                    </label>
                    <input
                      type="number"
                      value={formData.maxKeyPerPerson}
                      onChange={(e) => handleInputChange('maxKeyPerPerson', e.target.value)}
                      className="w-full bg-[#2a2d47]/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-2">Number of individual keys a person can create in one session</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Permanent Keys Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white text-sm font-medium">
                        Permanent Keys
                      </label>
                      <button
                        onClick={() => handleInputChange('permanentKeys', !formData.permanentKeys)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.permanentKeys ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.permanentKeys ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-gray-400 text-xs">Enable permanent keys that never expire</p>
                  </div>

                  {/* Key Timer */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-3">
                      Key Timer (Hours)
                    </label>
                    <input
                      type="number"
                      value={formData.keyTimer}
                      onChange={(e) => handleInputChange('keyTimer', e.target.value)}
                      disabled={formData.permanentKeys}
                      className={`w-full border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors ${
                        formData.permanentKeys ? 'bg-gray-600/30 cursor-not-allowed' : 'bg-[#2a2d47]/50'
                      }`}
                    />
                  </div>

                  {/* Key Cooldown */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-3">
                      Key Cooldown (Minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.keyCooldown}
                      onChange={(e) => handleInputChange('keyCooldown', e.target.value)}
                      className="w-full bg-[#2a2d47]/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-2">
                      Cooldown period before users can complete checkpoints again
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-white/30 text-gray-300 hover:text-white hover:border-white/50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKeysystem}
                  disabled={isCreating}
                  className="flex-1 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5856eb] hover:to-[#7c3aed] text-white px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Keysystem'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Keysystem Modal */}
      {showEditModal && editingKeysystem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-xl font-bold">Edit Keysystem: {editingKeysystem.name}</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Status Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white text-sm font-medium">
                        Active Status
                      </label>
                      <button
                        onClick={() => handleEditInputChange('active', !editFormData.active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          editFormData.active ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            editFormData.active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-gray-400 text-xs">Toggle to enable/disable this keysystem</p>
                  </div>

                  {/* Max Key Per Person */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-3">
                      Max Key Per Person
                    </label>
                    <input
                      type="number"
                      value={editFormData.maxKeyPerPerson}
                      onChange={(e) => handleEditInputChange('maxKeyPerPerson', e.target.value)}
                      className="w-full bg-[#2a2d47]/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-2">Number of individual keys a person can create in one session</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Permanent Keys Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white text-sm font-medium">
                        Permanent Keys
                      </label>
                      <button
                        onClick={() => handleEditInputChange('permanentKeys', !editFormData.permanentKeys)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          editFormData.permanentKeys ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            editFormData.permanentKeys ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-gray-400 text-xs">Enable permanent keys that never expire</p>
                  </div>

                  {/* Key Timer */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-3">
                      Key Timer (Hours)
                    </label>
                    <input
                      type="number"
                      value={editFormData.keyTimer}
                      onChange={(e) => handleEditInputChange('keyTimer', e.target.value)}
                      disabled={editFormData.permanentKeys}
                      className={`w-full border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors ${
                        editFormData.permanentKeys ? 'bg-gray-600/30 cursor-not-allowed' : 'bg-[#2a2d47]/50'
                      }`}
                    />
                  </div>

                  {/* Key Cooldown */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-3">
                      Key Cooldown (Minutes)
                    </label>
                    <input
                      type="number"
                      value={editFormData.keyCooldown}
                      onChange={(e) => handleEditInputChange('keyCooldown', e.target.value)}
                      className="w-full bg-[#2a2d47]/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-2">
                      Cooldown period before users can complete checkpoints again
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border border-white/30 text-gray-300 hover:text-white hover:border-white/50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateKeysystem}
                  disabled={isUpdating}
                  className="flex-1 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5856eb] hover:to-[#7c3aed] text-white px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update Keysystem'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingKeysystem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-red-500/30 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-white text-lg font-semibold">Delete Keysystem</h3>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-3">
                  Are you sure you want to delete the keysystem:
                </p>
                <p className="text-white font-medium bg-[#2a2d47]/50 px-4 py-3 rounded-xl border border-white/20">
                  {deletingKeysystem.name}
                </p>
                <p className="text-red-400 text-sm mt-4">
                  This action cannot be undone. All data associated with this keysystem will be permanently deleted.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-white/30 text-gray-300 hover:text-white hover:border-white/50 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteKeysystem}
                  disabled={isDeleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`bg-gradient-to-r backdrop-blur-md border rounded-xl px-6 py-4 max-w-sm shadow-2xl ${
            toast.type === 'success' 
              ? 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400' 
              : 'from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center space-x-3">
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
