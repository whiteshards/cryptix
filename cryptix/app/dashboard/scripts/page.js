
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ScriptsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const keysystemId = searchParams.get('id');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keysystem, setKeysystem] = useState(null);
  const [showAddCheckpointModal, setShowAddCheckpointModal] = useState(false);
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);
  const [checkpointFormData, setCheckpointFormData] = useState({
    type: 'linkvertise',
    redirect_url: ''
  });
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && keysystemId) {
      fetchKeysystem();
    }
  }, [isAuthenticated, keysystemId]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('cryptix_jwt');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('cryptix_jwt');
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKeysystem = async () => {
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        const foundKeysystem = data.user.keysystems?.find(ks => ks.id === keysystemId);
        if (foundKeysystem) {
          setKeysystem(foundKeysystem);
        } else {
          showToast('Keysystem not found');
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error fetching keysystem:', error);
      showToast('Error fetching keysystem data');
    }
  };

  const showToast = (message, type = 'error') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleInputChange = (field, value) => {
    setCheckpointFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateCheckpoint = async () => {
    if (!checkpointFormData.redirect_url.trim()) {
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
    <div className="min-h-screen bg-[#0f1015] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, white 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 
          'bg-red-500/20 border border-red-500/30 text-red-400'
        } backdrop-blur-md`}>
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Keysystem Configuration</h1>
              <p className="text-gray-400">Manage your keysystem settings and checkpoints</p>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Keysystem Info */}
          <div className="bg-black/20 backdrop-blur-md rounded-lg border border-white/10 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Keysystem Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Name</label>
                <p className="text-white font-medium">{keysystem.name}</p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  keysystem.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {keysystem.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Max Keys Per Person</label>
                <p className="text-white font-medium">{keysystem.maxKeyPerPerson}</p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Key Duration</label>
                <p className="text-white font-medium">{keysystem.keyValidTime} minutes</p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Created</label>
                <p className="text-white font-medium">
                  {new Date(keysystem.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Total Checkpoints</label>
                <p className="text-white font-medium">{checkpoints.length}</p>
              </div>
            </div>
          </div>

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

          {/* Checkpoints Section */}
          <div className="bg-black/20 backdrop-blur-md rounded-lg border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Checkpoints</h2>
              <button
                onClick={() => setShowAddCheckpointModal(true)}
                className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Checkpoint</span>
              </button>
            </div>

            {checkpoints.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-white text-lg font-medium mb-2">No Checkpoints</h3>
                <p className="text-gray-400 mb-4">Get started by adding your first checkpoint</p>
                <button
                  onClick={() => setShowAddCheckpointModal(true)}
                  className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-6 py-2 rounded transition-colors"
                >
                  Add Your First Checkpoint
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {checkpoints.map((checkpoint, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 rounded-lg border border-gray-600/30 p-4 hover:border-gray-500/50 transition-colors"
                  >
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
                            title="Delete Checkpoint"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
    </div>
  );
}

export default function ScriptsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
          <p className="text-gray-400">Please wait...</p>
        </div>
      </div>
    }>
      <ScriptsContent />
    </Suspense>
  );
}
