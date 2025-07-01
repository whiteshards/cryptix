
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        setStatus('No authorization code received');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      try {
        setStatus('Registering user...');
        
        const response = await fetch('https://cryptix-api.vercel.app/api/v1/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Store JWT token in localStorage
          localStorage.setItem('cryptix_jwt', data.token);
          localStorage.setItem('cryptix_discord_id', data.customer.discord_id);
          
          setStatus('Success! Redirecting to dashboard...');
          setTimeout(() => router.push('/dashboard'), 1500);
        } else {
          setStatus(`Registration failed: ${data.detail || 'Unknown error'}`);
          setTimeout(() => router.push('/'), 3000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('Network error occurred');
        setTimeout(() => router.push('/'), 3000);
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
