
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GetKeyContent() {
  const searchParams = useSearchParams();
  const keysystemId = searchParams.get('id');
  
  const [keysystem, setKeysystem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (!keysystemId) {
      setError('Invalid keysystem ID');
      setIsLoading(false);
      return;
    }

    // Set current system in localStorage
    localStorage.setItem('current_system', keysystemId);

    // Generate or get browser UUID
    generateBrowserUUID();
    
    // Fetch keysystem data
    fetchKeysystem();
  }, [keysystemId]);

  const generateBrowserUUID = async () => {
    let uuid = localStorage.getItem('browser_uuid');
    if (!uuid) {
      try {
        const response = await fetch('/api/v1/utils/uuid');
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('browser_uuid', data.uuid);
        }
      } catch (error) {
        console.error('Error generating UUID:', error);
      }
    }
  };

  const fetchKeysystem = async () => {
    try {
      // We'll need to create a public endpoint to fetch keysystem data
      const response = await fetch(`/api/v1/keysystems/public/${keysystemId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch keysystem');
      }

      if (!data.keysystem.active) {
        setError('This keysystem is currently inactive');
        setIsLoading(false);
        return;
      }

      setKeysystem(data.keysystem);
    } catch (error) {
      console.error('Error fetching keysystem:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckpointClick = (checkpoint, index) => {
    if (index === currentStep) {
      window.open(checkpoint.redirect_url, '_blank');
    }
  };

  const showErrorModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!keysystem) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f1015] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, white 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Key System</h1>
            <p className="text-gray-400">{keysystem.name}</p>
          </div>

          {/* Progress Section */}
          <div className="bg-black/20 backdrop-blur-md rounded-lg border border-white/10 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Progress</h2>
              <span className="text-sm text-gray-400">
                {currentStep}/{keysystem.checkpoints?.length || 0}
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep) / (keysystem.checkpoints?.length || 1)) * 100}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Checkpoints */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Checkpoints</h3>
                <div className="space-y-3">
                  {keysystem.checkpoints?.map((checkpoint, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        index < currentStep
                          ? 'bg-green-500/20 border-green-500/30 text-green-400'
                          : index === currentStep
                          ? 'bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30'
                          : 'bg-gray-600/20 border-gray-600/30 text-gray-400'
                      }`}
                      onClick={() => handleCheckpointClick(checkpoint, index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index < currentStep
                              ? 'bg-green-500 text-white'
                              : index === currentStep
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {index < currentStep ? '✓' : index + 1}
                          </div>
                          <span className="font-medium">
                            {checkpoint.type.charAt(0).toUpperCase() + checkpoint.type.slice(1)}
                          </span>
                        </div>
                        {index === currentStep && (
                          <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors">
                            START
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keys Section */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Your Keys</h3>
                <div className="bg-gray-800/50 rounded-lg border border-gray-600/30 p-4">
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-600/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l4.293-4.293A6 6 0 0119 9z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">No keys available</p>
                    <p className="text-gray-500 text-xs mt-1">Complete checkpoints to get a key</p>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-gray-400 text-sm">
                    Max Keys: <span className="text-white font-medium">{keysystem.maxKeyPerPerson}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Complete all checkpoints to receive your key
            </p>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b2e] border border-red-500/30 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-red-400 font-semibold">Error</h3>
              </div>
              
              <p className="text-gray-300 mb-6">{modalMessage}</p>
              
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 px-4 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GetKeyPage() {
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
      <GetKeyContent />
    </Suspense>
  );
}
