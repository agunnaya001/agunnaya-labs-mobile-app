import apiClient from './api';

export interface PlayerStats {
  level: number;
  experience: number;
  wins: number;
  losses: number;
  totalEarnings: string;
  winRate: number;
  currentStreak: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  username?: string;
  wins: number;
  earnings: string;
  level: number;
}

export interface GameAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export const getPlayerStats = async (userAddress: string): Promise<PlayerStats | null> => {
  try {
    const response = await apiClient.get(`/api/game/stats/${userAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
};

export const getLeaderboard = async (limit: number = 100): Promise<LeaderboardEntry[]> => {
  try {
    const response = await apiClient.get('/api/game/leaderboard', {
      params: { limit },
    });
    return response.data.leaderboard || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

export const getPlayerAchievements = async (
  userAddress: string
): Promise<GameAchievement[]> => {
  try {
    const response = await apiClient.get(`/api/game/achievements/${userAddress}`);
    return response.data.achievements || [];
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }
};

export const recordGameResult = async (
  userAddress: string,
  result: {
    won: boolean;
    earnings: string;
    opponentAddress: string;
  }
): Promise<boolean> => {
  try {
    await apiClient.post(`/api/game/result/${userAddress}`, result);
    return true;
  } catch (error) {
    console.error('Error recording game result:', error);
    return false;
  }
};

export const launchGame = async (userAddress: string): Promise<string | null> => {
  try {
    const response = await apiClient.post(`/api/game/launch`, {
      playerAddress: userAddress,
    });
    return response.data.gameSessionId;
  } catch (error) {
    console.error('Error launching game:', error);
    return null;
  }
};
