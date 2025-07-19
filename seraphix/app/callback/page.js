
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CallbackContent() {
  const [status, setStatus] = useState('Processing authentication...');
  const [isError, setIsError] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus(`Authentication error: ${error}`);
        setIsError(true);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!code) {
        setStatus('No authorization code received');
        setIsError(true);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      try {
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({code}),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log('Registration successful:', data);

          // Store refresh token in localStorage
          localStorage.setItem('cryptix_jwt', data.user.token || data.token);
          
          // Store discord ID
          localStorage.setItem('cryptix_discord_id', data.user.discord_id);

          // Store password if provided (for new registrations)
          if (data.password || data.user.password) {
            localStorage.setItem('cryptix_password', data.password || data.user.password);
          }

          console.log('Token stored, redirecting to dashboard');
          setStatus('Authentication successful! Redirecting to dashboard...');

          // Add a small delay before redirect to ensure localStorage is written
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          console.error('Registration failed:', data);
          setStatus(`Registration failed: ${data.detail || 'Unknown error'}`);
          setIsError(true);
          setTimeout(() => router.push('/login'), 3000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('Network error occurred');
        setIsError(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-black/50 backdrop-blur-md rounded-lg p-8 border border-white/20 text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Cryptix</h1>
            <p className="text-gray-400">Authentication Processing</p>
          </div>

          <div className="mb-6">
            {!isError ? (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            ) : (
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>

          <div className={`p-4 rounded-lg ${isError ? 'bg-red-900/20 border border-red-500' : 'bg-white/5 border border-white/10'}`}>
            <p className={`text-sm ${isError ? 'text-red-400' : 'text-gray-300'}`}>
              {status}
            </p>
          </div>

          {isError && (
            <div className="mt-6">
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-white hover:bg-gray-200 text-black py-2 px-4 rounded-md font-medium transition-colors duration-200"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
          <p className="text-gray-400">Please wait...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
