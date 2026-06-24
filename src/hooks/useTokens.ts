import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTokenBalance, getNativeBalance } from '@services/blockchain';
import { getTokenPrices } from '@services/tokens';
import { useWalletStore } from '@store/walletStore';

export const useTokenBalance = (tokenAddress: string | null, userAddress: string | null) => {
  return useQuery({
    queryKey: ['tokenBalance', tokenAddress, userAddress],
    queryFn: async () => {
      if (!tokenAddress || !userAddress) return '0';
      return getTokenBalance(tokenAddress, userAddress);
    },
    enabled: !!tokenAddress && !!userAddress,
    staleTime: 30000, // 30 seconds
  });
};

export const useNativeBalance = (userAddress: string | null) => {
  return useQuery({
    queryKey: ['nativeBalance', userAddress],
    queryFn: async () => {
      if (!userAddress) return '0';
      return getNativeBalance(userAddress);
    },
    enabled: !!userAddress,
    staleTime: 30000,
  });
};

export const useTokenPrices = (tokenIds: string[]) => {
  return useQuery({
    queryKey: ['tokenPrices', tokenIds],
    queryFn: async () => {
      if (tokenIds.length === 0) return {};
      return getTokenPrices(tokenIds);
    },
    enabled: tokenIds.length > 0,
    staleTime: 60000, // 1 minute
  });
};

export const useRefreshData = () => {
  const { user } = useWalletStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Invalidate queries and refetch
      // This would typically use TanStack Query's invalidateQueries
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return { refresh, isRefreshing };
};
