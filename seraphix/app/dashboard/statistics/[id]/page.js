
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Statistics() {
  const router = useRouter();
  const params = useParams();
  const keysystemId = params.id;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keysystem, setKeysystem] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!keysystemId) {
      router.push('/dashboard');
      return;
    }

    const token = localStorage.getItem('cryptix_jwt');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchKeysystemData(token);
  }, [keysystemId, router]);

  const fetchKeysystemData = async (token) => {
    try {
      // Fetch keysystem data using the get route
      const response = await fetch(`/api/v1/keysystems/get?keysystemId=${keysystemId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('cryptix_jwt');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch keysystem data');
      }

      const data = await response.json();
      console.log('Keysystem data:', data);

      if (data.success && data.keysystem) {
        setKeysystem(data.keysystem);
        setIsAuthenticated(true);

        // Process the statistics from the keysystem data
        processStatistics(data.keysystem);
      } else {
        throw new Error('Keysystem not found');
      }
    } catch (error) {
      console.error('Error fetching keysystem data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const processStatistics = (keysystemData) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Process keys data
    const keys = keysystemData.keys || [];
    let activeKeys = 0;
    let expiredKeys = 0;
    let recentKeys = 0;
    const keysByDay = {};

    keys.forEach(key => {
      const expiresAt = new Date(key.expires_at);
      const createdAt = new Date(key.created_at);

      if (expiresAt > now) {
        activeKeys++;
      } else {
        expiredKeys++;
      }

      if (createdAt >= sevenDaysAgo) {
        recentKeys++;
      }

      // Group keys by creation date for chart
      if (createdAt >= thirtyDaysAgo) {
        const dateKey = createdAt.toISOString().split('T')[0];
        keysByDay[dateKey] = (keysByDay[dateKey] || 0) + 1;
      }
    });

    // Process checkpoint stats from the stats object
    const stats = keysystemData.stats || {};
    const checkpointStats = stats.checkpoints || {};

    let totalCheckpointCompletions = 0;
    let recentCheckpointCompletions = 0;
    const checkpointTypeBreakdown = {};
    const dailyActivity = {};

    // Process checkpoint completions
    Object.values(checkpointStats).forEach(checkpoint => {
      totalCheckpointCompletions++;
      const checkpointDate = new Date(checkpoint.date);

      if (checkpointDate >= sevenDaysAgo) {
        recentCheckpointCompletions++;
      }

      // Count by type
      const type = checkpoint.type || 'unknown';
      checkpointTypeBreakdown[type] = (checkpointTypeBreakdown[type] || 0) + 1;

      // Daily activity for the last 30 days
      if (checkpointDate >= thirtyDaysAgo) {
        const dateKey = checkpointDate.toISOString().split('T')[0];
        dailyActivity[dateKey] = (dailyActivity[dateKey] || 0) + 1;
      }
    });

    // Generate daily activity chart data for the last 7 days
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      last7DaysData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completions: dailyActivity[dateKey] || 0,
        keys: keysByDay[dateKey] || 0
      });
    }

    // Prepare checkpoint type data for pie chart
    const checkpointTypeData = Object.entries(checkpointTypeBreakdown).map(([type, count]) => ({
      name: type,
      value: count
    }));

    const processedStats = {
      keys: {
        total: keys.length,
        active: activeKeys,
        expired: expiredKeys,
        recent: recentKeys
      },
      checkpoints: {
        total: totalCheckpointCompletions,
        recent: recentCheckpointCompletions,
        typeBreakdown: checkpointTypeBreakdown,
        typeData: checkpointTypeData
      },
      charts: {
        dailyActivity: last7DaysData
      }
    };

    setStatistics(processedStats);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  if (isLoading) {
    return (
      <motion.div 
        className="min-h-screen bg-[#0f1015] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <motion.div 
            className="inline-block w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-white text-lg">Loading statistics...</p>
        </div>
      </motion.div>
    );
  }

  if (!isAuthenticated || !keysystem) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">Error loading statistics</div>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-[#6366f1] text-white px-4 py-2 rounded hover:bg-[#5856eb] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-white">No statistics available</div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-[#0f1015]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="pt-8 px-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div>
                <h1 className="text-white text-2xl font-bold">{keysystem.name}</h1>
                <p className="text-gray-400 text-sm">Analytics & Statistics</p>
              </div>
            </div>
            <motion.span 
              className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                keysystem.active 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {keysystem.active ? 'Active' : 'Inactive'}
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Key Metrics Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 border border-[#6366f1]/30 rounded-xl p-6"
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Keys</p>
                  <p className="text-white text-2xl font-bold">{formatNumber(statistics.keys.total)}</p>
                </div>
                <div className="w-12 h-12 bg-[#6366f1]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#6366f1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-400">{statistics.keys.active}</span>
                <span className="text-gray-400 mx-2">active</span>
                <span className="text-red-400">{statistics.keys.expired}</span>
                <span className="text-gray-400 ml-2">expired</span>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-[#10b981]/20 to-[#059669]/20 border border-[#10b981]/30 rounded-xl p-6"
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Keys</p>
                  <p className="text-white text-2xl font-bold">{formatNumber(statistics.keys.active)}</p>
                </div>
                <div className="w-12 h-12 bg-[#10b981]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-300">Recent Keys (7 days)</span>
                <span className="text-[#10b981] font-bold ml-2">{statistics.keys.recent}</span>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-[#f59e0b]/20 to-[#d97706]/20 border border-[#f59e0b]/30 rounded-xl p-6"
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Completions</p>
                  <p className="text-white text-2xl font-bold">{formatNumber(statistics.checkpoints.total)}</p>
                </div>
                <div className="w-12 h-12 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-300">Recent (7 days)</span>
                <span className="text-[#f59e0b] font-bold ml-2">{statistics.checkpoints.recent}</span>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-[#8b5cf6]/20 to-[#7c3aed]/20 border border-[#8b5cf6]/30 rounded-xl p-6"
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Checkpoints</p>
                  <p className="text-white text-2xl font-bold">{keysystem.checkpoints?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-300">Configured steps</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Charts Section */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Daily Activity Chart */}
            <motion.div 
              className="bg-black/20 border border-white/10 rounded-xl p-6"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-white text-lg font-semibold mb-4">Daily Activity & Keys (Last 7 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statistics.charts.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="completions" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      name="Completions"
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="keys" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Keys Created"
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Checkpoint Types Breakdown */}
            <motion.div 
              className="bg-black/20 border border-white/10 rounded-xl p-6"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-white text-lg font-semibold mb-4">Checkpoint Types</h3>
              <div className="h-64">
                {statistics.checkpoints.typeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statistics.checkpoints.typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statistics.checkpoints.typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">No checkpoint data available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Additional Statistics */}
          <motion.div 
            className="bg-black/20 border border-white/10 rounded-xl p-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-white text-lg font-semibold mb-4">Keysystem Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Max Keys Per Person</p>
                <p className="text-white text-xl font-bold">{keysystem.maxKeyPerPerson}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Key Timer</p>
                <p className="text-white text-xl font-bold">{keysystem.keyTimer}h</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Created</p>
                <p className="text-white text-xl font-bold">
                  {keysystem.createdAt ? new Date(keysystem.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
