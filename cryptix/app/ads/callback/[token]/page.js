'use client';

import { headers } from 'next/headers';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CallbackPage() {
  const params = useParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');
  const [checkpointInfo, setCheckpointInfo] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const callbackToken = params.token;

        setLoadingProgress(10);
        setLoadingText('Validating callback token...');
        await new Promise(resolve => setTimeout(resolve, 200));

        if (!callbackToken) {
          redirectWithError('Invalid callback token');
          return;
        }

        setLoadingProgress(20);
        setLoadingText('Finding checkpoint...');
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log(headers)
        // Step 1: Find the checkpoint and keysystem by callback token
        const checkpointData = await findCheckpointByToken(callbackToken);
        if (!checkpointData) {
          redirectWithError('Checkpoint not found');
          return;
        }

        const { keysystem, checkpoint, checkpointIndex } = checkpointData;

        // Set checkpoint info for display
        setCheckpointInfo({
          keysystemName: keysystem.name,
          checkpointType: checkpoint.type,
          checkpointIndex: checkpointIndex + 1,
          totalCheckpoints: keysystem.checkpoints?.length || 1
        });

        setLoadingProgress(35);
        setLoadingText(`Processing ${checkpoint.type} checkpoint...`);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Step 2: Process supported checkpoint types
        if (!['custom', 'linkvertise', 'lootlabs'].includes(checkpoint.type)) {
          redirectWithError('Checkpoint type not supported yet');
          return;
        }

        setLoadingProgress(50);
        setLoadingText('Validating session...');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 3: Get browser UUID and session data
        const browserUuid = localStorage.getItem('browser_uuid');
        const currentKeysystemId = localStorage.getItem('current_id');

        if (!browserUuid || currentKeysystemId !== keysystem.id) {
          redirectWithError('Invalid session or wrong keysystem');
          return;
        }

        setLoadingProgress(65);
        setLoadingText('Verifying user session...');
        await new Promise(resolve => setTimeout(resolve, 250));

        // Step 4: Get user session from database
        const sessionData = await getUserSession(keysystem.id, browserUuid);
        if (!sessionData) {
          redirectWithError('Session not found');
          return;
        }

        setLoadingProgress(75);
        setLoadingText('Checking checkpoint integrity...');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 5: Check checkpoint integrity
        const integrityCheck = validateCheckpointIntegrity(sessionData, checkpointIndex);
        if (!integrityCheck.valid) {
          redirectWithError(integrityCheck.error);
          return;
        }

        setLoadingProgress(85);

        // Step 6: Anti-bypass checks (skip for linkvertise)
        if (checkpoint.type === 'custom' || checkpoint.type === 'lootlabs') {
          setLoadingText('Running anti-bypass checks...');
          await new Promise(resolve => setTimeout(resolve, 300));

          const antiBypassCheck = await performAntiBypassChecks(keysystem.id, browserUuid);
          if (!antiBypassCheck.valid) {
            redirectWithError(antiBypassCheck.error);
            return;
          }
        } else if (checkpoint.type === 'linkvertise') {
          setLoadingText('Verifying Linkvertise hash...');
          await new Promise(resolve => setTimeout(resolve, 300));

          // For Linkvertise, verify the hash parameter
          const hashVerification = await verifyLinkvertiseHash(callbackToken);
          if (!hashVerification.valid) {
            redirectWithError(hashVerification.error);
            return;
          }
        }

        setLoadingProgress(95);
        setLoadingText('Updating progress...');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 7: All checks passed - update progress and cleanup
        await updateCheckpointProgress(keysystem.id, browserUuid, checkpointIndex);

        // Clean up session token
        localStorage.removeItem('session_token');

        setLoadingProgress(100);
        setLoadingText('Checkpoint completed successfully!');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Redirect back to get_key page
        router.push(`/ads/get_key/${keysystem.id}`);

      } catch (error) {
        console.error('Callback processing error:', error);
        redirectWithError('Internal processing error');
      }
    };

    processCallback();
  }, [params.token, router]);

  const findCheckpointByToken = async (callbackToken) => {
    try {
      // First try to find regular checkpoint
      const response = await fetch(`/api/v1/keysystems/checkpoints/find-by-token?token=${callbackToken}`);
      const data = await response.json();

      if (data.success) {
        return data;
      }

      // If not found, try LootLabs callback finder with session ID
      const browserUuid = localStorage.getItem('browser_uuid');
      
      if (browserUuid) {
        const lootlabsResponse = await fetch(`/api/v1/keysystems/lootlabs/find-callback?token=${callbackToken}&sessionId=${browserUuid}`);
        const lootlabsData = await lootlabsResponse.json();
        
        if (lootlabsData.success) {
          return lootlabsData;
        }

        // Try the legacy LootLabs callback method
        const legacyResponse = await fetch(`/api/v1/keysystems/lootlabs/callback?callbackToken=${callbackToken}&sessionId=${browserUuid}`);
        const legacyData = await legacyResponse.json();
        
        if (legacyData.success) {
          return legacyData;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding checkpoint:', error);
      return null;
    }
  };

  const getUserSession = async (keysystemId, sessionId) => {
    try {
      const response = await fetch(`/api/v1/keysystems/sessions?keysystemId=${keysystemId}&sessionId=${sessionId}`);
      const data = await response.json();

      if (data.success && data.exists) {
        return data.session;
      }
      return null;
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  };

  const validateCheckpointIntegrity = (sessionData, checkpointIndex) => {
    const currentProgress = sessionData.current_checkpoint || 0;

    // Check if user is trying to skip checkpoints
    if (checkpointIndex !== currentProgress) {
      return {
        valid: false,
        error: 'Skipped or Re-did the same checkpoint'
      };
    }

    return { valid: true };
  };

  const performAntiBypassChecks = async (keysystemId, sessionId) => {
    try {
      // Check if session token exists
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        return {
          valid: false,
          error: 'Session Token Expired/Not Found'
        };
      }

      // Check session token in database and get creation time
      const response = await fetch(`/api/v1/keysystems/sessions/token?keysystemId=${keysystemId}&sessionId=${sessionId}`);
      const data = await response.json();

      if (!data.success || !data.exists) {
        return {
          valid: false,
          error: 'Session Token Expired/Not Found'
        };
      }

      // Check if token was created less than 30 seconds ago
      const tokenCreationTime = data.session_token?.created_at;
      if (tokenCreationTime) {
        const timeDifference = Date.now() - tokenCreationTime;
        if (timeDifference < 30000) { // 30 seconds in milliseconds
          return {
            valid: false,
            error: 'Anti-bypass Triggered'
          };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('Anti-bypass check error:', error);
      return {
        valid: false,
        error: 'Anti-bypass check failed'
      };
    }
  };

  const verifyLinkvertiseHash = async (callbackToken) => {
    try {
      // Get hash from URL - check both query parameter and fragment
      const urlParams = new URLSearchParams(window.location.search);
      const hashFromQuery = urlParams.get('hash');
      const hashFromFragment = window.location.hash.substring(1); // Remove the # symbol

      const hash = hashFromQuery || hashFromFragment;

      if (!hash) {
        return {
          valid: false,
          error: 'Hash parameter missing from Linkvertise callback'
        };
      }

      // Verify hash with Linkvertise API
      const response = await fetch('/api/v1/keysystems/linkvertise/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: callbackToken,
          hash: hash
        }),
      });

      const data = await response.json();

      if (!data.success) {
        return {
          valid: false,
          error: data.error || 'Linkvertise verification failed'
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Linkvertise verification error:', error);
      return {
        valid: false,
        error: 'Linkvertise verification failed'
      };
    }
  };

  const updateCheckpointProgress = async (keysystemId, sessionId, completedCheckpointIndex) => {
    try {
      const response = await fetch('/api/v1/keysystems/sessions/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId,
          sessionId,
          checkpointIndex: completedCheckpointIndex + 1 // Move to next checkpoint
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error updating progress:', error);
      return false;
    }
  };

  const cleanupLootLabsCallback = async (keysystemId, sessionId, checkpointIndex) => {
    try {
      const response = await fetch('/api/v1/keysystems/lootlabs/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId,
          sessionId,
          checkpointIndex
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error cleaning up LootLabs callback:', error);
      return false;
    }
  };

  const redirectWithError = (errorMessage) => {
    const currentKeysystemId = localStorage.getItem('current_id');
    if (currentKeysystemId) {
      router.push(`/ads/get_key/${currentKeysystemId}?error=${encodeURIComponent(errorMessage)}`);
    } else {
      router.push('/');
    }
  };

  // Loading UI
  return (
    <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
      <div className="w-full max-w-md px-8">
        {/* Header Info */}
        {checkpointInfo && (
          <div className="text-center mb-8">
            <div className="text-white text-xl font-medium mb-2">
              {checkpointInfo.keysystemName}
            </div>
            <div className="text-gray-400 text-sm mb-1">
              Processing {checkpointInfo.checkpointType} checkpoint
            </div>
            <div className="text-gray-500 text-xs">
              Step {checkpointInfo.checkpointIndex} of {checkpointInfo.totalCheckpoints}
            </div>
          </div>
        )}

        {/* Loading Text */}
        <div className="text-center mb-8">
          <div className="text-white text-lg font-medium mb-2 transition-all duration-500 ease-out">
            {loadingText}
          </div>
          <div className="text-gray-400 text-sm">
            Please wait while we process your checkpoint
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
          {/* Animated Progress Bar */}
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${loadingProgress}%` }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>

          {/* Progress Glow */}
          <div 
            className="absolute top-0 left-0 h-full bg-[#6366f1]/50 rounded-full blur-sm transition-all duration-500 ease-out"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>

        {/* Progress Percentage */}
        <div className="text-center mt-4">
          <span className="text-gray-300 text-sm font-mono transition-all duration-300">
            {loadingProgress}%
          </span>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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