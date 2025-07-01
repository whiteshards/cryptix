
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CallbackContent() {
  const [status, setStatus] = useState('Processing authentication...');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus(`Authentication error: ${error}`);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!code) {
        setStatus('No authorization code received');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      try {
        const response = await fetch('https://cryptix-api.vercel.app/api/v1/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({code}),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log('Registration successful:', data);
          
          // Store JWT token in localStorage
          localStorage.setItem('cryptix_jwt', data.token);
          
          // Store password if provided (for new registrations)
          if (data.password) {
            localStorage.setItem('cryptix_password', data.password);
          }
          
          console.log('Token stored, redirecting to dashboard');
          setStatus('Registration successful! Redirecting...');
          
          // Add a small delay before redirect to ensure localStorage is written
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        } else {
          console.error('Registration failed:', data);
          setStatus(`Registration failed: ${data.detail || 'Unknown error'}`);
          setTimeout(() => router.push('/login'), 3000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('Network error occurred');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-white mb-2">Processing Authentication</h1>
        <p className="text-gray-400">{status}</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
