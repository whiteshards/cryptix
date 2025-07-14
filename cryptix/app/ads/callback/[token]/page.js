
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CallbackPage() {
  const params = useParams();
  const router = useRouter();
  const callbackToken = params.token;

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Step 1: Find which checkpoint and keysystem this token belongs to
        const tokenResponse = await fetch(`/api/v1/keysystems/callback/validate?token=${callbackToken}`);
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.success) {
          router.push(`/ads/get_key/${tokenData.keysystemId || 'unknown'}?error=Invalid callback token`);
          return;
        }

        const { keysystemId, checkpointIndex, checkpoint } = tokenData;

        // Step 2: Check if checkpoint type is custom (only handle custom for now)
        if (checkpoint.type !== 'custom') {
          // For non-custom checkpoints, redirect back to get_key page
          router.push(`/ads/get_key/${keysystemId}`);
          return;
        }

        // Step 3: Get browser UUID and session info
        const browserUuid = localStorage.getItem('browser_uuid');
        const sessionToken = localStorage.getItem('session_token');
        const currentKeysystemId = localStorage.getItem('current_id');

        if (!browserUuid || currentKeysystemId !== keysystemId) {
          router.push(`/ads/get_key/${keysystemId}?error=Session mismatch or invalid browser session`);
          return;
        }

        if (!sessionToken) {
          router.push(`/ads/get_key/${keysystemId}?error=Session Token Expired/Not Found`);
          return;
        }

        // Step 4: Validate session and check checkpoint progression
        const validationResponse = await fetch('/api/v1/keysystems/callback/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keysystemId,
            sessionId: browserUuid,
            checkpointIndex,
            sessionToken,
            callbackToken
          })
        });

        const validationData = await validationResponse.json();

        if (!validationResponse.ok || !validationData.success) {
          router.push(`/ads/get_key/${keysystemId}?error=${encodeURIComponent(validationData.error)}`);
          return;
        }

        // Step 5: If validation successful, clear session token and redirect
        localStorage.removeItem('session_token');
        router.push(`/ads/get_key/${keysystemId}`);

      } catch (error) {
        console.error('Callback processing error:', error);
        router.push(`/ads/get_key/unknown?error=Processing failed`);
      }
    };

    if (callbackToken) {
      processCallback();
    }
  }, [callbackToken, router]);

  // No UI - just processing
  return null;
}
