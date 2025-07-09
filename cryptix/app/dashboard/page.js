
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '../components/DashboardNavbar';

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('cryptix_jwt');
    if (!token) {
      router.push('/login');
      return;
    }

    // For now, use a placeholder username - in production this would come from API
    setUsername('Vxivs');
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f1015]">
      <DashboardNavbar username={username} />
    </div>
  );
}
