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

        // Get browser UUID and current keysystem ID upfront
        const browserUuid = localStorage.getItem('browser_uuid');
        const currentKeysystemId = localStorage.getItem('current_id');

        if (!browserUuid) {
          redirectWithError('Invalid session - browser UUID missing');
          return;
        }

        // Single combined API call to get all checkpoint and session data
        const [checkpointResponse, sessionResponse] = await Promise.all([
          fetch(`/api/v1/keysystems/checkpoints/find-by-token?token=${callbackToken}`),
          currentKeysystemId ? fetch(`/api/v1/keysystems/sessions?keysystemId=${currentKeysystemId}&sessionId=${browserUuid}`) : Promise.resolve(null)
        ]);

        // Process checkpoint data
        const checkpointData = await checkpointResponse.json();
        if (!checkpointData.success) {
          redirectWithError('Checkpoint not found');
          return;
        }

        const { keysystem, checkpoint, checkpointIndex } = checkpointData;

        // Validate session consistency
        if (currentKeysystemId !== keysystem.id) {
          redirectWithError('Invalid session or wrong keysystem');
          return;
        }

        // Process session data
        let sessionData = null;
        if (sessionResponse) {
          const sessionResult = await sessionResponse.json();
          if (!sessionResult.success || !sessionResult.exists) {
            redirectWithError('Session not found');
            return;
          }
          sessionData = sessionResult.session;
        } else {
          redirectWithError('Session not found');
          return;
        }

        // Validate checkpoint type early
        if (checkpoint.type !== 'custom' && checkpoint.type !== 'linkvertise') {
          redirectWithError('Checkpoint type not supported yet');
          return;
        }

        // Check checkpoint integrity
        const currentProgress = sessionData.current_checkpoint || 0;
        if (checkpointIndex !== currentProgress) {
          redirectWithError('Skipped or Re-did the same checkpoint');
          return;
        }

        // Prepare verification promises based on checkpoint type
        const verificationPromises = [];

        if (checkpoint.type === 'linkvertise') {
          // Get hash from URL - check both query parameter and fragment
          const urlParams = new URLSearchParams(window.location.search);
          const hashFromQuery = urlParams.get('hash');
          const hashFromFragment = window.location.hash.substring(1);
          const hash = hashFromQuery || hashFromFragment;

          if (!hash) {
            redirectWithError('Hash parameter missing from Linkvertise callback');
            return;
          }

          // Add Linkvertise verification
          verificationPromises.push(
            fetch('/api/v1/keysystems/linkvertise/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: callbackToken, hash: hash })
            })
          );
        } else {
          // For custom checkpoints, add anti-bypass check
          const sessionToken = localStorage.getItem('session_token');
          if (!sessionToken) {
            redirectWithError('Session Token Expired/Not Found');
            return;
          }

          verificationPromises.push(
            fetch(`/api/v1/keysystems/sessions/token?keysystemId=${keysystem.id}&sessionId=${browserUuid}`)
          );
        }

        // Add progress update promise (can run in parallel)
        verificationPromises.push(
          fetch('/api/v1/keysystems/sessions/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keysystemId: keysystem.id,
              sessionId: browserUuid,
              checkpointIndex: checkpointIndex + 1
            })
          })
        );

        // Execute all verifications and updates in parallel
        const results = await Promise.all(verificationPromises);

        // Process verification result
        const verificationResult = await results[0].json();

        if (checkpoint.type === 'linkvertise') {
          if (!verificationResult.success) {
            redirectWithError(verificationResult.error || 'Linkvertise verification failed');
            return;
          }
        } else {
          // Anti-bypass check for custom checkpoints
          if (!verificationResult.success || !verificationResult.exists) {
            redirectWithError('Session Token Expired/Not Found');
            return;
          }

          const tokenCreationTime = verificationResult.session_token?.created_at;
          if (tokenCreationTime) {
            const timeDifference = Date.now() - tokenCreationTime;
            if (timeDifference < 30000) {
              redirectWithError('Anti-bypass Triggered');
              return;
            }
          }
        }

        // Check progress update result
        const progressResult = await results[1].json();
        if (!progressResult.success) {
          console.warn('Progress update failed, but continuing');
        }

        // Clean up session token and redirect
        localStorage.removeItem('session_token');
        router.push(`/ads/get_key/${keysystem.id}`);

      } catch (error) {
        console.error('Callback processing error:', error);
        redirectWithError('Internal processing error');
      }
    };

    processCallback();
  }, [params.token, router]);

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