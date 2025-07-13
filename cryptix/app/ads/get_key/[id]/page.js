
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function GetKey() {
  const params = useParams();
  const keysystemId = params.id;
  
  const [browserUuid, setBrowserUuid] = useState('');
  const [keysystem, setKeysystem] = useState(null);
  const [userKeys, setUserKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [checkpoints, setCheckpoints] = useState([]);
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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const fetchKeysystemData = async () => {
    try {
      setIsLoading(true);
      // This would be your API call to fetch keysystem data
      // For now, I'll simulate the data structure
      const mockKeysystem = {
        id: keysystemId,
        name: 'Example Keysystem',
        active: true,
        checkpoints: [
          {
            type: 'linkvertise',
            redirect_url: 'https://rinku.pro/VanbywBb',
            mandatory: true
          }
        ]
      };
      
      setKeysystem(mockKeysystem);
      setCheckpoints(mockKeysystem.checkpoints);
      
    } catch (error) {
      setError('Failed to load keysystem');
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
    if (checkpoints.length > 0) {
      // Redirect to first checkpoint
      window.open(checkpoints[0].redirect_url, '_blank');
    }
  };

  const handleGetNewKey = () => {
    // Logic for generating a new key
    console.log('Getting new key...');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-white text-lg">Loading keysystem...</div>
      </div>
    );
  }

  if (error || !keysystem) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-red-400 text-lg">{error || 'Keysystem not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1015] relative">
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-[#1a1b2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-8 py-6">
              <h1 className="text-white text-2xl sm:text-3xl font-bold text-center">
                {keysystem.name}
              </h1>
            </div>

            {/* Progress Section */}
            <div className="p-8 sm:p-12">
              <div className="text-center mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm font-medium">Progress:</span>
                  <span className="text-white text-sm font-medium">
                    {currentProgress}/{checkpoints.length}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-700/50 rounded-full h-3 mb-6">
                  <div 
                    className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(currentProgress / checkpoints.length) * 100}%` }}
                  ></div>
                </div>

                {/* Start Button */}
                {currentProgress === 0 && (
                  <button
                    onClick={handleStartProgress}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    🚀 START
                  </button>
                )}

                {/* Completion State */}
                {currentProgress === checkpoints.length && currentProgress > 0 && (
                  <div className="space-y-4">
                    <div className="text-green-400 text-lg font-semibold mb-4">
                      ✅ All checkpoints completed!
                    </div>
                    <button
                      onClick={handleGetNewKey}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      ➕ GET A NEW KEY
                    </button>
                  </div>
                )}
              </div>

              {/* Keys Table */}
              {userKeys.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-white text-xl font-semibold mb-6">YOUR KEYS ({userKeys.length})</h2>
                  
                  <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-800/50 border-b border-white/10">
                      <div className="text-gray-400 text-sm font-medium">YOUR KEYS ({userKeys.length})</div>
                      <div className="text-gray-400 text-sm font-medium">TIME LEFT</div>
                      <div className="text-gray-400 text-sm font-medium">STATUS</div>
                      <div className="text-gray-400 text-sm font-medium">ACTIONS</div>
                    </div>
                    
                    {/* Table Rows */}
                    {userKeys.map((key, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-yellow-400">🔐</span>
                          <span className="text-white font-mono text-sm">{key.value}</span>
                        </div>
                        <div className="text-green-400 text-sm font-medium">{key.timeLeft}</div>
                        <div>
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            ACTIVE
                          </span>
                        </div>
                        <div>
                          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                            📋 Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {userKeys.length === 0 && currentProgress === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-4">
                    Complete checkpoints to generate your keys
                  </div>
                  <div className="text-gray-500 text-sm">
                    Click START to begin the process
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Right Info */}
      <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-sm">
        <div className="flex items-center space-x-3">
          <div className="text-gray-400">
            ID: <span className="text-white font-mono">{browserUuid.substring(0, 8)}</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
