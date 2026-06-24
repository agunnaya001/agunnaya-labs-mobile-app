import { useQuery } from '@tanstack/react-query';
import {
  getPlayerStats,
  getLeaderboard,
  getPlayerAchievements,
  launchGame,
} from '@services/gaming';

export const usePlayerStats = (userAddress: string | null) => {
  return useQuery({
    queryKey: ['playerStats', userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      return getPlayerStats(userAddress);
    },
    enabled: !!userAddress,
    staleTime: 60000, // 1 minute
  });
};

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => getLeaderboard(100),
    staleTime: 120000, // 2 minutes
  });
};

export const usePlayerAchievements = (userAddress: string | null) => {
  return useQuery({
    queryKey: ['achievements', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      return getPlayerAchievements(userAddress);
    },
    enabled: !!userAddress,
    staleTime: 180000, // 3 minutes
  });
};

export const useLaunchGame = () => {
  const launchGameAsync = async (userAddress: string) => {
    return await launchGame(userAddress);
  };

  return { launchGame: launchGameAsync };
};
