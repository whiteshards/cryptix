'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function Scripts() {
  const router = useRouter();
  const params = useParams();
  const keysystemId = params.id;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [keysystem, setKeysystem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCheckpointModal, setShowAddCheckpointModal] = useState(false);
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);
  const [toast, setToast] = useState(null);
  const [checkpointFormData, setCheckpointFormData] = useState({
    type: 'linkvertise',
    redirect_url: ''
  });

  // Configuration for domain - change this for production
  const DOMAIN = 'https://cryptixmanager.vercel.app';

  useEffect(() => {
    if (!keysystemId) {
      router.push('/dashboard');
      return;
    }

    const token = localStorage.getItem('cryptix_jwt');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserProfile(token);
  }, [keysystemId, router]);

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

        // Find the specific keysystem
        const foundKeysystem = data.customer.keysystems?.find(ks => ks.id === keysystemId);
        if (!foundKeysystem) {
          router.push('/dashboard');
          return;
        }
        setKeysystem(foundKeysystem);
      } else {
        throw new Error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleInputChange = (field, value) => {
    setCheckpointFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCheckpoint = async () => {
    if (!checkpointFormData.redirect_url) {
      showToast('Redirect URL is required');
      return;
    }

    setIsCreatingCheckpoint(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/checkpoints/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: keysystemId,
          type: checkpointFormData.type,
          redirect_url: checkpointFormData.redirect_url
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to create checkpoint');
        return;
      }

      showToast('Checkpoint created successfully!', 'success');
      setShowAddCheckpointModal(false);
      setCheckpointFormData({
        type: 'linkvertise',
        redirect_url: ''
      });

      // Refresh the page to show the new checkpoint
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      showToast(error.message || 'An error occurred while creating the checkpoint');
    } finally {
      setIsCreatingCheckpoint(false);
    }
  };

  const handleDeleteCheckpoint = async (index) => {
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/checkpoints/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: keysystemId,
          checkpointIndex: index
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to delete checkpoint');
        return;
      }

      showToast('Checkpoint deleted successfully!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      showToast(error.message || 'An error occurred while deleting the checkpoint');
    }
  };

  const moveCheckpoint = async (fromIndex, toIndex) => {
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/checkpoints/reorder', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: keysystemId,
          fromIndex: fromIndex,
          toIndex: toIndex
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to reorder checkpoints');
        return;
      }

      showToast('Checkpoints reordered successfully!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      showToast(error.message || 'An error occurred while reordering checkpoints');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !keysystem) {
    return null;
  }

  const checkpoints = keysystem.checkpoints || [];

  return (
    <div className="min-h-screen bg-[#0f1015]">
      {/* Header */}
      <div className="pt-8 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-white text-lg font-medium">
                {keysystem.name} - Script Management
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Keysystem Information */}
          <div className="bg-transparent rounded-lg border border-white/10 p-6">
            <h2 className="text-white text-xl font-semibold mb-4">Script Information</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-400">Name</td>
                    <td className="py-3 px-4 text-white font-medium">{keysystem.name}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-400">Status</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        keysystem.active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {keysystem.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-400">ID</td>
                    <td className="py-3 px-4 text-gray-300 font-mono text-sm">{keysystem.id}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-400">Max Keys Per Person</td>
                    <td className="py-3 px-4 text-white">{keysystem.maxKeyPerPerson}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-400">Key Timer</td>
                    <td className="py-3 px-4 text-white">
                      {keysystem.permanent ? 'Permanent' : `${keysystem.keyTimer} hours`}
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-400">Key Cooldown</td>
                    <td className="py-3 px-4 text-white">{keysystem.keyCooldown} minutes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Checkpoints Section */}
          <div className="bg-transparent rounded-lg border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-semibold">
                Add Checkpoints ({checkpoints.length}/10)
              </h2>
              {checkpoints.length < 10 && (
                <button
                  onClick={() => setShowAddCheckpointModal(true)}
                  className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Add Checkpoint
                </button>
              )}
            </div>

            {/* Keysystem URL Display */}
            {checkpoints.length > 0 && (
              <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm mb-2">
                  <strong>Your Keysystem URL (Share This With User's To Generate Keys):</strong>
                </p>
                <p className="text-white font-mono text-sm break-all bg-black/30 rounded px-3 py-2">
                  {DOMAIN}/ads/get_key/{keysystemId}
                </p>
              </div>
            )}

            {/* Important Notes */}
            <div className="mb-6 space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  <strong>Linkvertise Note:</strong> Always enable anti-bypassing in Linkvertise and add its token in your profile settings or else the callback will not work and your users will not be able to complete checkpoints and generate/renew keys.
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  <strong>Custom Links Note:</strong> Custom link providers don't support anti-bypassing and can be easily bypassed. NOT RECOMMENDED.
                </p>
              </div>
            </div>

            {checkpoints.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-base mb-4">
                  No checkpoints added yet. Add checkpoints to complete keysystem setup.
                </p>
                <button
                  onClick={() => setShowAddCheckpointModal(true)}
                  className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Add First Checkpoint
                </button>
              </div>
            ) : (
              <div className="relative">
                {/* Flowchart Container */}
                <div className="flex flex-col items-center space-y-6">
                  {/* Start Node */}
                  <div className="relative">
                    <div className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full px-6 py-3 shadow-lg">
                      <span className="text-white font-semibold">User Starts Key Generation</span>
                    </div>
                    {/* Downward Arrow */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 top-full">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-[#6366f1] to-[#8b5cf6]"></div>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-[#8b5cf6]"></div>
                      </div>
                    </div>
                  </div>

                  {/* Checkpoints */}
                  {checkpoints.map((checkpoint, index) => (
                    <div key={index} className="relative w-full max-w-2xl">
                      {/* Checkpoint Card */}
                      <div className="relative bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-xl p-6 border border-[#6366f1]/30 shadow-xl">
                        {/* Checkpoint Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-[#6366f1] rounded-full w-8 h-8 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="text-white font-semibold text-lg">Checkpoint {index + 1}</h3>
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                checkpoint.type === 'linkvertise' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                checkpoint.type === 'lootlabs' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                checkpoint.type === 'workink' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                              }`}>
                                {checkpoint.type.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            {!checkpoint.mandatory && index > 0 && (
                              <button
                                onClick={() => moveCheckpoint(index, index - 1)}
                                className="bg-[#374151] hover:bg-[#4b5563] border border-gray-600 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                                title="Move Up"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                <span className="text-xs font-medium">Up</span>
                              </button>
                            )}
                            {!checkpoint.mandatory && index < checkpoints.length - 1 && (
                              <button
                                onClick={() => moveCheckpoint(index, index + 1)}
                                className="bg-[#374151] hover:bg-[#4b5563] border border-gray-600 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                                title="Move Down"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                <span className="text-xs font-medium">Down</span>
                              </button>
                            )}
                            {!checkpoint.mandatory && (
                              <button
                                onClick={() => handleDeleteCheckpoint(index)}
                                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="text-xs font-medium">Delete</span>
                              </button>
                            )}
                            {checkpoint.mandatory && (
                              <div className="text-yellow-400 text-xs font-medium px-3 py-2">
                                Mandatory Checkpoint
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Checkpoint Details */}
                        <div className="space-y-3">
                          <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                            <span className="text-gray-300 text-sm font-medium">Redirect URL:</span>
                            <p className="text-white font-mono text-sm break-all mt-1">{checkpoint.redirect_url}</p>
                          </div>
                          {!checkpoint.mandatory && (
                            <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                              <span className="text-gray-300 text-sm font-medium">Callback URL:</span>
                              {checkpoint.type === 'lootlabs' ? (
                                <p className="text-yellow-400 text-sm mt-1">
                                  Lootlabs Anti-Bypass Requires Dynamic URL Generation
                                </p>
                              ) : (
                                <p className="text-white font-mono text-sm break-all mt-1">{checkpoint.callback_url}</p>
                              )}
                            </div>
                          )}
                          {checkpoint.mandatory && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                              <span className="text-yellow-400 text-sm font-medium">This is a mandatory checkpoint and cannot be modified or deleted.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Connecting Arrow (except for last checkpoint) */}
                      {index < checkpoints.length - 1 && (
                        <div className="absolute left-1/2 transform -translate-x-1/2 top-full z-10">
                          <div className="w-0.5 h-8 bg-gradient-to-b from-[#6366f1] to-[#8b5cf6]"></div>
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-[#8b5cf6]"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Final Arrow and End Node */}
                  <div className="relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-[#6366f1] to-[#10b981]"></div>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-[#10b981]"></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-[#10b981] to-[#059669] rounded-full px-6 py-3 shadow-lg">
                      <span className="text-white font-semibold">User Generates Key</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Checkpoint Modal */}
      {showAddCheckpointModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b2e] border border-white/10 rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-semibold">Add New Checkpoint</h3>
                <button
                  onClick={() => setShowAddCheckpointModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Documentation Note */}
              <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  <a 
                    href="/docs#usermanual" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-300 transition-colors"
                  >
                    Click here to read our documentation first to help create checkpoints
                  </a>
                </p>
              </div>

              {/* Lootlabs Integration Note */}
              {checkpointFormData.type === 'lootlabs' && !userProfile?.integrations?.lootlabs && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm">
                    <strong>Lootlabs API Key Required:</strong> You need to add your Lootlabs API key in your profile integrations before creating Lootlabs checkpoints.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Checkpoint Type
                  </label>
                  <select
                    value={checkpointFormData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white focus:border-[#6366f1] focus:outline-none transition-colors"
                  >
                    <option value="custom">Custom</option>
                    <option value="linkvertise">Linkvertise</option>
                    <option 
                      value="lootlabs" 
                      disabled={!userProfile?.integrations?.lootlabs}
                    >
                      Lootlabs {!userProfile?.integrations?.lootlabs && '(Requires API Key)'}
                    </option>
                  </select>
                </div>

                {/* Redirect URL */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Redirect URL
                  </label>
                  <input
                    type="url"
                    value={checkpointFormData.redirect_url}
                    onChange={(e) => handleInputChange('redirect_url', e.target.value)}
                    placeholder="https://example.com/your-link"
                    disabled={checkpointFormData.type === 'lootlabs' && !userProfile?.integrations?.lootlabs}
                    className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    The URL where users will be redirected to complete this checkpoint
                  </p>
                </div>
                {/* Callback Token - Hide for LootLabs */}
                {checkpointFormData.type !== 'lootlabs' && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Callback Token
                    </label>
                    <input
                      type="text"
                      value={checkpointFormData.callback_token}
                      onChange={(e) => handleInputChange('callback_token', e.target.value)}
                      className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                      placeholder="Enter callback token"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:space-x-3 mt-6">
                <button
                  onClick={() => setShowAddCheckpointModal(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCheckpoint}
                  disabled={isCreatingCheckpoint || (checkpointFormData.type === 'lootlabs' && !userProfile?.integrations?.lootlabs)}
                  className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingCheckpoint ? 'Creating...' : 'Create Checkpoint'}
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