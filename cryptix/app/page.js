
'use client';

import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

export default function Home() {
  useEffect(() => {
    // Set development token for easier testing
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('cryptix_jwt', 'Nnj4NjZdoFNxxU7Yb8TeLJZpHISn5Z');
      localStorage.setItem('cryptix_password', 'xlijxzVN');
    }
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}
