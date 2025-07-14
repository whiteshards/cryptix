
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CallbackPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    if (!token) {
      redirectWithError('Invalid callback token');
      return;
    }

    processCallback();
  }, [token]);

  const redirectWithError = (errorMessage) => {
    const keysystemId = localStorage.getItem('current_id');
    if (keysystemId) {
      router.push(`/ads/get_key/${keysystemId}?error=${encodeURIComponent(errorMessage)}`);
    } else {
      router.push('/');
    }
  };

  const processCallback = async () => {
    try {
      // Step 1: Identify token and get checkpoint/keysystem details
      const identifyResponse = await fetch(`/api/v1/keysystems/checkpoints/identify?token=${token}`);
      const identifyData = await identifyResponse.json();

      if (!identifyResponse.ok || !identifyData.success) {
        redirectWithError('Invalid checkpoint token');
        return;
      }

      const { keysystem, checkpoint, checkpointIndex } = identifyData;

      // Step 2: Check if checkpoint type is custom
      if (checkpoint.type !== 'custom') {
        // For non-custom types, redirect back without processing
        router.push(`/ads/get_key/${keysystem.id}`);
        return;
      }

      // Step 3: Get browser UUID and session data
      const browserUuid = localStorage.getItem('browser_uuid');
      if (!browserUuid) {
        redirectWithError('Browser session not found');
        return;
      }

      // Step 4: Get user session from database
      const sessionResponse = await fetch(`/api/v1/keysystems/sessions?keysystemId=${keysystem.id}&sessionId=${browserUuid}`);
      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok || !sessionData.success || !sessionData.exists) {
        redirectWithError('User session not found');
        return;
      }

      const userSession = sessionData.session;

      // Step 5: Check checkpoint integrity
      if (userSession.current_checkpoint !== checkpointIndex) {
        if (userSession.current_checkpoint > checkpointIndex) {
          redirectWithError('Skipped or Re-did the same checkpoint');
          return;
        }
        if (userSession.current_checkpoint < checkpointIndex - 1) {
          redirectWithError('Previous checkpoints not completed');
          return;
        }
      }

      // Step 6: Check session token
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        redirectWithError('Session Token Expired/Not Found');
        return;
      }

      // Step 7: Validate session token in database and check creation time
      const validateResponse = await fetch('/api/v1/keysystems/sessions/token/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: keysystem.id,
          sessionId: browserUuid,
          sessionToken: sessionToken
        }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok || !validateData.success) {
        redirectWithError('Session Token Expired/Not Found');
        return;
      }

      // Step 8: Check if token was created less than 30 seconds ago (anti-bypass)
      const tokenCreationTime = new Date(validateData.tokenCreatedAt).getTime();
      const currentTime = new Date().getTime();
      const timeDifference = currentTime - tokenCreationTime;

      if (timeDifference < 30000) { // 30 seconds = 30000 milliseconds
        redirectWithError('Anti-bypass Triggered');
        return;
      }

      // Step 9: All checks passed - update checkpoint progress
      const updateResponse = await fetch('/api/v1/keysystems/sessions/checkpoint/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: keysystem.id,
          sessionId: browserUuid,
          sessionToken: sessionToken
        }),
      });

      const updateData = await updateResponse.json();

      if (!updateResponse.ok || !updateData.success) {
        redirectWithError('Failed to update checkpoint progress');
        return;
      }

      // Step 10: Clear session token from localStorage (already deleted from database in API)
      localStorage.removeItem('session_token');

      // Step 11: Redirect back to get_key page
      router.push(`/ads/get_key/${keysystem.id}`);

    } catch (error) {
      console.error('Callback processing error:', error);
      redirectWithError('Processing error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <div className="text-white text-sm">{status}</div>
      </div>
    </div>
  );
}
