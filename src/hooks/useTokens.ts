import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    staleTime: 30000,
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
    staleTime: 60000,
  });
};

export const useRefreshData = () => {
  const { user } = useWalletStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.address) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['nativeBalance', user.address] });
      await queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
      await queryClient.invalidateQueries({ queryKey: ['tokenPrices'] });
      await queryClient.refetchQueries({ queryKey: ['nativeBalance', user.address] });
      await queryClient.refetchQueries({ queryKey: ['tokenPrices'] });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, user?.address]);

  return { refresh, isRefreshing };
};
