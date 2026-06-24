import { useQuery } from '@tanstack/react-query';
import { fetchTransactionHistory } from '@services/transactions';

export const useTransactionHistory = (userAddress: string | null) => {
  return useQuery({
    queryKey: ['transactions', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      return fetchTransactionHistory(userAddress, 50);
    },
    enabled: !!userAddress,
    staleTime: 60000, // 1 minute
  });
};
