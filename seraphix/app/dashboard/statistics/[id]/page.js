'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function KeysystemStatistics() {
  const router = useRouter();
  const params = useParams();
  const keysystemId = params.id;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [keysystemInfo, setKeysystemInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState('daily');

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

    fetchStatistics(token);
  }, [keysystemId, router]);

  const fetchStatistics = async (token) => {
    try {
      const response = await fetch(`/api/v1/keysystems/statistics?keysystemId=${keysystemId}`, {
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
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();

      if (data.success) {
        setStatistics(data.statistics);
        setKeysystemInfo(data.keysystem);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to fetch statistics data');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const pieColors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex items-center justify-center">
        <div className="text-center">
          <motion.div 
            className="inline-block w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-white text-lg">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !statistics) {
    return null;
  }

  return (
    <motion.div 
      className="min-h-screen bg-[#0f1015]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="pt-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div>
                <h1 className="text-white text-xl font-medium">
                  {keysystemInfo?.name} Statistics
                </h1>
                <p className="text-gray-400 text-sm">
                  Comprehensive analytics and insights
                </p>
              </div>
            </div>
            <motion.div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                keysystemInfo?.active 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {keysystemInfo?.active ? 'Active' : 'Inactive'}
            </motion.div>
          </div>
        </div>
      </div>

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
                  <p className="text-gray-400 text-sm">Total Sessions</p>
                  <p className="text-white text-2xl font-bold">{formatNumber(statistics.sessions.total)}</p>
                </div>
                <div className="w-12 h-12 bg-[#10b981]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-400">{statistics.sessions.completed}</span>
                <span className="text-gray-400 mx-2">completed</span>
                <span className="text-red-400">{statistics.sessions.failed}</span>
                <span className="text-gray-400 ml-2">failed</span>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-[#f59e0b]/20 to-[#d97706]/20 border border-[#f59e0b]/30 rounded-xl p-6"
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Success Rate</p>
                  <p className="text-white text-2xl font-bold">{statistics.sessions.completion_rate}%</p>
                </div>
                <div className="w-12 h-12 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-black/30 rounded-full h-2">
                  <motion.div 
                    className="bg-[#f59e0b] h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${statistics.sessions.completion_rate}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-[#8b5cf6]/20 to-[#7c3aed]/20 border border-[#8b5cf6]/30 rounded-xl p-6"
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Recent Keys</p>
                  <p className="text-white text-2xl font-bold">{formatNumber(statistics.keys.recent)}</p>
                </div>
                <div className="w-12 h-12 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-gray-400 text-sm">Last 7 days</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Chart Navigation */}
          <motion.div 
            className="bg-black/20 border border-white/10 rounded-xl p-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'daily', label: 'Daily Overview', icon: '📈' },
                { id: 'hourly', label: 'Hourly Activity', icon: '⏰' },
                { id: 'checkpoints', label: 'Checkpoint Performance', icon: '🎯' },
                { id: 'distribution', label: 'Key Distribution', icon: '📊' }
              ].map((chart) => (
                <motion.button
                  key={chart.id}
                  onClick={() => setActiveChart(chart.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeChart === chart.id
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-black/30 text-gray-400 hover:text-white hover:bg-black/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="mr-2">{chart.icon}</span>
                  {chart.label}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeChart}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-80"
              >
                {activeChart === 'daily' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statistics.daily_stats}>
                      <defs>
                        <linearGradient id="keysGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151', 
                          borderRadius: '8px',
                          color: '#ffffff'
                        }} 
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="keys" 
                        stroke="#6366f1" 
                        fillOpacity={1} 
                        fill="url(#keysGradient)" 
                        name="Keys Created"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#sessionsGradient)" 
                        name="Sessions Completed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {activeChart === 'hourly' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.hourly_stats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="#9ca3af"
                        tickFormatter={(value) => `${value}:00`}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151', 
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                        labelFormatter={(value) => `Hour: ${value}:00`}
                      />
                      <Bar dataKey="keys" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Keys Created" />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {activeChart === 'checkpoints' && statistics.checkpoint_stats.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.checkpoint_stats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151', 
                          borderRadius: '8px',
                          color: '#ffffff'
                        }} 
                      />
                      <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completions" />
                      <Bar dataKey="completion_rate" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Completion Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {activeChart === 'distribution' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active Keys', value: statistics.keys.active },
                          { name: 'Expired Keys', value: statistics.keys.expired },
                          { name: 'Completed Sessions', value: statistics.sessions.completed },
                          { name: 'Failed Sessions', value: statistics.sessions.failed }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Active Keys', value: statistics.keys.active },
                          { name: 'Expired Keys', value: statistics.keys.expired },
                          { name: 'Completed Sessions', value: statistics.sessions.completed },
                          { name: 'Failed Sessions', value: statistics.sessions.failed }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151', 
                          borderRadius: '8px',
                          color: '#ffffff'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {activeChart === 'checkpoints' && statistics.checkpoint_stats.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">No checkpoints configured for this keysystem</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Detailed Text Statistics */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Keys Breakdown */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Keys Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-300">Total Keys Created</span>
                  <span className="text-white font-bold">{statistics.keys.total}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                  <span className="text-gray-300">Active Keys</span>
                  <span className="text-green-400 font-bold">{statistics.keys.active}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                  <span className="text-gray-300">Expired Keys</span>
                  <span className="text-red-400 font-bold">{statistics.keys.expired}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg">
                  <span className="text-gray-300">Recent Keys (7 days)</span>
                  <span className="text-purple-400 font-bold">{statistics.keys.recent}</span>
                </div>
              </div>
            </div>

            {/* Sessions Breakdown */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Sessions Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-300">Total Sessions</span>
                  <span className="text-white font-bold">{statistics.sessions.total}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                  <span className="text-gray-300">Completed Sessions</span>
                  <span className="text-green-400 font-bold">{statistics.sessions.completed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                  <span className="text-gray-300">Failed Sessions</span>
                  <span className="text-red-400 font-bold">{statistics.sessions.failed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                  <span className="text-gray-300">Success Rate</span>
                  <span className="text-blue-400 font-bold">{statistics.sessions.completion_rate}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
