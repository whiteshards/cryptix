'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function GetKey() {
  const params = useParams();
  const keysystemId = params.id;

  const [browserUuid, setBrowserUuid] = useState('');
  const [keysystem, setKeysystem] = useState(null);
  const [userKeys, setUserKeys] = useState([]);
  const [userSession, setUserSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [completedCheckpoints, setCompletedCheckpoints] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(null);
  const [keyTimers, setKeyTimers] = useState({});
  const [toast, setToast] = useState(null);

  // Check for error in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setUrlError(decodeURIComponent(errorParam));
      setShowErrorModal(true);
    }
  }, []);

  // Generate or get browser UUID
  useEffect(() => {
    let uuid = localStorage.getItem('browser_uuid');
    if (!uuid) {
      uuid = generateUUID();
      localStorage.setItem('browser_uuid', uuid);
    }
    setBrowserUuid(uuid);

    // Set current keysystem ID
    localStorage.setItem('current_id', keysystemId);

    // Fetch keysystem data
    fetchKeysystemData();
  }, [keysystemId]);

  // Check/create session when browserUuid changes
  useEffect(() => {
    if (browserUuid && keysystem) {
      checkOrCreateSession();
    }
  }, [browserUuid, keysystem]);

  // Cooldown timer effect
  useEffect(() => {
    if (userSession?.cooldown_till) {
      const updateCooldown = () => {
        const now = new Date().getTime();
        const cooldownTime = new Date(userSession.cooldown_till).getTime();
        const timeDiff = cooldownTime - now;

        if (timeDiff <= 0) {
          setCooldownTimeLeft(null);
          // Refresh session data
          checkOrCreateSession();
        } else {
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          setCooldownTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      };

      updateCooldown();
      const interval = setInterval(updateCooldown, 1000);
      return () => clearInterval(interval);
    } else {
      setCooldownTimeLeft(null);
    }
  }, [userSession?.cooldown_till]);

  // Key expiration timers effect
  useEffect(() => {
    if (userKeys.length > 0) {
      const updateKeyTimers = () => {
        const newTimers = {};
        userKeys.forEach(key => {
          if (key.expires_at && key.status === 'active') {
            const now = new Date().getTime();
            const expiresTime = new Date(key.expires_at).getTime();
            const timeDiff = expiresTime - now;

            if (timeDiff <= 0) {
              newTimers[key.value] = '00:00:00';
            } else {
              const hours = Math.floor(timeDiff / (1000 * 60 * 60));
              const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
              newTimers[key.value] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
          }
        });
        setKeyTimers(newTimers);
      };

      updateKeyTimers();
      const interval = setInterval(updateKeyTimers, 1000);
      return () => clearInterval(interval);
    }
  }, [userKeys]);

  // Toast auto-dismiss effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const generateUUID = () => {
    return uuidv4();
  };

  const fetchKeysystemData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/keysystems/get?id=${keysystemId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load keysystem');
      }

      if (data.success) {
        setKeysystem(data.keysystem);
        // After getting keysystem data, check/create session
        await checkOrCreateSession();
      } else {
        throw new Error('Failed to fetch keysystem data');
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOrCreateSession = async () => {
    try {
      if (!browserUuid) return;

      // First check if session exists
      const checkResponse = await fetch(`/api/v1/keysystems/sessions?keysystemId=${keysystemId}&sessionId=${browserUuid}`);
      const checkData = await checkResponse.json();

      if (checkData.success && checkData.exists) {
        // Session exists, use it
        setUserSession(checkData.session);
        setUserKeys(checkData.session.keys || []);
        setCurrentProgress(checkData.session.current_checkpoint || 0);
      } else {
        // Session doesn't exist, create it
        const createResponse = await fetch('/api/v1/keysystems/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keysystemId: keysystemId,
            sessionId: browserUuid
          }),
        });

        const createData = await createResponse.json();

        if (createData.success) {
          setUserSession(createData.session);
          setUserKeys(createData.session.keys || []);
          setCurrentProgress(createData.session.current_checkpoint || 0);
        } else {
          throw new Error(createData.error || 'Failed to create session');
        }
      }
    } catch (error) {
      console.error('Session management error:', error);
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      // Destroy the session in the database
      await fetch('/api/v1/keysystems/sessions/destroy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: keysystemId,
          sessionId: browserUuid
        }),
      });
    } catch (error) {
      console.error('Error destroying session:', error);
    }

    // Clear localStorage regardless of API call result
    localStorage.removeItem('browser_uuid');
    localStorage.removeItem('current_id');
    window.location.reload();
  };

  const handleStartProgress = async () => {
    if (keysystem.checkpoints.length > 0) {
      setIsGeneratingToken(true);

      try {
        const firstCheckpoint = keysystem.checkpoints[0];

        // Generate session token for custom, lootlabs, and workink checkpoints
        if (firstCheckpoint.type === 'custom' || firstCheckpoint.type === 'lootlabs' || firstCheckpoint.type === 'workink') {
          // Check if session token already exists in database
          const checkResponse = await fetch(`/api/v1/keysystems/sessions/token/check?keysystemId=${keysystemId}&sessionId=${browserUuid}`);
          const checkData = await checkResponse.json();

          let tokenToStore = null;

          if (checkData.exists && checkData.token) {
            // Token already exists, use it
            tokenToStore = checkData.token;
          } else {
            // Generate new session token (50 characters, letters and numbers)
            const generateSessionToken = () => {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
              let token = '';
              for (let i = 0; i < 50; i++) {
                token += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              return token;
            };

            const sessionToken = generateSessionToken();

            // Store session token in database
            const response = await fetch('/api/v1/keysystems/sessions/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                keysystemId: keysystemId,
                sessionId: browserUuid,
                sessionToken: sessionToken
              }),
            });

            const data = await response.json();

            if (!data.success) {
              setError(`Failed to create session token: ${data.error}`);
              setIsGeneratingToken(false);
              return; // Don't redirect if token creation failed
            }

            tokenToStore = data.token;
          }

          // Store token in localStorage
          if (tokenToStore) {
            localStorage.setItem('session_token', tokenToStore);
          }
        }

        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 500));

        // Handle LootLabs checkpoint differently
        if (firstCheckpoint.type === 'lootlabs') {
          try {
            const response = await fetch('/api/v1/keysystems/lootlabs/generate-url', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                keysystemId: keysystemId,
                sessionId: browserUuid,
                checkpointIndex: 0
              }),
            });

            const data = await response.json();

            if (!data.success) {
              setError(data.error || 'Failed to generate LootLabs URL');
              setIsGeneratingToken(false);
              return;
            }

            // Redirect to LootLabs URL
            window.open(data.lootlabsUrl, '_blank');
          } catch (error) {
            console.error('LootLabs URL generation error:', error);
            setError('Misconfigured keysystem. Please add a valid LootLabs API key to the owner\'s account of the keysystem.');
            setIsGeneratingToken(false);
            return;
          }
        } else {
          // Redirect to first checkpoint for other types
          window.open(firstCheckpoint.redirect_url, '_blank');
        }

      } catch (error) {
        console.error('Session token error:', error);
        setError(`Error managing session token: ${error.message}`);
      } finally {
        setIsGeneratingToken(false);
      }
    }
  };

  const handleNextCheckpoint = async () => {
    if (currentProgress < keysystem.checkpoints.length) {
      setIsGeneratingToken(true);

      try {
        const nextCheckpoint = keysystem.checkpoints[currentProgress];

        // Generate session token for custom, lootlabs, and workink checkpoints
        if (nextCheckpoint.type === 'custom' || nextCheckpoint.type === 'lootlabs' || nextCheckpoint.type === 'workink') {
          // Check if session token already exists in database
          const checkResponse = await fetch(`/api/v1/keysystems/sessions/token/check?keysystemId=${keysystemId}&sessionId=${browserUuid}`);
          const checkData = await checkResponse.json();

          let tokenToStore = null;

          if (checkData.exists && checkData.token) {
            // Token already exists, use it
            tokenToStore = checkData.token;
          } else {
            // Generate new session token (50 characters, letters and numbers)
            const generateSessionToken = () => {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
              let token = '';
              for (let i = 0; i < 50; i++) {
                token += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              return token;
            };

            const sessionToken = generateSessionToken();

            // Store session token in database
            const response = await fetch('/api/v1/keysystems/sessions/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                keysystemId: keysystemId,
                sessionId: browserUuid,
                sessionToken: sessionToken
              }),
            });

            const data = await response.json();

            if (!data.success) {
              setError(`Failed to create session token: ${data.error}`);
              setIsGeneratingToken(false);
              return; // Don't redirect if token creation failed
            }

            tokenToStore = data.token;
          }

          // Store token in localStorage
          if (tokenToStore) {
            localStorage.setItem('session_token', tokenToStore);
          }
        }

        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 500));

        // Handle LootLabs checkpoint differently
        if (nextCheckpoint.type === 'lootlabs') {
          try {
            const response = await fetch('/api/v1/keysystems/lootlabs/generate-url', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                keysystemId: keysystemId,
                sessionId: browserUuid,
                checkpointIndex: currentProgress
              }),
            });

            const data = await response.json();

            if (!data.success) {
              setError(data.error || 'Failed to generate LootLabs URL');
              setIsGeneratingToken(false);
              return;
            }

            // Redirect to LootLabs URL
            window.open(data.lootlabsUrl, '_blank');
          } catch (error) {
            console.error('LootLabs URL generation error:', error);
            setError('Misconfigured keysystem. Please add a valid LootLabs API key to the owner\'s account of the keysystem.');
            setIsGeneratingToken(false);
            return;
          }
        } else {
          // Redirect to next checkpoint for other types
          window.open(nextCheckpoint.redirect_url, '_blank');
        }

      } catch (error) {
        console.error('Session token error:', error);
        setError(`Error managing session token: ${error.message}`);
      } finally {
        setIsGeneratingToken(false);
      }
    }
  };

  const handleGetNewKey = async () => {
    try {
      const response = await fetch('/api/v1/keysystems/keys/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: keysystemId,
          sessionId: browserUuid
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to generate key');
        return;
      }

      // Refresh session data
      await checkOrCreateSession();

    } catch (error) {
      console.error('Key generation error:', error);
      setError('Failed to generate key');
    }
  };

  const handleRenewKey = async (keyValue) => {
    try {
      const response = await fetch('/api/v1/keysystems/keys/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: keysystemId,
          sessionId: browserUuid,
          keyValue: keyValue
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to renew key');
        return;
      }

      // Refresh session data
      await checkOrCreateSession();

    } catch (error) {
      console.error('Key renewal error:', error);
      setError('Failed to renew key');
    }
  };

  const handleCopyKey = (keyValue) => {
    navigator.clipboard.writeText(keyValue).then(() => {
      setToast({
        type: 'success',
        message: 'Copied key to your clipboard'
      });
    }).catch(() => {
      setToast({
        type: 'error',
        message: 'Failed to copy key'
      });
    });
  };

  const handleDeleteKey = async (keyValue) => {
    try {
      const response = await fetch('/api/v1/keysystems/keys/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: keysystemId,
          sessionId: browserUuid,
          keyValue: keyValue
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to delete key');
        return;
      }

      setToast({
        type: 'success',
        message: 'Key deleted successfully'
      });

      // Refresh session data
      await checkOrCreateSession();

    } catch (error) {
      console.error('Key deletion error:', error);
      setError('Failed to delete key');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="w-full max-w-md px-8">
          {/* Loading Text */}
          <div className="text-center mb-8">
            <div className="text-white text-lg font-medium mb-2 transition-all duration-500 ease-out">
              Loading Keysystem...
            </div>
            <div className="text-gray-400 text-sm">
              Please wait while we fetch the keysystem data
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
            {/* Animated Progress Bar */}
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-full transition-all duration-500 ease-out animate-pulse"
              style={{ width: '70%' }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>

            {/* Progress Glow */}
            <div 
              className="absolute top-0 left-0 h-full bg-[#3b82f6]/50 rounded-full blur-sm transition-all duration-500 ease-out"
              style={{ width: '70%' }}
            ></div>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        <style jsx>{`
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

  if (!keysystem && !isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-red-400 text-sm">Keysystem not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1015] relative">
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Main Card */}
          <div className="bg-[#1a1b2e] rounded-lg border border-white/10 p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-gray-400 text-sm">
                {keysystem.checkpointCount} checkpoint{keysystem.checkpointCount !== 1 ? 's' : ''} required
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Cooldown Section */}
            {cooldownTimeLeft && (
              <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-orange-400 text-sm">Cooldown Active</span>
                  <span className="text-orange-300 font-mono text-sm">{cooldownTimeLeft}</span>
                </div>
                <p className="text-orange-300/70 text-xs mt-1">
                  You must wait before creating or renewing keys
                </p>
              </div>
            )}

            {/* Progress Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Progress</span>

                <div className="flex items-center space-x-3">
                  <span className="text-white">
                    {currentProgress}/{keysystem.checkpointCount}
                  </span>

                  {/* Start Button on right side */}
                  {currentProgress === 0 && !cooldownTimeLeft && (
                    <button
                      onClick={handleStartProgress}
                      disabled={isGeneratingToken}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      {isGeneratingToken && (
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      )}
                      <span>{isGeneratingToken ? 'Starting...' : 'Start'}</span>
                    </button>
                  )}

                  {/* Next Checkpoint Button for intermediate progress */}
                  {currentProgress > 0 && currentProgress < keysystem.checkpointCount && !cooldownTimeLeft && (
                    <button
                      onClick={handleNextCheckpoint}
                      disabled={isGeneratingToken}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      {isGeneratingToken && (
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      )}
                      <span>{isGeneratingToken ? 'Redirecting...' : 'Next Checkpoint'}</span>
                    </button>
                  )}

                  {/* Get Key Button for completed progress */}
                  {currentProgress === keysystem.checkpointCount && currentProgress > 0 && !cooldownTimeLeft && (
                    <button
                      onClick={handleGetNewKey}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Get Key
                    </button>
                  )}
                </div>
              </div>

              {/* Simple Progress Bar */}
              <div className="w-full bg-gray-700/30 rounded h-2">
                <div 
                  className="bg-blue-500 h-2 rounded transition-all duration-300"
                  style={{ width: `${(currentProgress / keysystem.checkpointCount) * 100}%` }}
                ></div>
              </div>

              {/* Completion Status */}
              {currentProgress === keysystem.checkpointCount && currentProgress > 0 && (
                <div className="text-center">
                  <div className="text-green-400 text-sm">
                   All checkpoints completed
                  </div>
                </div>
              )}
            </div>

            {/* Keys Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-sm font-medium">Your Keys</h2>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>({userKeys.length}/{keysystem.maxKeyPerPerson})</span>
                  <span>Max: {keysystem.maxKeyPerPerson}</span>
                </div>
              </div>

              {/* Info Text */}
              <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 text-xs">
                💡 Click on the key to copy it
              </div>

              {userKeys.length > 0 ? (
                <div className="bg-black/20 rounded border border-white/10 overflow-hidden">
                  {/* Scrollable container for mobile */}
                  <div className="overflow-x-auto">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gray-800/30 border-b border-white/10 min-w-[700px]">
                      <div className="flex items-center text-xs text-gray-400 font-medium">
                        <div className="w-80 min-w-80">Key</div>
                        <div className="w-20 text-center">Status</div>
                        <div className="w-24 text-center">Expires In</div>
                        <div className="w-20 text-center">Created</div>
                        <div className="w-20 text-center">Actions</div>
                      </div>
                    </div>

                    {/* Key Rows */}
                    <div className="divide-y divide-white/5">
                      {userKeys.map((key, index) => (
                        <div key={index} className="px-4 py-4 hover:bg-white/5 transition-colors min-w-[700px]">
                          <div className="flex items-start text-sm">
                            {/* Key Value */}
                            <div className="w-80 min-w-80 pr-4">
                              <div 
                                onClick={() => handleCopyKey(key.value)}
                                className="text-white font-mono text-xs cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors truncate"
                                title="Click to copy"
                              >
                                {key.value}
                              </div>
                            </div>

                            {/* Status */}
                            <div className="w-20 flex justify-center">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                (key.status === 'active' && (!key.expires_at || keyTimers[key.value] !== '00:00:00'))
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {(key.status === 'active' && (!key.expires_at || keyTimers[key.value] !== '00:00:00')) ? 'Active' : 'Expired'}
                              </span>
                            </div>

                            {/* Expires In */}
                            <div className="w-24 text-center">
                              {key.expires_at ? (
                                <span className={`font-mono text-xs ${
                                  keyTimers[key.value] === '00:00:00' ? 'text-red-400' : 'text-white'
                                }`}>
                                  {keyTimers[key.value] || 'Loading...'}
                                </span>
                              ) : (
                                <span className="text-green-400 text-xs font-medium">Permanent</span>
                              )}
                            </div>

                            {/* Created Date */}
                            <div className="w-20 text-center">
                              <span className="text-gray-400 text-xs">
                                {new Date(key.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="w-20 flex flex-col space-y-1">
                              {!cooldownTimeLeft && 
                               (key.status === 'expired' || (key.expires_at && keyTimers[key.value] === '00:00:00')) && 
                               currentProgress === keysystem.checkpointCount && (
                                <button
                                  onClick={() => handleRenewKey(key.value)}
                                  className="text-green-400 hover:text-green-300 text-xs font-medium transition-colors py-1 px-2 rounded hover:bg-green-500/10"
                                >
                                  Renew
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteKey(key.value)}
                                className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors py-1 px-2 rounded hover:bg-red-500/10"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-black/20 rounded border border-white/10 p-6 text-center">
                  <div className="text-gray-400 text-sm">
                    No keys generated yet
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    Complete checkpoints to generate keys
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1a1b2e] rounded-lg border border-red-500/30 p-6 max-w-md w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-red-400 font-medium">Error</h3>
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 text-sm leading-relaxed">
                {urlError}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for Token Generation */}
      {isGeneratingToken && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1a1b2e] rounded-lg border border-white/10 p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-white text-lg font-medium mb-4">
                Please wait a moment while we redirect you
              </div>

              {/* Loading Animation */}
              <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-full transition-all duration-500 ease-out animate-pulse"
                  style={{ width: '70%' }}
                >
                </div>
                <div 
                  className="absolute top-0 left-0 h-full bg-[#3b82f6]/50 rounded-full blur-sm transition-all duration-500 ease-out"
                  style={{ width: '70%' }}
                ></div>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>

              <div className="text-gray-400 text-sm mt-4">
                Preparing your session...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`bg-[#1a1b2e]/90 backdrop-blur-md border rounded-lg px-4 py-3 max-w-sm ${
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

      {/* Bottom Right Info */}
      <div className="fixed bottom-4 right-4 bg-black/60 border border-white/20 rounded px-3 py-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">
            {browserUuid.substring(0, 8)}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded text-xs transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      </div>
  );
}