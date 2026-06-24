import apiClient from './api';
import { ARENA_ADDRESSES } from '@config/contracts';
import {
  getPVEPlayerStats,
  getPVPPlayerStats,
  getPVEMatchHistory,
  getOpenPVPChallenges,
  isPVEPaused,
  type OnChainPlayerStats,
  type OpenChallenge,
} from './blockchain';

export { type OnChainPlayerStats, type OpenChallenge };

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

export interface MatchHistoryEntry {
  timestamp: number;
  won: boolean;
  entryFee: string;
  reward: string;
  opponent: string;
}

// ─── On-chain first, API fallback ────────────────────────────────────────────

export const getPlayerStats = async (userAddress: string): Promise<PlayerStats | null> => {
  try {
    const onChain = await getPVEPlayerStats(ARENA_ADDRESSES.PVE, userAddress);
    if (onChain) {
      const total = onChain.wins + onChain.losses;
      return {
        level: onChain.level,
        experience: onChain.wins * 100,
        wins: onChain.wins,
        losses: onChain.losses,
        totalEarnings: onChain.totalEarned,
        winRate: total > 0 ? Math.round((onChain.wins / total) * 100) : 0,
        currentStreak: onChain.currentStreak,
      };
    }
  } catch {
    // fallthrough to API
  }
  try {
    const response = await apiClient.get(`/api/game/stats/${userAddress}`);
    return response.data;
  } catch (error) {
    console.error('[gaming] getPlayerStats:', error);
    return null;
  }
};

export const getPVPStats = async (userAddress: string): Promise<OnChainPlayerStats | null> => {
  try {
    return await getPVPPlayerStats(ARENA_ADDRESSES.PVP, userAddress);
  } catch (error) {
    console.error('[gaming] getPVPStats:', error);
    return null;
  }
};

export const getMatchHistory = async (
  userAddress: string,
  limit = 20,
): Promise<MatchHistoryEntry[]> => {
  try {
    const onChain = await getPVEMatchHistory(ARENA_ADDRESSES.PVE, userAddress, limit);
    if (onChain.length > 0) return onChain;
  } catch {
    // fallthrough to API
  }
  try {
    const response = await apiClient.get(`/api/game/history/${userAddress}`, {
      params: { limit },
    });
    return response.data.history || [];
  } catch (error) {
    console.error('[gaming] getMatchHistory:', error);
    return [];
  }
};

export const getOpenChallenges = async (limit = 20): Promise<OpenChallenge[]> => {
  try {
    return await getOpenPVPChallenges(ARENA_ADDRESSES.PVP, limit);
  } catch (error) {
    console.error('[gaming] getOpenChallenges:', error);
    return [];
  }
};

export const getArenaStatus = async (): Promise<{ pveActive: boolean; pvpActive: boolean }> => {
  try {
    const [pvePaused, pvpPaused] = await Promise.allSettled([
      isPVEPaused(ARENA_ADDRESSES.PVE),
      isPVEPaused(ARENA_ADDRESSES.PVP),
    ]);
    return {
      pveActive: pvePaused.status === 'fulfilled' ? !pvePaused.value : true,
      pvpActive: pvpPaused.status === 'fulfilled' ? !pvpPaused.value : true,
    };
  } catch {
    return { pveActive: true, pvpActive: true };
  }
};

export const getLeaderboard = async (limit = 100): Promise<LeaderboardEntry[]> => {
  try {
    const response = await apiClient.get('/api/game/leaderboard', { params: { limit } });
    return response.data.leaderboard || [];
  } catch (error) {
    console.error('[gaming] getLeaderboard:', error);
    return [];
  }
};

export const getPlayerAchievements = async (
  userAddress: string,
): Promise<GameAchievement[]> => {
  try {
    const response = await apiClient.get(`/api/game/achievements/${userAddress}`);
    return response.data.achievements || [];
  } catch (error) {
    console.error('[gaming] getPlayerAchievements:', error);
    return [];
  }
};

export const recordGameResult = async (
  userAddress: string,
  result: { won: boolean; earnings: string; opponentAddress: string },
): Promise<boolean> => {
  try {
    await apiClient.post(`/api/game/result/${userAddress}`, result);
    return true;
  } catch (error) {
    console.error('[gaming] recordGameResult:', error);
    return false;
  }
};

export const launchGame = async (userAddress: string): Promise<string | null> => {
  try {
    const response = await apiClient.post('/api/game/launch', { playerAddress: userAddress });
    return response.data.gameSessionId;
  } catch (error) {
    console.error('[gaming] launchGame:', error);
    return null;
  }
};
