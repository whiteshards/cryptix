
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CallbackPage() {
  const params = useParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const callbackToken = params.token;
        
        
        if (!callbackToken) {
          redirectWithError('Invalid callback token');
          return;
        }

        // Step 1: Find the checkpoint and keysystem by callback token
        const checkpointData = await findCheckpointByToken(callbackToken);
        if (!checkpointData) {
          redirectWithError('Checkpoint not found');
          return;
        }

        const { keysystem, checkpoint, checkpointIndex } = checkpointData;

        // Step 2: Process custom and linkvertise type checkpoints
        if (checkpoint.type !== 'custom' && checkpoint.type !== 'linkvertise') {
          redirectWithError('Checkpoint type not supported yet');
          return;
        }

        // Step 3: Get browser UUID and session data
        const browserUuid = localStorage.getItem('browser_uuid');
        const currentKeysystemId = localStorage.getItem('current_id');
        
        if (!browserUuid || currentKeysystemId !== keysystem.id) {
          redirectWithError('Invalid session or wrong keysystem');
          return;
        }

        // Step 4: Get user session from database
        const sessionData = await getUserSession(keysystem.id, browserUuid);
        if (!sessionData) {
          redirectWithError('Session not found');
          return;
        }

        // Step 5: Check checkpoint integrity
        const integrityCheck = validateCheckpointIntegrity(sessionData, checkpointIndex);
        if (!integrityCheck.valid) {
          redirectWithError(integrityCheck.error);
          return;
        }

        // Step 6: Anti-bypass checks (skip for linkvertise)
        if (checkpoint.type !== 'linkvertise') {
          const antiBypassCheck = await performAntiBypassChecks(keysystem.id, browserUuid);
          if (!antiBypassCheck.valid) {
            redirectWithError(antiBypassCheck.error);
            return;
          }
        } else {
          // For Linkvertise, verify the hash parameter
          const hashVerification = await verifyLinkvertiseHash(callbackToken);
          if (!hashVerification.valid) {
            redirectWithError(hashVerification.error);
            return;
          }
        }

        // Step 7: All checks passed - update progress and cleanup
        await updateCheckpointProgress(keysystem.id, browserUuid, checkpointIndex);
        
        // Clean up session token
        localStorage.removeItem('session_token');
        
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
      // Search through all keysystems to find the checkpoint with this token
      const response = await fetch(`/api/v1/keysystems/checkpoints/find-by-token?token=${callbackToken}`);
      const data = await response.json();
      
      if (data.success) {
        return data;
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

  const redirectWithError = (errorMessage) => {
    const currentKeysystemId = localStorage.getItem('current_id');
    if (currentKeysystemId) {
      router.push(`/ads/get_key/${currentKeysystemId}?error=${encodeURIComponent(errorMessage)}`);
    } else {
      router.push('/');
    }
  };

  // No UI - just processing
  return null;
}
