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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingKeysystem, setViewingKeysystem] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    maxKeyPerPerson: 1,
    numberOfCheckpoints: 2,
    keyTimer: 12,
    permanentKeys: false,
    keyCooldown: 10
  });
  const [editFormData, setEditFormData] = useState({
    maxKeyPerPerson: 1,
    numberOfCheckpoints: 2,
    keyTimer: 12,
    permanentKeys: false,
    keyCooldown: 10,
    active: true
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
      showToast(error.message || 'An error occurred while creating the keysystem');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditKeysystem = (keysystem) => {
    setEditingKeysystem(keysystem);
    setEditFormData({
      maxKeyPerPerson: keysystem.maxKeyPerPerson,
      numberOfCheckpoints: keysystem.numberOfCheckpoints,
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

  const handleViewKeysystem = (keysystem) => {
    setViewingKeysystem(keysystem);
    setShowViewModal(true);
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
              <button className="hidden md:flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button className="hidden md:flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

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

      {/* Your Keysystems Section */}
      <div className="px-8 py-16">
        <div className="max-w-6xl mx-auto">
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
                      <button 
                        onClick={() => handleViewKeysystem(keysystem)}
                        className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditKeysystem(keysystem)}
                        className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteKeysystem(keysystem)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 border border-red-500/50 text-red-400 hover:text-red-300 hover:border-red-400 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
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

                  {/* Number of Checkpoints */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Number of Checkpoints
                    </label>
                    <input
                      type="number"
                      value={formData.numberOfCheckpoints}
                      onChange={(e) => handleInputChange('numberOfCheckpoints', e.target.value)}
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

                  {/* Number of Checkpoints */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Number of Checkpoints
                    </label>
                    <input
                      type="number"
                      value={editFormData.numberOfCheckpoints}
                      onChange={(e) => handleEditInputChange('numberOfCheckpoints', e.target.value)}
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
                        onClick={() => handleEditInputChange('permanentKeys', !editFormData.permanentKeys)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          editFormData.permanentKeys ? 'bg-[#6366f1]' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            editFormData.permanentKeys ? 'translate-x-6' : 'translate-x-1'
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
                      value={editFormData.keyTimer}
                      onChange={(e) => handleEditInputChange('keyTimer', e.target.value)}
                      disabled={editFormData.permanentKeys}
                      className={`w-full border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors ${
                        editFormData.permanentKeys ? 'bg-gray-600/50 cursor-not-allowed' : 'bg-[#2a2d47]'
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
                      value={editFormData.keyCooldown}
                      onChange={(e) => handleEditInputChange('keyCooldown', e.target.value)}
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      This will be counted in minutes and its used to determine how much cooldown the user needs to go through before completing the checkpoints again
                    </p>
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

      {/* View Keysystem Modal */}
      {showViewModal && viewingKeysystem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b2e] border border-white/10 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-semibold">Keysystem Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Information */}
                <div className="space-y-4">
                  <div className="bg-[#2a2d47] rounded-lg p-4 border border-white/10">
                    <h4 className="text-white font-medium mb-3">Basic Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white font-medium">{viewingKeysystem.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">ID:</span>
                        <span className="text-gray-300 font-mono text-sm">{viewingKeysystem.id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          viewingKeysystem.active 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {viewingKeysystem.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-gray-300">{new Date(viewingKeysystem.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#2a2d47] rounded-lg p-4 border border-white/10">
                    <h4 className="text-white font-medium mb-3">Owner Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Owner:</span>
                        <span className="text-white font-medium">{userProfile?.username || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">User ID:</span>
                        <span className="text-gray-300 font-mono text-sm">{userProfile?.id || 'N/A'}</span>
                      </div>
                      {userProfile?.email && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Email:</span>
                          <span className="text-gray-300">{userProfile.email}</span>
                        </div>
                      )}
                      {userProfile?.createdAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Account Created:</span>
                          <span className="text-gray-300">{new Date(userProfile.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Configuration */}
                <div className="space-y-4">
                  <div className="bg-[#2a2d47] rounded-lg p-4 border border-white/10 h-fit">
                    <h4 className="text-white font-medium mb-3">Configuration</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Max Keys Per Person:</span>
                        <span className="text-white font-medium">{viewingKeysystem.maxKeyPerPerson}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Checkpoints:</span>
                        <span className="text-white font-medium">{viewingKeysystem.numberOfCheckpoints}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Key Timer:</span>
                        <span className="text-white font-medium">
                          {viewingKeysystem.permanent ? 'Permanent' : `${viewingKeysystem.keyTimer} hours`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Key Cooldown:</span>
                        <span className="text-white font-medium">{viewingKeysystem.keyCooldown} minutes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Permanent Keys:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          viewingKeysystem.permanent 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {viewingKeysystem.permanent ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-[#6366f1] hover:bg-[#5856eb] text-white rounded font-medium transition-colors"
                >
                  Close
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
                <p className="text-white font-medium bg-[#2a2d47] px-3 py-2 rounded border border-white/10">
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