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
    keyCooldown: 10,
    webhookUrl: ''
  });
  const [editFormData, setEditFormData] = useState({
    maxKeyPerPerson: 1,
    keyTimer: 12,
    keyCooldown: 10,
    active: true,
    webhookUrl: ''
  });
  const [activeTab, setActiveTab] = useState('keysystems');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Fetching Your Data...');
  const [lootlabsApiKey, setLootlabsApiKey] = useState('');
  const [showLootlabsKey, setShowLootlabsKey] = useState(false);
  const [lootlabsKeyChanged, setLootlabsKeyChanged] = useState(false);
  const [isSavingLootlabsKey, setIsSavingLootlabsKey] = useState(false);
  const [showLinkvertiseToken, setShowLinkvertiseToken] = useState(false);
  const [linkvertiseApiToken, setLinkvertiseApiToken] = useState('');
  const [linkvertiseTokenChanged, setLinkvertiseTokenChanged] = useState(false);
  const [isSavingLinkvertiseToken, setIsSavingLinkvertiseToken] = useState(false);
  
  // Keys management state
  const [selectedKeysystemForKeys, setSelectedKeysystemForKeys] = useState('');
  const [keysData, setKeysData] = useState([]);
  const [keysPagination, setKeysPagination] = useState(null);
  const [currentKeysPage, setCurrentKeysPage] = useState(1);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState(false);
  const [keysFilters, setKeysFilters] = useState({
    sortBy: 'recent',
    filterExpires: 'all',
    filterHwid: 'all',
    filterStatus: 'all'
  });

  useEffect(() => {
    // Check authentication and fetch profile
    const token = localStorage.getItem('cryptix_jwt');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserProfile(token);
  }, [router]);

  // Effect for keys filters
  useEffect(() => {
    if (selectedKeysystemForKeys) {
      fetchKeysData(selectedKeysystemForKeys, currentKeysPage);
    }
  }, [keysFilters]);

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
        // Set integration values using the fetched data directly
        if (data.customer?.integrations?.lootlabs) {
          setLootlabsApiKey(data.customer.integrations.lootlabs);
        }
        if (data.customer?.integrations?.linkvertise) {
          setLinkvertiseApiToken(data.customer.integrations.linkvertise);
        }
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
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
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
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full transition-all duration-500 ease-out"
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
            <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
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
        keyCooldown: 10,
        webhookUrl: ''
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
      keyCooldown: keysystem.keyCooldown,
      active: keysystem.active,
      webhookUrl: keysystem.webhookUrl || ''
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

  const handleSaveLootlabsKey = async () => {
    setIsSavingLootlabsKey(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/users/integrations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integration: 'lootlabs',
          value: lootlabsApiKey
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to save Lootlabs API key');
        return;
      }

      showToast('Lootlabs API key saved successfully!', 'success');
      setLootlabsKeyChanged(false);

      // Update the user profile with the new integration
      setUserProfile(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          lootlabs: lootlabsApiKey
        }
      }));

    } catch (error) {
      showToast(error.message || 'An error occurred while saving the API key');
    } finally {
      setIsSavingLootlabsKey(false);
    }
  };

  const handleSaveLinkvertiseToken = async () => {
    setIsSavingLinkvertiseToken(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/users/integrations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integration: 'linkvertise',
          value: linkvertiseApiToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to save Linkvertise API token');
        return;
      }

      showToast('Linkvertise API token saved successfully!', 'success');
      setLinkvertiseTokenChanged(false);

      // Update the user profile with the new integration
      setUserProfile(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          linkvertise: linkvertiseApiToken
        }
      }));

    } catch (error) {
      showToast(error.message || 'An error occurred while saving the API token');
    } finally {
      setIsSavingLinkvertiseToken(false);
    }
  };

  // Copy key function
  const handleCopyKey = async (keyValue) => {
    try {
      await navigator.clipboard.writeText(keyValue);
      showToast('Key copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy key', 'error');
    }
  };

  // Delete key from dashboard
  const handleDeleteKeyFromDashboard = async (keyValue) => {
    if (!selectedKeysystemForKeys) {
      showToast('No keysystem selected', 'error');
      return;
    }

    setIsDeletingKey(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/keys/delete-owner', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: selectedKeysystemForKeys,
          keyValue: keyValue
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to delete key', 'error');
        return;
      }

      showToast('Key deleted successfully!', 'success');
      
      // Refresh the keys data
      await fetchKeysData(selectedKeysystemForKeys, currentKeysPage);

    } catch (error) {
      console.error('Delete key error:', error);
      showToast('Failed to delete key', 'error');
    } finally {
      setIsDeletingKey(false);
    }
  };

  // Keys management functions
  const fetchKeysData = async (keysystemId, page = 1) => {
    if (!keysystemId) return;
    
    setIsLoadingKeys(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const params = new URLSearchParams({
        keysystemId,
        page: page.toString(),
        ...keysFilters
      });

      const response = await fetch(`/api/v1/keysystems/keys/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to fetch keys');
        return;
      }

      setKeysData(data.keys || []);
      setKeysPagination(data.pagination);

    } catch (error) {
      showToast(error.message || 'An error occurred while fetching keys');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleKeysFilterChange = (filterName, value) => {
    setKeysFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentKeysPage(1);
    
    // Fetch data with new filter
    if (selectedKeysystemForKeys) {
      setTimeout(() => {
        fetchKeysData(selectedKeysystemForKeys, 1);
      }, 100);
    }
  };

  const handleKeysPageChange = (newPage) => {
    setCurrentKeysPage(newPage);
    fetchKeysData(selectedKeysystemForKeys, newPage);
  };

  const getTimeLeft = (expiresAt) => {
    if (!expiresAt) return 'N/A';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

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
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowModal(true)}
                className="hidden md:block bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                New
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-8">
        <div className="max-w-6xl mx-auto">
          <div className="border-b border-white/10">
            <nav className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('keysystems')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'keysystems'
                    ? 'border-[#1c1c1c] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Keysystems
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'statistics'
                    ? 'border-[#1c1c1c] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveTab('keys')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'keys'
                    ? 'border-[#1c1c1c] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Keys
              </button>
              <button
                onClick={() => setActiveTab('store')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'store'
                    ? 'border-[#1c1c1c] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Store
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'api'
                    ? 'border-[#1c1c1c] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                API
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'integrations'
                    ? 'border-[#1c1c1c] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Integrations
              </button>
              <button
                onClick={() => setActiveTab('documentation')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'documentation'
                    ? 'border-[#1c1c1c] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Documentation
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'settings'
                    ? 'border-[#1c1c1c] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-16">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'keysystems' && (
            <div className="bg-transparent rounded-lg border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold">Your Keysystems</h2>
                <button 
                  onClick={() => setShowModal(true)}
                  className="md:hidden bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  New
                </button>
              </div>

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
                    <div key={index} className="bg-black/20 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all group">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => router.push(`/dashboard/scripts/${keysystem.id}`)}
                            className="text-white font-medium text-sm hover:text-[#6366f1] transition-colors text-left truncate block w-full"
                          >
                            {keysystem.name || `Keysystem ${index + 1}`}
                          </button>
                          <p className="text-gray-400 text-xs font-mono mt-1">
                            {keysystem.id ? keysystem.id.substring(0, 16) + '...' : 'N/A'}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                          keysystem.active 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {keysystem.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Max Keys</span>
                          <span className="text-white">{keysystem.maxKeyPerPerson || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Timer</span>
                          <span className="text-white">
                            {keysystem.keyTimer || 0}h
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Created</span>
                          <span className="text-white">
                            {keysystem.createdAt ? new Date(keysystem.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditKeysystem(keysystem)}
                          className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-2 rounded text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteKeysystem(keysystem)}
                          disabled={isDeleting}
                          className="flex-1 border border-red-500/50 text-red-400 hover:text-red-300 hover:border-red-400 px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="bg-transparent rounded-lg border border-white/10 p-6">
              <h2 className="text-white text-xl font-semibold mb-6">Statistics</h2>
              <div className="text-center py-12">
                <p className="text-gray-400 text-base">
                  Statistics dashboard coming soon...
                </p>
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="bg-transparent rounded-lg border border-white/10 p-6">
              <h2 className="text-white text-xl font-semibold mb-6">Keys Management</h2>
              
              {/* Keysystem Selection */}
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">
                  Select Keysystem
                </label>
                <select
                  value={selectedKeysystemForKeys}
                  onChange={(e) => {
                    setSelectedKeysystemForKeys(e.target.value);
                    setCurrentKeysPage(1);
                    if (e.target.value) {
                      fetchKeysData(e.target.value, 1);
                    } else {
                      setKeysData([]);
                      setKeysPagination(null);
                    }
                  }}
                  className="w-full max-w-md bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white focus:border-[#6366f1] focus:outline-none transition-colors"
                >
                  <option value="">Choose a keysystem...</option>
                  {keysystems.map((ks) => (
                    <option key={ks.id} value={ks.id}>
                      {ks.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedKeysystemForKeys && (
                <>
                  {/* Filters */}
                  <div className="mb-6 p-4 bg-black/20 rounded border border-white/10">
                    <h3 className="text-white text-sm font-medium mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-white text-xs font-medium mb-1">
                          Sort by Creation
                        </label>
                        <select
                          value={keysFilters.sortBy}
                          onChange={(e) => handleKeysFilterChange('sortBy', e.target.value)}
                          className="w-full bg-[#2a2d47] border border-white/10 rounded px-2 py-1 text-white text-sm focus:border-[#6366f1] focus:outline-none transition-colors"
                        >
                          <option value="recent">Recent First</option>
                          <option value="oldest">Oldest First</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white text-xs font-medium mb-1">
                          Expiry Status
                        </label>
                        <select
                          value={keysFilters.filterExpires}
                          onChange={(e) => handleKeysFilterChange('filterExpires', e.target.value)}
                          className="w-full bg-[#2a2d47] border border-white/10 rounded px-2 py-1 text-white text-sm focus:border-[#6366f1] focus:outline-none transition-colors"
                        >
                          <option value="all">All Keys</option>
                          <option value="soon">Expires Soon (24h)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white text-xs font-medium mb-1">
                          HWID Status
                        </label>
                        <select
                          value={keysFilters.filterHwid}
                          onChange={(e) => handleKeysFilterChange('filterHwid', e.target.value)}
                          className="w-full bg-[#2a2d47] border border-white/10 rounded px-2 py-1 text-white text-sm focus:border-[#6366f1] focus:outline-none transition-colors"
                        >
                          <option value="all">All Keys</option>
                          <option value="linked">HWID Linked</option>
                          <option value="not_linked">No HWID</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white text-xs font-medium mb-1">
                          Status
                        </label>
                        <select
                          value={keysFilters.filterStatus}
                          onChange={(e) => handleKeysFilterChange('filterStatus', e.target.value)}
                          className="w-full bg-[#2a2d47] border border-white/10 rounded px-2 py-1 text-white text-sm focus:border-[#6366f1] focus:outline-none transition-colors"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Keys Count */}
                  {keysPagination && (
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">
                        Total Keys: <span className="text-white font-medium">{keysPagination.totalKeys}</span>
                      </p>
                    </div>
                  )}

                  {/* Keys Table */}
                  {isLoadingKeys ? (
                    <div className="text-center py-12">
                      <div className="inline-block w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-400 text-sm mt-2">Loading keys...</p>
                    </div>
                  ) : keysData.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left text-white font-medium py-2 px-1 w-20">Key</th>
                              <th className="text-left text-white font-medium py-2 px-1 w-16">Status</th>
                              <th className="text-left text-white font-medium py-2 px-1 hidden md:table-cell w-32">Created</th>
                              <th className="text-left text-white font-medium py-2 px-1 w-24">Time Left</th>
                              <th className="text-left text-white font-medium py-2 px-1 hidden lg:table-cell w-20">Session</th>
                              <th className="text-left text-white font-medium py-2 px-1 w-16">HWID</th>
                              <th className="text-left text-white font-medium py-2 px-1 w-16">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {keysData.map((key, index) => {
                              const isExpired = new Date(key.expires_at) <= new Date();
                              const timeLeft = getTimeLeft(key.expires_at);
                              
                              return (
                                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="py-2 px-1">
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => handleCopyKey(key.value)}
                                        className="text-white font-mono hover:text-[#6366f1] transition-colors text-left"
                                        title="Click to copy full key"
                                      >
                                        {key.value ? `${key.value.substring(0, 6)}...` : 'N/A'}
                                      </button>
                                      <button
                                        onClick={() => handleCopyKey(key.value)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-2 px-1">
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                                      isExpired 
                                        ? 'bg-red-500/20 text-red-400' 
                                        : 'bg-green-500/20 text-green-400'
                                    }`}>
                                      {isExpired ? 'Exp' : 'Act'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-1 hidden md:table-cell">
                                    <span className="text-gray-300">
                                      {key.created_at ? new Date(key.created_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-1">
                                    <span className={`${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                                      {timeLeft}
                                    </span>
                                  </td>
                                  <td className="py-2 px-1 hidden lg:table-cell">
                                    <span className="text-gray-300 font-mono">
                                      {key.session_id ? `${key.session_id.substring(0, 6)}...` : 'N/A'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-1">
                                    {key.hwid ? (
                                      <div className="flex items-center space-x-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                        <span className="text-gray-300 font-mono hidden sm:inline">
                                          {key.hwid.substring(0, 4)}...
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">-</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-1">
                                    <button
                                      onClick={() => handleDeleteKeyFromDashboard(key.value)}
                                      disabled={isDeletingKey}
                                      className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Delete key"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {keysPagination && keysPagination.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                          <div className="text-sm text-gray-400">
                            Page {keysPagination.currentPage} of {keysPagination.totalPages}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleKeysPageChange(currentKeysPage - 1)}
                              disabled={currentKeysPage === 1}
                              className="px-3 py-1 bg-[#2a2d47] border border-white/10 rounded text-white text-sm hover:bg-[#3a3d57] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => handleKeysPageChange(currentKeysPage + 1)}
                              disabled={currentKeysPage === keysPagination.totalPages}
                              className="px-3 py-1 bg-[#2a2d47] border border-white/10 rounded text-white text-sm hover:bg-[#3a3d57] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-base">
                        No keys found for this keysystem.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'store' && (
            <div className="bg-transparent rounded-lg border border-white/10 p-6">
              <h2 className="text-white text-xl font-semibold mb-6">Store</h2>
              <div className="text-center py-12">
                <p className="text-gray-400 text-base">
                  Store functionality coming soon...
                </p>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="bg-transparent rounded-lg border border-white/10 p-6">
              <h2 className="text-white text-xl font-semibold mb-6">API Documentation</h2>
              <div className="text-center py-12">
                <p className="text-gray-400 text-base">
                  API documentation and tools coming soon...
                </p>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-transparent rounded-lg border border-white/10 p-6">
              <h2 className="text-white text-xl font-semibold mb-6">Integrations</h2>

              {/* Lootlabs Integration */}
              <div className="space-y-6">

<div className="bg-black/20 rounded-lg p-6 border border-white/10">
                  <div className="mb-4">
                    <div>
                      <h3 className="text-white text-lg font-medium">Lootlabs</h3>
                      <p className="text-gray-400 text-sm">Configure your Lootlabs API integration</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showLootlabsKey ? "text" : "password"}
                          value={lootlabsApiKey}
                          onChange={(e) => {
                            setLootlabsApiKey(e.target.value);
                            setLootlabsKeyChanged(true);
                          }}
                          placeholder={userProfile?.integrations?.lootlabs ? "••••••••••••••••" : "Enter your Lootlabs API key"}
                          className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLootlabsKey(!showLootlabsKey)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                        >
                          {showLootlabsKey ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        Your Lootlabs API key for checkpoint verification
                      </p>
                    </div>

                    {lootlabsKeyChanged && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleSaveLootlabsKey}
                          disabled={isSavingLootlabsKey}
                          className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingLootlabsKey ? 'Saving...' : 'Save API Key'}
                        </button>
                        <button
                          onClick={() => {
                            setLootlabsApiKey(userProfile?.integrations?.lootlabs || '');
                            setLootlabsKeyChanged(false);
                          }}
                          className="border border-white/20 text-gray-300 hover:text-white hover:border-white/40 px-4 py-2 rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linkvertise Integration */}
                <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white text-lg font-medium">Linkvertise</h3>
                      <p className="text-gray-400 text-sm">Configure your Linkvertise API integration</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        API Token
                      </label>
                      <div className="relative">
                        <input
                          type={showLinkvertiseToken ? "text" : "password"}
                          value={linkvertiseApiToken}
                          onChange={(e) => {
                            setLinkvertiseApiToken(e.target.value);
                            setLinkvertiseTokenChanged(true);
                          }}
                          placeholder={userProfile?.integrations?.linkvertise ? "••••••••••••••••" : "Enter your Linkvertise API token"}
                          className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLinkvertiseToken(!showLinkvertiseToken)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                        >
                          {showLinkvertiseToken ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        Your Linkvertise API token for anti-bypass verification
                      </p>
                    </div>

                    {linkvertiseTokenChanged && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleSaveLinkvertiseToken}
                          disabled={isSavingLinkvertiseToken}
                          className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingLinkvertiseToken ? 'Saving...' : 'Save API Token'}
                        </button>
                        <button
                          onClick={() => {
                            setLinkvertiseApiToken(userProfile?.integrations?.linkvertise || '');
                            setLinkvertiseTokenChanged(false);
                          }}
                          className="border border-white/20 text-gray-300 hover:text-white hover:border-white/40 px-4 py-2 rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documentation' && (
            <div className="bg-transparent rounded-lg border border-white/10 p-6">
              <h2 className="text-white text-xl font-semibold mb-6">Documentation</h2>
              <div className="text-center py-12">
                <p className="text-gray-400 text-base">
                  Comprehensive documentation coming soon...
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-transparent rounded-lg border border-white/10 p-6">
              <h2 className="text-white text-xl font-semibold mb-6">Settings</h2>
              <div className="text-center py-12">
                <p className="text-gray-400 text-base">
                  Account and application settings coming soon...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Keysystem Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b2e] border border-white/10 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-semibold">Create New Keysystem</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Keysystem Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter keysystem name"
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Max Key Per Person */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Max Key Per Person
                    </label>
                    <input
                      type="number"
                      value={formData.maxKeyPerPerson}
                      onChange={(e) => handleInputChange('maxKeyPerPerson', e.target.value)}
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-1">This is the number of individual keys a person can create in one session</p>
                  </div>
                  {/* Webhook URL Field */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Webhook URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.webhookUrl}
                      onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Key Timer */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Key Timer (Hours)
                    </label>
                    <input
                      type="number"
                      value={formData.keyTimer}
                      onChange={(e) => handleInputChange('keyTimer', e.target.value)}
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Key Cooldown */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Key Cooldown (Minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.keyCooldown}
                      onChange={(e) => handleInputChange('keyCooldown', e.target.value)}
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      This will be counted in minutes and its used to determine how much cooldown the user needs to go through before completing the checkpoints again
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row  sm:space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKeysystem}
                  disabled={isCreating}
                  className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Keysystem Modal */}
      {showEditModal && editingKeysystem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b2e] border border-white/10 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-semibold">Edit Keysystem: {editingKeysystem.name}</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Status Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white text-sm font-medium">
                        Active Status
                      </label>
                      <button
                        onClick={() => handleEditInputChange('active', !editFormData.active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          editFormData.active ? 'bg-[#6366f1]' : 'bg-gray-600'
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
                    <label className="block text-white text-sm font-medium mb-2">
                      Max Key Per Person
                    </label>
                    <input
                      type="number"
                      value={editFormData.maxKeyPerPerson}
                      onChange={(e) => handleEditInputChange('maxKeyPerPerson', e.target.value)}
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-1">This is the number of individual keys a person can create in one session</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Key Timer */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Key Timer (Hours)
                    </label>
                    <input
                      type="number"
                      value={editFormData.keyTimer}
                      onChange={(e) => handleEditInputChange('keyTimer', e.target.value)}
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Key Cooldown */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Key Cooldown (Minutes)
                    </label>
                    <input
                      type="number"
                      value={editFormData.keyCooldown}
                      onChange={(e) => handleEditInputChange('keyCooldown', e.target.value)}
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      This will be counted in minutes and its used to determine how much cooldown the user needs to go through before completing the checkpoints again
                    </p>
                  </div>
                  {/* Webhook URL Field */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Webhook URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={editFormData.webhookUrl}
                      onChange={(e) => handleEditInputChange('webhookUrl', e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateKeysystem}
                  disabled={isUpdating}
                  className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingKeysystem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b2e] border border-red-500/30 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-gray-300 mb-2">
                  Are you sure you want to delete the keysystem:
                </p>
                <p className="text-white font-medium bg-[#2a2a2a] px-3 py-2 rounded border border-white/10">
                  {deletingKeysystem.name}
                </p>
                <p className="text-red-400 text-sm mt-3">
                  This action cannot be undone. All data associated with this keysystem will be permanently deleted.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-1.5 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteKeysystem}
                  disabled={isDeleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className={`bg-black/80 backdrop-blur-md border rounded-lg px-4 py-3 max-w-sm ${
            toast.type === 'success' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center space-x-2">
              {toast.type === 'success' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-sm">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}