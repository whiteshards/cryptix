
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [completedCheckpoints, setCompletedCheckpoints] = useState([]);

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
      } else {
        throw new Error('Failed to fetch keysystem data');
      }
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('browser_uuid');
    localStorage.removeItem('current_id');
    window.location.reload();
  };

  const handleStartProgress = () => {
    if (keysystem.checkpoints.length > 0) {
      // Redirect to first checkpoint
      window.open(keysystem.checkpoints[0].redirect_url, '_blank');
    }
  };

  const handleGetNewKey = () => {
    // Logic for generating a new key
    console.log('Getting new key...');
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

  if (error || !keysystem) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-red-400 text-sm">{error || 'Keysystem not found'}</div>
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

            {/* Progress Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                
                <div className="flex items-center space-x-3">
                  <span className="text-white">
                    {currentProgress}/{keysystem.checkpointCount}
                  </span>
                  
                  {/* Start Button on right side */}
                  {currentProgress === 0 && (
                    <button
                      onClick={handleStartProgress}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Start
                    </button>
                  )}

                  {/* Get Key Button for completed progress */}
                  {currentProgress === keysystem.checkpointCount && currentProgress > 0 && (
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
              
              {userKeys.length > 0 ? (
                <div className="bg-black/20 rounded border border-white/10 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-3 gap-4 p-3 bg-gray-800/30 border-b border-white/10 text-xs text-gray-400 font-medium">
                    <div>Key</div>
                    <div>Status</div>
                    <div>Action</div>
                  </div>
                  
                  {/* Table Rows */}
                  {userKeys.map((key, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 p-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors text-sm">
                      <div className="text-white font-mono truncate">{key.value}</div>
                      <div>
                        <span className="inline-flex px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                          Active
                        </span>
                      </div>
                      <div>
                        <button className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
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
