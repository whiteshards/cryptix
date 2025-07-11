
<old_str>'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScriptPage({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [keysystem, setKeysystem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthAndAccess();
  }, [id]);

  const checkAuthAndAccess = async () => {
    try {
      const token = localStorage.getItem('cryptix_jwt');
      if (!token) {
        router.push('/login');
        return;
      }

      // Check authentication
      const response = await fetch('/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        localStorage.removeItem('cryptix_jwt');
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        
        // Check if user has access to this keysystem
        const userKeysystem = data.user.keysystems?.find(ks => ks.id === id);
        if (userKeysystem) {
          setHasAccess(true);
          setKeysystem(userKeysystem);
        } else {
          setError('You do not have access to this keysystem');
        }
      } else {
        setError('Failed to verify authentication');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Authentication check failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAccess) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            {error || 'You do not have access to this keysystem'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-6 py-2 rounded transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Redirect to the main scripts page with the ID as a query parameter
  // This maintains compatibility with the existing scripts page
  router.push(`/dashboard/scripts?id=${id}`);
  
  return null;
}</old_str>
<new_str>'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScriptPage({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [keysystem, setKeysystem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthAndAccess();
  }, [id]);

  const checkAuthAndAccess = async () => {
    try {
      const token = localStorage.getItem('cryptix_jwt');
      if (!token) {
        router.push('/login');
        return;
      }

      // Check authentication
      const response = await fetch('/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        localStorage.removeItem('cryptix_jwt');
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        
        // Check if user has access to this keysystem
        const userKeysystem = data.customer.keysystems?.find(ks => ks.id === id);
        if (userKeysystem) {
          setHasAccess(true);
          setKeysystem(userKeysystem);
        } else {
          setError('You do not have access to this keysystem');
        }
      } else {
        setError('Failed to verify authentication');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Authentication check failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAccess) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            {error || 'You do not have access to this keysystem'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-6 py-2 rounded transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Redirect to the main scripts page with the ID as a query parameter
  // This maintains compatibility with the existing scripts page
  router.push(`/dashboard/scripts?id=${id}`);
  
  return null;
}</new_str>
