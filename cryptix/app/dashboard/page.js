'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingKeysystem, setEditingKeysystem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKeysystem, setDeletingKeysystem] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    maxKeyPerPerson: 1,
    keyTimer: 12,
    keyCooldown: 10,
    webhookUrl: ''
  });
  const [editFormData, setEditFormData] = useState({
    maxKeyPerPerson: 1,
    keyTimer: 12,
    keyCooldown: 10,
    active: true,
    webhookUrl: ''
  });
  const [activeTab, setActiveTab] = useState('keysystems');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Fetching Your Data...');
  const [lootlabsApiKey, setLootlabsApiKey] = useState('');
  const [showLootlabsKey, setShowLootlabsKey] = useState(false);
  const [lootlabsKeyChanged, setLootlabsKeyChanged] = useState(false);
  const [isSavingLootlabsKey, setIsSavingLootlabsKey] = useState(false);
  const [showLinkvertiseToken, setShowLinkvertiseToken] = useState(false);
  const [linkvertiseApiToken, setLinkvertiseApiToken] = useState('');
  const [linkvertiseTokenChanged, setLinkvertiseTokenChanged] = useState(false);
  const [isSavingLinkvertiseToken, setIsSavingLinkvertiseToken] = useState(false);

  // Keys management state
  const [selectedKeysystemForKeys, setSelectedKeysystemForKeys] = useState('');
  const [keysData, setKeysData] = useState([]);
  const [keysPagination, setKeysPagination] = useState(null);
  const [currentKeysPage, setCurrentKeysPage] = useState(1);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState(false);
  const [showDeleteKeyModal, setShowDeleteKeyModal] = useState(false);
  const [deletingKeyValue, setDeletingKeyValue] = useState(null);
  
  const [apiToken, setApiToken] = useState(null);
  const [showApiToken, setShowApiToken] = useState(false);
  const [generatingApiToken, setGeneratingApiToken] = useState(false);

  // Create keys state
  const [showCreateKeysModal, setShowCreateKeysModal] = useState(false);
  const [createKeysData, setCreateKeysData] = useState({
    amount: 1,
    expirationHours: null
  });
  const [isCreatingKeys, setIsCreatingKeys] = useState(false);
  const [createdKeysResult, setCreatedKeysResult] = useState(null);

  useEffect(() => {
    // Check authentication and fetch profile
    const token = localStorage.getItem('cryptix_jwt');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserProfile(token);
  }, [router]);

  

  const fetchUserProfile = async (token) => {
    try {
      // Simulate smooth loading progress
      setLoadingProgress(20);
      setLoadingText('Authenticating...');

      await new Promise(resolve => setTimeout(resolve, 300));
      setLoadingProgress(40);

      const response = await fetch('/api/v1/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setLoadingProgress(60);
      setLoadingText('Loading Profile...');
      await new Promise(resolve => setTimeout(resolve, 200));

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, redirect to login
          localStorage.removeItem('cryptix_jwt');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setLoadingProgress(80);
      setLoadingText('Preparing Dashboard...');
      await new Promise(resolve => setTimeout(resolve, 300));

      if (data.success) {
        setUserProfile(data.customer);
        setIsAuthenticated(true);
        // Set integration values using the fetched data directly
        if (data.customer?.integrations?.lootlabs) {
          setLootlabsApiKey(data.customer.integrations.lootlabs);
        }
        if (data.customer?.integrations?.linkvertise) {
          setLinkvertiseApiToken(data.customer.integrations.linkvertise);
        }
        setLoadingProgress(100);
        setLoadingText('Initializing Dashboard');
        await new Promise(resolve => setTimeout(resolve, 400));
      } else {
        throw new Error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
      setLoadingText('Error occurred, loading limited view...');
      // If there's an error, still allow them to see the dashboard with limited functionality
      setIsAuthenticated(true);
    } finally {
      setTimeout(() => setIsLoading(false), 200);
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        className="min-h-screen bg-[#0f1015] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-md px-8">
          {/* Loading Text */}
          <motion.div 
            className="text-center mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div 
              className="text-white text-lg font-medium mb-2"
              key={loadingText}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {loadingText}
            </motion.div>
            <div className="text-gray-400 text-sm">
              Please wait while we prepare your workspace
            </div>
          </motion.div>

          {/* Progress Bar Container */}
          <motion.div 
            className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Animated Progress Bar */}
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </motion.div>

            {/* Progress Glow */}
            <motion.div 
              className="absolute top-0 left-0 h-full bg-[#6366f1]/50 rounded-full blur-sm"
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            ></motion.div>
          </motion.div>

          {/* Progress Percentage */}
          <motion.div 
            className="text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <motion.span 
              className="text-gray-300 text-sm font-mono"
              key={loadingProgress}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {loadingProgress}%
            </motion.span>
          </motion.div>

          {/* Progress Dots */}
          <motion.div 
            className="flex justify-center space-x-2 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {[0, 150, 300].map((delay, index) => (
              <motion.div 
                key={index}
                className="w-2 h-2 bg-[#6366f1] rounded-full"
                animate={{ 
                  y: [0, -8, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: delay / 1000,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </div>

        <style jsx>{`
          @keyframes loading-progress {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </motion.div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const username = userProfile?.username || 'User';
  const keysystems = userProfile?.keysystems || [];

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateKeysystem = async () => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to create keysystem');
        return;
      }

      showToast('Keysystem created successfully!', 'success');
      setShowModal(false);
      setFormData({
        name: '',
        maxKeyPerPerson: 1,
        keyTimer: 12,
        keyCooldown: 10,
        webhookUrl: ''
      });

      // Refresh the page to show the new keysystem
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      showToast(error.message || 'An error occurred while creating the keysystem');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditKeysystem = (keysystem) => {
    setEditingKeysystem(keysystem);
    setEditFormData({
      maxKeyPerPerson: keysystem.maxKeyPerPerson,
      keyTimer: keysystem.keyTimer,
      keyCooldown: keysystem.keyCooldown,
      active: keysystem.active,
      webhookUrl: keysystem.webhookUrl || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateKeysystem = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: editingKeysystem.id,
          ...editFormData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to update keysystem');
        return;
      }

      showToast('Keysystem updated successfully!', 'success');
      setShowEditModal(false);
      setEditingKeysystem(null);

      // Refresh the page to show the updated keysystem
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      showToast(error.message || 'An error occurred while updating the keysystem');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteKeysystem = (keysystem) => {
    setDeletingKeysystem(keysystem);
    setShowDeleteModal(true);
  };

  const confirmDeleteKeysystem = async () => {
    if (!deletingKeysystem) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: deletingKeysystem.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to delete keysystem');
        return;
      }

      showToast('Keysystem deleted successfully!', 'success');
      setShowDeleteModal(false);
      setDeletingKeysystem(null);

      // Refresh the page to show the changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      showToast(error.message || 'An error occurred while deleting the keysystem');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveLootlabsKey = async () => {
    setIsSavingLootlabsKey(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/users/integrations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integration: 'lootlabs',
          value: lootlabsApiKey
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to save Lootlabs API key');
        return;
      }

      showToast('Lootlabs API key saved successfully!', 'success');
      setLootlabsKeyChanged(false);

      // Update the user profile with the new integration
      setUserProfile(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          lootlabs: lootlabsApiKey
        }
      }));

    } catch (error) {
      showToast(error.message || 'An error occurred while saving the API key');
    } finally {
      setIsSavingLootlabsKey(false);
    }
  };

  const handleSaveLinkvertiseToken = async () => {
    setIsSavingLinkvertiseToken(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/users/integrations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integration: 'linkvertise',
          value: linkvertiseApiToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to save Linkvertise API token');
        return;
      }

      showToast('Linkvertise API token saved successfully!', 'success');
      setLinkvertiseTokenChanged(false);

      // Update the user profile with the new integration
      setUserProfile(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          linkvertise: linkvertiseApiToken
        }
      }));

    } catch (error) {
      showToast(error.message || 'An error occurred while saving the API token');
    } finally {
      setIsSavingLinkvertiseToken(false);
    }
  };

  const handleGenerateApiToken = async () => {
    setGeneratingApiToken(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/users/api-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setApiToken(data.api_token);
        setShowApiToken(true);
        // Update user profile with new token info
        setUserProfile(prev => ({
          ...prev,
          api_token: data.api_token,
          has_api_token: true
        }));
        showToast('API token generated successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to generate API token');
      }
    } catch (error) {
      showToast(error.message || 'Failed to generate API token');
    } finally {
      setGeneratingApiToken(false);
    }
  };

  const handleRevokeApiToken = async () => {
    if (!confirm('Are you sure you want to revoke your API token? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/users/api-token', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setApiToken(null);
        setShowApiToken(false);
        // Refresh customer data to update token status
        // await fetchCustomerData(); // removed as function fetchCustomerData is not available
        showToast('API token revoked successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to revoke API token');
      }
    } catch (error) {
      showToast(error.message || 'Failed to revoke API token');
    }
    finally {
      setGeneratingApiToken(false);
    }
  };

  const handleCopyApiToken = async (apiToken) => {
    if (!apiToken) return;

    try {
      await navigator.clipboard.writeText(apiToken);
      showToast('API token copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy API token', 'error');
    }
  };

  // Keys management functions
  const fetchKeysData = async (keysystemId, page = 1) => {
    if (!keysystemId) return;

    setIsLoadingKeys(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const params = new URLSearchParams({
        keysystemId,
        page: page.toString()
      });

      const response = await fetch(`/api/v1/keysystems/keys/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to fetch keys');
        return;
      }

      setKeysData(data.keys || []);
      setKeysPagination(data.pagination);

    } catch (error) {
      showToast(error.message || 'An error occurred while fetching keys');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  

  const handleKeysPageChange = (newPage) => {
    setCurrentKeysPage(newPage);
    fetchKeysData(selectedKeysystemForKeys, newPage);
  };

  const handleDeleteKeyFromDashboard = (keyValue) => {
    setDeletingKeyValue(keyValue);
    setShowDeleteKeyModal(true);
  };

  const confirmDeleteKey = async () => {
    if (!deletingKeyValue) return;

    setIsDeletingKey(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/keys/delete-owner', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: selectedKeysystemForKeys,
          keyValue: deletingKeyValue
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to delete key');
        return;
      }

      showToast('Key deleted successfully!', 'success');
      setShowDeleteKeyModal(false);
      setDeletingKeyValue(null);

      // Refresh the keys data
      fetchKeysData(selectedKeysystemForKeys, currentKeysPage);

    } catch (error) {
      showToast(error.message || 'An error occurred while deleting the key');
    } finally {
      setIsDeletingKey(false);
    }
  };

  const getTimeLeft = (expiresAt) => {
    if (!expiresAt) return 'N/A';

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  const handleCopyKey = async (keyValue) => {
    if (!keyValue) return;

    try {
      await navigator.clipboard.writeText(keyValue);
      showToast('Key copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy key', 'error');
    }
  };

  const handleCreateKeys = async () => {
    if (!selectedKeysystemForKeys) {
      showToast('Please select a keysystem first', 'error');
      return;
    }

    setIsCreatingKeys(true);
    try {
      const token = localStorage.getItem('cryptix_jwt');
      const response = await fetch('/api/v1/keysystems/keys/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keysystemId: selectedKeysystemForKeys,
          amount: parseInt(createKeysData.amount),
          expirationHours: createKeysData.expirationHours === '' ? null : parseInt(createKeysData.expirationHours)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to create keys');
        return;
      }

      setCreatedKeysResult(data);
      showToast(`Successfully created ${data.keysCreated} key(s)!`, 'success');

      // Refresh keys data
      fetchKeysData(selectedKeysystemForKeys, currentKeysPage);

    } catch (error) {
      showToast(error.message || 'An error occurred while creating keys');
    } finally {
      setIsCreatingKeys(false);
    }
  };

  const handleCopyAllKeys = async () => {
    if (!createdKeysResult?.keys) return;

    try {
      const keysList = createdKeysResult.keys.map(key => key.value).join('\n');
      await navigator.clipboard.writeText(keysList);
      showToast('All keys copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy keys', 'error');
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#0f1015]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Profile Section (Navbar) */}
      <motion.div 
        className="pt-8 px-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Profile Avatar with first letter */}
              <motion.div 
                className="w-8 h-8 bg-[#2a2d47] rounded-full flex items-center justify-center border border-white/10"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-white font-medium text-sm">
                  {username.charAt(0).toUpperCase()}
                </span>
              </motion.div>

              <div className="flex items-center space-x-3">
                <h1 className="text-white text-lg font-medium">
                  {username}'s Dashboard
                </h1>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-3"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.button 
                onClick={() => setShowModal(true)}
                className="hidden md:block bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                New
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="px-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="border-b border-white/10">
            <nav className="flex space-x-8 overflow-x-auto">
              {[
                { id: 'keysystems', label: 'Keysystems' },
                { id: 'statistics', label: 'Statistics' },
                { id: 'keys', label: 'Keys' },
                { id: 'store', label: 'Store' },
                { id: 'api', label: 'API' },
                { id: 'integrations', label: 'Integrations' },
                { id: 'documentation', label: 'Documentation' },
                { id: 'settings', label: 'Settings' }
              ].map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#1c1c1c] text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  {tab.label}
                </motion.button>
              ))}
            </nav>
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div 
        className="px-8 py-16"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'keysystems' && (
              <motion.div 
                key="keysystems"
                className="bg-transparent rounded-lg border border-white/10 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="flex items-center justify-between mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-white text-xl font-semibold">Your Keysystems</h2>
                  <motion.button 
                    onClick={() => setShowModal(true)}
                    className="md:hidden bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    New
                  </motion.button>
                </motion.div>

                {error && (
                  <motion.div 
                    className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-red-400 text-sm">
                      Error loading profile data: {error}
                    </p>
                  </motion.div>
                )}

                {keysystems.length === 0 ? (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <p className="text-gray-400 text-base">
                      No Key Systems In Your Account, Click The "New" Button To Create One.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {keysystems.map((keysystem, index) => (
                      <motion.div 
                        key={index} 
                        className="bg-black/20 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all group"
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: 0.4 + index * 0.1,
                          type: "spring",
                          stiffness: 100
                        }}
                        whileHover={{ 
                          y: -5,
                          scale: 1.02,
                          transition: { duration: 0.2 }
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <motion.button
                              onClick={() => router.push(`/dashboard/scripts/${keysystem.id}`)}
                              className="text-white font-medium text-sm hover:text-[#6366f1] transition-colors text-left truncate block w-full"
                              whileHover={{ x: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              {keysystem.name || `Keysystem ${index + 1}`}
                            </motion.button>
                            <p className="text-gray-400 text-xs font-mono mt-1">
                              {keysystem.id ? keysystem.id.substring(0, 16) + '...' : 'N/A'}
                            </p>
                          </div>
                          
<motion.span 
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                              keysystem.active 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
                          >
                            {keysystem.active ? 'Active' : 'Inactive'}
                          </motion.span>
                        </div>

                        {/* Stats */}
                        <motion.div 
                          className="space-y-2 mb-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Max Keys</span>
                            <span className="text-white">{keysystem.maxKeyPerPerson || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Timer</span>
                            <span className="text-white">
                              {keysystem.keyTimer || 0}h
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Created</span>
                            <span className="text-white">
                              {keysystem.createdAt ? new Date(keysystem.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </motion.div>

                        {/* Actions */}
                        <motion.div 
                          className="flex space-x-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                        >
                          <motion.button 
                            onClick={() => handleEditKeysystem(keysystem)}
                            className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-2 rounded text-xs font-medium transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Edit
                          </motion.button>
                          <motion.button 
                            onClick={() => handleDeleteKeysystem(keysystem)}
                            disabled={isDeleting}
                            className="flex-1 border border-red-500/50 text-red-400 hover:text-red-300 hover:border-red-400 px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Delete
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'statistics' && (
              <motion.div 
                key="statistics"
                className="bg-transparent rounded-lg border border-white/10 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-white text-xl font-semibold mb-6">Statistics</h2>
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <p className="text-gray-400 text-base">
                    Statistics dashboard coming soon...
                  </p>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'keys' && (
              <motion.div 
                key="keys"
                className="bg-transparent rounded-lg border border-white/10 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-white text-xl font-semibold mb-6">Keys Management</h2>

                {/* Keysystem Selection */}
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between sm:space-x-4">
                    <div className="flex-1">
                      <label className="block text-white text-sm font-medium mb-2">
                        Select Keysystem
                      </label>
                      <motion.select
                        value={selectedKeysystemForKeys}
                        onChange={(e) => {
                          setSelectedKeysystemForKeys(e.target.value);
                          setCurrentKeysPage(1);
                          if (e.target.value) {
                            fetchKeysData(e.target.value, 1);
                          } else {
                            setKeysData([]);
                            setKeysPagination(null);
                          }
                        }}
                        className="w-full max-w-md bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white focus:border-[#6366f1] focus:outline-none transition-colors"
                        whileFocus={{ scale: 1.02 }}
                      >
                        <option value="">Choose a keysystem...</option>
                        {keysystems.map((ks) => (
                          <option key={ks.id} value={ks.id}>
                            {ks.name}
                          </option>
                        ))}
                      </motion.select>
                    </div>

                    {selectedKeysystemForKeys && (
                      <motion.button
                        onClick={() => setShowCreateKeysModal(true)}
                        className="mt-4 sm:mt-0 bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        Create Keys
                      </motion.button>
                    )}
                  </div>
                </motion.div>

                {selectedKeysystemForKeys && (
                  <>
                    

                    {/* Keys Count */}
                    {keysPagination && (
                      <motion.div 
                        className="mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <p className="text-gray-400 text-sm">
                          Total Keys: <span className="text-white font-medium">{keysPagination.totalKeys}</span>
                        </p>
                      </motion.div>
                    )}

                    {/* Keys Table */}
                    {isLoadingKeys ? (
                      <motion.div 
                        className="text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div 
                          className="inline-block w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <p className="text-gray-400 text-sm mt-2">Loading keys...</p>
                      </motion.div>
                    ) : keysData.length > 0 ? (
                      <>
                        <motion.div 
                          className="overflow-x-auto"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left text-white font-medium py-2 px-1 w-20">Key</th>
                                <th className="text-left text-white font-medium py-2 px-1 w-16">Status</th>
                                <th className="text-left text-white font-medium py-2 px-1 hidden md:table-cell w-32">Created</th>
                                <th className="text-left text-white font-medium py-2 px-1 w-24">Time Left</th>
                                <th className="text-left text-white font-medium py-2 px-1 hidden lg:table-cell w-20">Session</th>
                                <th className="text-left text-white font-medium py-2 px-1 w-16">HWID</th>
                                <th className="text-left text-white font-medium py-2 px-1 w-16">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {keysData.map((key, index) => {
                                const isExpired = new Date(key.expires_at) <= new Date();
                                const timeLeft = getTimeLeft(key.expires_at);

                                return (
                                  <motion.tr 
                                    key={index} 
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                  >
                                    <td className="py-2 px-1">
                                      <div className="flex items-center space-x-1">
                                        <motion.button
                                          onClick={() => handleCopyKey(key.value)}
                                          className="text-white font-mono hover:text-[#6366f1] transition-colors text-left"
                                          title="Click to copy full key"
                                          whileHover={{ x: 2 }}
                                        >
                                          {key.value ? `${key.value.substring(0, 6)}...` : 'N/A'}
                                        </motion.button>
                                        <motion.button
                                          onClick={() => handleCopyKey(key.value)}
                                          className="text-gray-400 hover:text-white transition-colors"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                        </motion.button>
                                      </div>
                                    </td>
                                    <td className="py-2 px-1">
                                      
<motion.span 
                                        className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                                          isExpired 
                                            ? 'bg-red-500/20 text-red-400' 
                                            : 'bg-green-500/20 text-green-400'
                                        }`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: index * 0.05 + 0.2 }}
                                      >
                                        {isExpired ? 'Exp' : 'Act'}
                                      </motion.span>
                                    </td>
                                    <td className="py-2 px-1 hidden md:table-cell">
                                      <span className="text-gray-300">
                                        {key.created_at ? new Date(key.created_at).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-1">
                                      <span className={`${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                                        {timeLeft}
                                      </span>
                                    </td>
                                    <td className="py-2 px-1 hidden lg:table-cell">
                                      <span className="text-gray-300 font-mono">
                                        {key.session_id ? `${key.session_id.substring(0, 6)}...` : 'N/A'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-1">
                                      {key.hwid ? (
                                        <div className="flex items-center space-x-1">
                                          <motion.span 
                                            className="w-2 h-2 bg-green-400 rounded-full"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                          />
                                          <span className="text-gray-300 font-mono hidden sm:inline">
                                            {key.hwid.substring(0, 4)}...
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-500">-</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-1">
                                      <motion.button
                                        onClick={() => handleDeleteKeyFromDashboard(key.value)}
                                        disabled={isDeletingKey}
                                        className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete key"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </motion.button>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </motion.div>

                        {/* Pagination */}
                        {keysPagination && keysPagination.totalPages > 1 && (
                          <motion.div 
                            className="mt-6 flex items-center justify-between"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                          >
                            <div className="text-sm text-gray-400">
                              Page {keysPagination.currentPage} of {keysPagination.totalPages}
                            </div>
                            <div className="flex space-x-2">
                              <motion.button
                                onClick={() => handleKeysPageChange(currentKeysPage - 1)}
                                disabled={currentKeysPage === 1}
                                className="px-3 py-1 bg-[#2a2d47] border border-white/10 rounded text-white text-sm hover:bg-[#3a3d57] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Previous
                              </motion.button>
                              <motion.button
                                onClick={() => handleKeysPageChange(currentKeysPage + 1)}
                                disabled={currentKeysPage === keysPagination.totalPages}
                                className="px-3 py-1 bg-[#2a2d47] border border-white/10 rounded text-white text-sm hover:bg-[#3a3d57] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Next
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </>
                    ) : (
                      <motion.div 
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        <p className="text-gray-400 text-base">
                          No keys found for this keysystem.
                        </p>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'store' && (
              <motion.div 
                key="store"
                className="bg-transparent rounded-lg border border-white/10 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-white text-xl font-semibold mb-6">Store</h2>
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <p className="text-gray-400 text-base">
                    Store functionality coming soon...
                  </p>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'api' && (
              <motion.div 
                key="api"
                className="bg-transparent rounded-lg border border-white/10 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-white text-xl font-semibold mb-6">API Documentation</h2>
                <motion.div 
                  className="bg-black/20 rounded-lg p-6 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white text-lg font-medium">API Token</h3>
                      <p className="text-gray-400 text-sm">Generate and manage your API token for secure access.</p>
                    </div>
                  </div>
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {userProfile?.api_token && (
                      <motion.div 
                        className="mb-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <p className="text-gray-400 text-sm mb-2">
                          Your API token:
                        </p>
                        <div className="relative">
                          <input
                            type="text"
                            value={userProfile.api_token}
                            readOnly
                            className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white font-mono text-sm focus:border-[#6366f1] focus:outline-none transition-colors"
                          />
                        </div>
                      </motion.div>
                    )}

                    <motion.div 
                      className="flex items-center space-x-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <motion.button
                        onClick={handleGenerateApiToken}
                        disabled={generatingApiToken}
                        className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {generatingApiToken ? 'Generating...' : (userProfile?.api_token ? 'Generate New Token' : 'Generate API Token')}
                      </motion.button>

                      {userProfile?.api_token && (
                        <motion.button
                          onClick={() => handleCopyApiToken(userProfile.api_token)}
                          className="border border-white/20 text-gray-300 hover:text-white hover:border-white/40 px-4 py-2 rounded text-sm transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Copy Token
                        </motion.button>
                      )}
                    </motion.div>

                    {userProfile?.api_token && (
                      <motion.p 
                        className="text-yellow-400 text-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                      >
                        ⚠️ Store this token securely. Generating a new token will invalidate the current one.
                      </motion.p>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'integrations' && (
              <motion.div 
                key="integrations"
                className="bg-transparent rounded-lg border border-white/10 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-white text-xl font-semibold mb-6">Integrations</h2>

                {/* Lootlabs Integration */}
                <div className="space-y-6">
                  <motion.div 
                    className="bg-black/20 rounded-lg p-6 border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="mb-4">
                      <div>
                        <h3 className="text-white text-lg font-medium">Lootlabs</h3>
                        <p className="text-gray-400 text-sm">Configure your Lootlabs API integration</p>
                      </div>
                    </div>

                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            type={showLootlabsKey ? "text" : "password"}
                            value={lootlabsApiKey}
                            onChange={(e) => {
                              setLootlabsApiKey(e.target.value);
                              setLootlabsKeyChanged(true);
                            }}
                            placeholder={userProfile?.integrations?.lootlabs ? "••••••••••••••••" : "Enter your Lootlabs API key"}
                            className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors pr-10"
                          />
                          <motion.button
                            type="button"
                            onClick={() => setShowLootlabsKey(!showLootlabsKey)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {showLootlabsKey ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </motion.button>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          Your Lootlabs API key for checkpoint verification
                        </p>
                      </div>

                      <AnimatePresence>
                        {lootlabsKeyChanged && (
                          <motion.div 
                            className="flex items-center space-x-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <motion.button
                              onClick={handleSaveLootlabsKey}
                              disabled={isSavingLootlabsKey}
                              className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isSavingLootlabsKey ? 'Saving...' : 'Save API Key'}
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                setLootlabsApiKey(userProfile?.integrations?.lootlabs || '');
                                setLootlabsKeyChanged(false);
                              }}
                              className="border border-white/20 text-gray-300 hover:text-white hover:border-white/40 px-4 py-2 rounded text-sm transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Cancel
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>

                  {/* Linkvertise Integration */}
                  <motion.div 
                    className="bg-black/20 rounded-lg p-6 border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white text-lg font-medium">Linkvertise</h3>
                        <p className="text-gray-400 text-sm">Configure your Linkvertise API integration</p>
                      </div>
                    </div>

                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          API Token
                        </label>
                        <div className="relative">
                          <input
                            type={showLinkvertiseToken ? "text" : "password"}
                            value={linkvertiseApiToken}
                            onChange={(e) => {
                              setLinkvertiseApiToken(e.target.value);
                              setLinkvertiseTokenChanged(true);
                            }}
                            placeholder={userProfile?.integrations?.linkvertise ? "••••••••••••••••" : "Enter your Linkvertise API token"}
                            className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors pr-10"
                          />
                          <motion.button
                            type="button"
                            onClick={() => setShowLinkvertiseToken(!showLinkvertiseToken)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray400 hover:text-white transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {showLinkvertiseToken ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </motion.button>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          Your Linkvertise API token for anti-bypass verification
                        </p>
                      </div>

                      <AnimatePresence>
                        {linkvertiseTokenChanged && (
                          <motion.div 
                            className="flex items-center space-x-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <motion.button
                              onClick={handleSaveLinkvertiseToken}
                              disabled={isSavingLinkvertiseToken}
                              className="bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isSavingLinkvertiseToken ? 'Saving...' : 'Save API Token'}
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                setLinkvertiseApiToken(userProfile?.integrations?.linkvertise || '');
                                setLinkvertiseTokenChanged(false);
                              }}
                              className="border border-white/20 text-gray-300 hover:text-white hover:border-white/40 px-4 py-2 rounded text-sm transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Cancel
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === 'documentation' && (
              <motion.div 
                key="documentation"
                className="bg-transparent rounded-lg border border-white/10 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-white text-xl font-semibold mb-6">Documentation</h2>
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <p className="text-gray-400 text-base">
                    Comprehensive documentation coming soon...
                  </p>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                className="bg-transparent rounded-lg border border-white/10 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-white text-xl font-semibold mb-6">Settings</h2>
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <p className="text-gray-400 text-base">
                    Account and application settings coming soon...
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Create Keysystem Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-[#1a1b2e] border border-white/10 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="p-4 sm:p-6">
                <motion.div 
                  className="flex items-center justify-between mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <h3 className="text-white text-lg font-semibold">Create New Keysystem</h3>
                  <motion.button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </motion.div>

                <motion.div 
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Name Field */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <label className="block text-white text-sm font-medium mb-2">
                        Keysystem Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter keysystem name"
                        className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                      />
                    </motion.div>

                    {/* Max Key Per Person */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <label className="block text-white text-sm font-medium mb-2">
                        Max Key Per Person
                      </label>
                      <input
                        type="number"
                        value={formData.maxKeyPerPerson}
                        onChange={(e) => handleInputChange('maxKeyPerPerson', e.target.value)}
                        className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                      />
                      <p className="text-gray-400 text-xs mt-1">This is the number of individual keys a person can create in one session</p>
                    </motion.div>
                    {/* Webhook URL Field */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <label className="block text-white text-sm font-medium mb-2">
                        Webhook URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.webhookUrl}
                        onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                      />
                    </motion.div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Key Timer */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <label className="block text-white text-sm font-medium mb-2">
                        Key Timer (Hours)
                      </label>
                      <input
                        type="number"
                        value={formData.keyTimer}
                        onChange={(e) => handleInputChange('keyTimer', e.target.value)}
                        className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                      />
                    </motion.div>

                    {/* Key Cooldown */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                    >
                      <label className="block text-white text-sm font-medium mb-2">
                        Key Cooldown (Minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.keyCooldown}
                        onChange={(e) => handleInputChange('keyCooldown', e.target.value)}
                        className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                      />
                      <p className="text-gray-400 text-xs mt-1">
                        This will be counted in minutes and its used to determine how much cooldown the user needs to go through before completing the checkpoints again
                      </p>
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex flex-col sm:flex-row  sm:space-x-3 mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                >
                  <motion.button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleCreateKeysystem}
                    disabled={isCreating}
                    className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Keysystem Modal */}
      <AnimatePresence>
        {showEditModal && editingKeysystem && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-[#1a1b2e] border border-white/10 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="p-4 sm:p-6">
                <motion.div 
                  className="flex items-center justify-between mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <h3 className="text-white text-lg font-semibold">Edit Keysystem: {editingKeysystem.name}</h3>
                  <motion.button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </motion.div>

                <motion.div 
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Status Toggle */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-white text-sm font-medium">
                          Active Status
                        </label>
                        <motion.button
                          onClick={() => handleEditInputChange('active', !editFormData.active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            editFormData.active ? 'bg-[#6366f1]' : 'bg-gray-600'
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.span
                            className="inline-block h-4 w-4 transform rounded-full bg-white"
                            animate={{
                              x: editFormData.active ? 24 : 4
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>
                      <p className="text-gray-400 text-xs">Toggle to enable/disable this keysystem</p>
                    </motion.div>

                    {/* Max Key Per Person */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <label className="block text-white text-sm font-medium mb-2">
                        Max Key Per Person
                      </label>
                      <input
                        type="number"
                        value={editFormData.maxKeyPerPerson}
                        onChange={(e) => handleEditInputChange('maxKeyPerPerson', e.target.value)}
                        className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                      />
                      <p className="text-gray-400 text-xs mt-1">This is the number of individual keys a person can create in one session</p>
                    </motion.div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Key Timer */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <label className="block text-white text-sm font-medium mb-2">
                        Key Timer (Hours)
                      </label>
                      <input
                        type="number"
                        value={editFormData.keyTimer}
                        onChange={(e) => handleEditInputChange('keyTimer', e.target.value)}
                        className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                      />
                    </motion.div>

                    {/* Key Cooldown */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <label className="block text-white text-sm font-medium mb-2">
                        Key Cooldown (Minutes)
                      </label>
                      <input
                        type="number"
                        value={editFormData.keyCooldown}
                        onChange={(e) => handleEditInputChange('keyCooldown', e.target.value)}
                        className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                      />
                      <p className="text-gray-400 text-xs mt-1">
                        This will be counted in minutes and its used to determine how much cooldown the user needs to go through before completing the checkpoints again
                      </p>
                    </motion.div>
                    {/* Webhook URL Field */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                    >
                      <label className="block text-white text-sm font-medium mb-2">
                        Webhook URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={editFormData.webhookUrl}
                        onChange={(e) => handleEditInputChange('webhookUrl', e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                      />
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex flex-col sm:flex-row sm:space-x-3 mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                >
                  <motion.button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleUpdateKeysystem}
                    disabled={isUpdating}
                    className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isUpdating ? 'Updating...' : 'Update'}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && deletingKeysystem && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-[#1a1b2e] border border-red-500/30 rounded-lg max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="p-6">
                <motion.div 
                  className="flex items-center justify-between mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.div>
                    <h3 className="text-white text-lg font-semibold">Delete Keysystem</h3>
                  </div>
                  <motion.button
                    onClick={() => setShowDeleteModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </motion.div>

                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <p className="text-gray-300 mb-2">
                    Are you sure you want to delete the keysystem:
                  </p>
                  <motion.p 
                    className="text-white font-medium bg-[#2a2a2a] px-3 py-2 rounded border border-white/10"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {deletingKeysystem.name}
                  </motion.p>
                  <motion.p 
                    className="text-red-400 text-sm mt-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    This action cannot be undone. All data associated with this keysystem will be permanently deleted.
                  </motion.p>
                </motion.div>

                <motion.div 
                  className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <motion.button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-1.5 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={confirmDeleteKeysystem}
                    disabled={isDeleting}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Keys Modal */}
      <AnimatePresence>
        {showCreateKeysModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-[#1a1b2e] border border-white/10 rounded-lg max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="p-6">
                <motion.div 
                  className="flex items-center justify-between mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <h3 className="text-white text-lg font-semibold">Create Keys</h3>
                  <motion.button
                    onClick={() => {
                      setShowCreateKeysModal(false);
                      setCreatedKeysResult(null);
                      setCreateKeysData({ amount: 1, expirationHours: null });
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </motion.div>

                {!createdKeysResult ? (
                  <>
                    <motion.div 
                      className="space-y-4 mb-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Number of Keys (1-100)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={createKeysData.amount}
                          onChange={(e) => setCreateKeysData(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Expiration Hours (1-750, max 1 month)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="750"
                          value={createKeysData.expirationHours || ''}
                          onChange={(e) => setCreateKeysData(prev => ({ ...prev, expirationHours: e.target.value }))}
                          placeholder="Default: Use keysystem timer"
                          className="w-full bg-[#2a2d47] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#6366f1] focus:outline-none transition-colors"
                        />
                        <p className="text-gray-400 text-xs mt-1">
                          Leave empty to use keysystem default ({keysystems.find(ks => ks.id === selectedKeysystemForKeys)?.keyTimer || 0}h)
                        </p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <motion.button
                        onClick={() => {
                          setShowCreateKeysModal(false);
                          setCreateKeysData({ amount: 1, expirationHours: null });
                        }}
                        disabled={isCreatingKeys}
                        className="flex-1 px-4 py-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={handleCreateKeys}
                        disabled={isCreatingKeys || !createKeysData.amount || createKeysData.amount < 1 || createKeysData.amount > 100}
                        className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isCreatingKeys ? 'Creating...' : 'Create Keys'}
                      </motion.button>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-4">
                      <motion.div 
                        className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                      <h4 className="text-white text-lg font-medium mb-2">Keys Created Successfully!</h4>
                      <p className="text-gray-400 text-sm">
                        Created {createdKeysResult.keysCreated} key(s) in session: {createdKeysResult.sessionId}
                      </p>
                    </div>

                    <motion.div 
                      className="flex space-x-2 mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <motion.button
                        onClick={handleCopyAllKeys}
                        className="flex-1 bg-[#6366f1] hover:bg-[#5856eb] text-white px-3 py-2 rounded text-sm transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Copy All Keys
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setShowCreateKeysModal(false);
                          setCreatedKeysResult(null);
                          setCreateKeysData({ amount: 1, expirationHours: null });
                        }}
                        className="flex-1 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 px-3 py-2 rounded text-sm transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Close
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Key Confirmation Modal */}
      <AnimatePresence>
        {showDeleteKeyModal && deletingKeyValue && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-[#1a1b2e] border border-red-500/30 rounded-lg max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="p-6">
                <motion.div 
                  className="flex items-center justify-between mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.div>
                    <h3 className="text-white text-lg font-semibold">Delete Key</h3>
                  </div>
                  <motion.button
                    onClick={() => setShowDeleteKeyModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </motion.div>

                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <p className="text-gray-300 mb-2">
                    Are you sure you want to delete this key?
                  </p>
                  <motion.p 
                    className="text-white font-mono text-sm bg-[#2a2a2a] px-3 py-2 rounded border border-white/10 break-all"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {deletingKeyValue}
                  </motion.p>
                  <motion.p 
                    className="text-red-400 text-sm mt-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    This action cannot be undone. The key will be permanently deleted.
                  </motion.p>
                </motion.div>

                <motion.div 
                  className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <motion.button
                    onClick={() => setShowDeleteKeyModal(false)}
                    disabled={isDeletingKey}
                    className="flex-1 px-3 py-1.5 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={confirmDeleteKey}
                    disabled={isDeletingKey}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isDeletingKey ? 'Deleting...' : 'Delete Key'}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            className="fixed top-4 right-4 z-50"
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 50 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <motion.div 
              className={`bg-black/80 backdrop-blur-md border rounded-lg px-4 py-3 max-w-sm ${
                toast.type === 'success' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
              }`}
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  {toast.type === 'success' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </motion.div>
                <span className="text-sm">{toast.message}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}