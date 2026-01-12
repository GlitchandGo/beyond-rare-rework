/**
 * Beyond Rare - API Client
 * Handles communication with the backend server
 */

const BeyondRareAPI = (function() {
  const BASE_URL = '/api';
  let authToken = localStorage.getItem('authToken') || null;
  let playerId = localStorage.getItem('serverPlayerId') || null;
  let isOnline = true;
  let syncQueue = [];
  let isSyncing = false;

  // Helper function for API calls
  async function apiCall(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      isOnline = true;
      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        isOnline = false;
        console.warn('Server offline, using local storage');
      }
      throw error;
    }
  }

  // Get local username from game
  function getLocalUsername() {
    return localStorage.getItem('playerName') || null;
  }

  // Authentication
  async function register(username = null) {
    // Use local username if not provided
    const usernameToSend = username || getLocalUsername();
    
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: usernameToSend })
      });

      if (data.success) {
        authToken = data.player.token;
        playerId = data.player.id;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('serverPlayerId', playerId);
        console.log('Registered with server as:', usernameToSend);
      }

      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.message };
    }
  }

  async function login() {
    if (!authToken) {
      return register();
    }

    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ token: authToken })
      });

      if (data.success) {
        playerId = data.player.id;
        localStorage.setItem('serverPlayerId', playerId);
        console.log('Logged in successfully');
        
        // Sync local username to server if different
        const localUsername = getLocalUsername();
        const serverUsername = data.player.username;
        if (localUsername && serverUsername !== localUsername) {
          console.log('Syncing username to server:', localUsername);
          await updateUsername(localUsername);
        }
      }

      return data;
    } catch (error) {
      // Token invalid, register new player
      authToken = null;
      localStorage.removeItem('authToken');
      return register();
    }
  }

  async function updateUsername(newUsername) {
    try {
      const data = await apiCall('/auth/username', {
        method: 'PUT',
        body: JSON.stringify({ token: authToken, username: newUsername })
      });
      return data;
    } catch (error) {
      console.error('Username update failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Progress tracking
  async function recordClick(rarityId, pointsEarned) {
    if (!isOnline || !authToken) {
      queueAction('click', { rarityId, pointsEarned });
      return { success: true, queued: true };
    }

    try {
      const data = await apiCall('/progress/click', {
        method: 'POST',
        body: JSON.stringify({ rarityId, pointsEarned })
      });
      return data;
    } catch (error) {
      queueAction('click', { rarityId, pointsEarned });
      return { success: true, queued: true };
    }
  }

  async function recordPurchase(itemType, itemId, price) {
    try {
      const data = await apiCall('/progress/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemType, itemId, price })
      });
      return data;
    } catch (error) {
      console.error('Purchase record failed:', error);
      return { success: false, error: error.message };
    }
  }

  async function syncProgress(progressData) {
    try {
      const data = await apiCall('/progress/sync', {
        method: 'POST',
        body: JSON.stringify(progressData)
      });
      return data;
    } catch (error) {
      console.error('Progress sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Streak
  async function getStreak() {
    try {
      const data = await apiCall('/streak');
      return data;
    } catch (error) {
      console.error('Get streak failed:', error);
      return { success: false, error: error.message };
    }
  }

  async function claimStreak() {
    try {
      const data = await apiCall('/streak/claim', { method: 'POST' });
      return data;
    } catch (error) {
      console.error('Claim streak failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Challenges
  async function getChallenges() {
    try {
      const data = await apiCall('/challenges');
      return data;
    } catch (error) {
      console.error('Get challenges failed:', error);
      return { success: false, error: error.message };
    }
  }

  async function claimChallengeReward() {
    try {
      const data = await apiCall('/challenges/claim', { method: 'POST' });
      return data;
    } catch (error) {
      console.error('Claim challenge reward failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Achievements
  async function getAchievements() {
    try {
      const data = await apiCall('/achievements');
      return data;
    } catch (error) {
      console.error('Get achievements failed:', error);
      return { success: false, error: error.message };
    }
  }

  async function getUnacknowledgedAchievements() {
    try {
      const data = await apiCall('/achievements/unacknowledged');
      return data;
    } catch (error) {
      return { success: false, achievements: [] };
    }
  }

  async function acknowledgeAchievement(achievementId) {
    try {
      const data = await apiCall(`/achievements/acknowledge/${achievementId}`, { method: 'POST' });
      return data;
    } catch (error) {
      return { success: false };
    }
  }

  // Leaderboard
  async function getLeaderboard(period = 'all-time', limit = 100) {
    try {
      const data = await apiCall(`/leaderboard/${period}?limit=${limit}`);
      return data;
    } catch (error) {
      console.error('Get leaderboard failed:', error);
      return { success: false, leaderboard: [] };
    }
  }

  async function getLeaderboardAroundMe(period = 'all-time') {
    try {
      const data = await apiCall(`/leaderboard/around-me/${period}`);
      return data;
    } catch (error) {
      return { success: false, entries: [] };
    }
  }

  // Stats
  async function getStats() {
    try {
      const data = await apiCall('/stats');
      return data;
    } catch (error) {
      console.error('Get stats failed:', error);
      return { success: false, error: error.message };
    }
  }

  async function getSkins() {
    try {
      const data = await apiCall('/stats/skins');
      return data;
    } catch (error) {
      console.error('Get skins failed:', error);
      return { success: false, skins: [] };
    }
  }

  // Queue management for offline support
  function queueAction(type, data) {
    syncQueue.push({ type, data, timestamp: Date.now() });
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
  }

  async function processSyncQueue() {
    if (isSyncing || syncQueue.length === 0) return;

    isSyncing = true;
    const queue = [...syncQueue];
    syncQueue = [];

    for (const item of queue) {
      try {
        if (item.type === 'click') {
          await apiCall('/progress/click', {
            method: 'POST',
            body: JSON.stringify(item.data)
          });
        }
      } catch (error) {
        // Re-queue failed items
        syncQueue.push(item);
      }
    }

    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
    isSyncing = false;
  }

  // Initialize
  async function init() {
    // Load sync queue from storage
    syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');

    // Try to login/register
    await login();

    // Process any queued actions
    if (syncQueue.length > 0) {
      processSyncQueue();
    }

    // Set up periodic sync
    setInterval(processSyncQueue, 30000);

    return { success: true, playerId };
  }

  // Check server health
  async function checkHealth() {
    try {
      const data = await apiCall('/health');
      isOnline = data.success;
      return data;
    } catch (error) {
      isOnline = false;
      return { success: false };
    }
  }

  return {
    init,
    register,
    login,
    updateUsername,
    recordClick,
    recordPurchase,
    syncProgress,
    getStreak,
    claimStreak,
    getChallenges,
    claimChallengeReward,
    getAchievements,
    getUnacknowledgedAchievements,
    acknowledgeAchievement,
    getLeaderboard,
    getLeaderboardAroundMe,
    getStats,
    getSkins,
    checkHealth,
    isOnline: () => isOnline,
    getAuthToken: () => authToken,
    getPlayerId: () => playerId
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BeyondRareAPI.init());
} else {
  BeyondRareAPI.init();
}
