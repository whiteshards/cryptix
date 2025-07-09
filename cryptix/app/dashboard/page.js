
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
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    maxKeyPerPerson: 1,
    numberOfCheckpoints: 2,
    keyTimer: 12,
    permanentKeys: false,
    keyCooldown: 10
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

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleInputChange = (field, value) => {
    if (field === 'name') {
      // Only allow letters and spaces, max 24 characters
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 24);
      setFormData(prev => ({ ...prev, [field]: sanitized }));
    } else if (field === 'permanentKeys') {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        keyTimer: value ? 0 : 12 
      }));
    } else if (field === 'maxKeyPerPerson') {
      const numValue = parseInt(value) || 1;
      if (numValue < 1) {
        showToast('Max key per person must be at least 1');
        return;
      }
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else if (field === 'numberOfCheckpoints') {
      const numValue = parseInt(value) || 1;
      if (numValue < 1 || numValue > 5) {
        showToast('Number of checkpoints must be between 1 and 5');
        return;
      }
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else if (field === 'keyTimer') {
      const numValue = parseInt(value) || 1;
      if (numValue < 1 || numValue > 196) {
        showToast('Key timer must be between 1 and 196 hours');
        return;
      }
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else if (field === 'keyCooldown') {
      const numValue = parseInt(value) || 1;
      if (numValue < 1 || numValue > 180) {
        showToast('Key cooldown must be between 1 and 180 minutes');
        return;
      }
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCreateKeysystem = async () => {
    if (!formData.name.trim()) {
      showToast('Keysystem name is required');
      return;
    }

    if (formData.name.length < 3) {
      showToast('Keysystem name must be at least 3 characters');
      return;
    }

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
        throw new Error(data.error || 'Failed to create keysystem');
      }

      showToast('Keysystem created successfully!', 'success');
      setShowModal(false);
      setFormData({
        name: '',
        maxKeyPerPerson: 1,
        numberOfCheckpoints: 2,
        keyTimer: 12,
        permanentKeys: false,
        keyCooldown: 10
      });
      
      // Refresh the page to show the new keysystem
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      showToast(error.message);
    } finally {
      setIsCreating(false);
    }
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
              
              <button 
                onClick={() => setShowModal(true)}
                className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                New
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Your Keysystems Section */}
      <div className="px-8 py-16">
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

      {/* Create Keysystem Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b2e] border border-white/10 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      maxLength={24}
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-1">Max 24 characters, letters and spaces only</p>
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
                      min="1"
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-1">This is the number of individual keys a person can create in one session</p>
                  </div>

                  {/* Number of Checkpoints */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Number of Checkpoints
                    </label>
                    <input
                      type="number"
                      value={formData.numberOfCheckpoints}
                      onChange={(e) => handleInputChange('numberOfCheckpoints', e.target.value)}
                      min="1"
                      max="5"
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Cryptix will add an extra checkpoint for site monetization that aligns with the same ad-link provider you use. 
                      If you want to remove this extra link the users would have to go through, contact staff on discord to buy the pro plan.
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Permanent Keys Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white text-sm font-medium">
                        Permanent Keys
                      </label>
                      <button
                        onClick={() => handleInputChange('permanentKeys', !formData.permanentKeys)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.permanentKeys ? 'bg-[#6366f1]' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.permanentKeys ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-gray-400 text-xs">If you want to enable permanent keys turn on the toggle above</p>
                  </div>

                  {/* Key Timer */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Key Timer (Hours)
                    </label>
                    <input
                      type="number"
                      value={formData.keyTimer}
                      onChange={(e) => handleInputChange('keyTimer', e.target.value)}
                      min="1"
                      max="196"
                      disabled={formData.permanentKeys}
                      className={`w-full border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors ${
                        formData.permanentKeys ? 'bg-gray-600/50 cursor-not-allowed' : 'bg-[#2a2d47]'
                      }`}
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
                      min="1"
                      max="180"
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      This will be counted in minutes and its used to determine how much cooldown the user needs to go through before completing the checkpoints again
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKeysystem}
                  disabled={isCreating || !formData.name.trim()}
                  className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create'}
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
