
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function RecbMainContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hash = searchParams.get('hash');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (!hash) {
      setModalMessage('Anti-Bypassed Detected Invalid Request Body. Please complete the checkpoint properly');
      setShowModal(true);
      setIsVerifying(false);
      return;
    }

    verifyHash();
  }, [hash]);

  const verifyHash = async () => {
    try {
      const response = await fetch(`/api/v1/cb/recbmain?hash=${hash}`);
      const data = await response.json();

      if (data.success) {
        // Get keysystem ID from localStorage
        const keysystemId = localStorage.getItem('current_system');
        
        if (!keysystemId) {
          setModalMessage('Your request has been blocked because your browser isn\'t associated with any keysystem. Visit the keysystem\'s link first and retry');
          setShowModal(true);
          setIsVerifying(false);
          return;
        }

        // Redirect to ads page with keysystem ID
        router.push(`/ads/get_key?id=${keysystemId}`);
      } else {
        setModalMessage(data.error || 'Verification failed');
        setShowModal(true);
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setModalMessage('An error occurred during verification');
      setShowModal(true);
      setIsVerifying(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    // Redirect to home page or close the window
    router.push('/');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Verifying...</h1>
          <p className="text-gray-400">Please wait while we verify your request...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
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
                <h3 className="text-red-400 font-semibold">Verification Failed</h3>
              </div>
              
              <p className="text-gray-300 mb-6">{modalMessage}</p>
              
              <button
                onClick={closeModal}
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

export default function RecbMainPage() {
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
      <RecbMainContent />
    </Suspense>
  );
}
