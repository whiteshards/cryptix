
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Scripts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keysystemId = searchParams.get('id');
  
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
    // Prevent deletion of the first checkpoint (permanent)
    if (index === 0) {
      showToast('Cannot delete the permanent first checkpoint');
      return;
    }

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
    // Prevent moving the first checkpoint (permanent)
    if (fromIndex === 0 || toIndex === 0) {
      showToast('Cannot move the permanent first checkpoint');
      return;
    }

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
                  {DOMAIN}/ads/get_key?id={keysystemId}
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
              <div className="flex flex-col items-center space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-white font-medium mb-2">Checkpoint Flow</h3>
                  <p className="text-gray-400 text-sm">Users will complete checkpoints in this order</p>
                </div>
                
                <div className="flex flex-col items-center space-y-4 w-full max-w-2xl">
                  {checkpoints.map((checkpoint, index) => (
                    <div key={index} className="w-full">
                      {/* Checkpoint Card */}
                      <div className={`relative bg-gradient-to-r p-4 rounded-lg border ${
                        index === 0 
                          ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30' 
                          : 'from-gray-600/20 to-gray-700/20 border-gray-600/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              checkpoint.type === 'linkvertise' ? 'bg-blue-500 text-white' :
                              checkpoint.type === 'lootlabs' ? 'bg-green-500 text-white' :
                              checkpoint.type === 'workink' ? 'bg-purple-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-white font-medium">
                                {checkpoint.type.charAt(0).toUpperCase() + checkpoint.type.slice(1)}
                                {index === 0 && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">PERMANENT</span>}
                              </h4>
                              <p className="text-gray-400 text-xs truncate max-w-xs">
                                {checkpoint.redirect_url}
                              </p>
                            </div>
                          </div>
                          
                          {index > 0 && (
                            <div className="flex items-center space-x-2">
                              {index > 1 && (
                                <button
                                  onClick={() => moveCheckpoint(index, index - 1)}
                                  className="text-gray-400 hover:text-white transition-colors p-1"
                                  title="Move Up"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                              )}
                              {index < checkpoints.length - 1 && (
                                <button
                                  onClick={() => moveCheckpoint(index, index + 1)}
                                  className="text-gray-400 hover:text-white transition-colors p-1"
                                  title="Move Down"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteCheckpoint(index)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow pointing to next checkpoint */}
                      {index < checkpoints.length - 1 && (
                        <div className="flex justify-center py-2">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Success indicator */}
                  <div className="w-full">
                    <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 p-4 rounded-lg text-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h4 className="text-green-400 font-medium">Key Generated</h4>
                      <p className="text-green-400/80 text-sm">User receives their key</p>
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
                    <option value="linkvertise">Linkvertise</option>
                    <option value="lootlabs">LootLabs</option>
                    <option value="workink">Work.ink</option>
                    <option value="custom">Custom</option>
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
                    className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    The URL where users will be redirected to complete this checkpoint
                  </p>
                </div>
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
                  disabled={isCreatingCheckpoint}
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
