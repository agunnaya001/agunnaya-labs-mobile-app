import { useQuery } from '@tanstack/react-query';
import { fetchUserNFTs, getNFTCollectionFloor } from '@services/nfts';

export const useUserNFTs = (userAddress: string | null) => {
  return useQuery({
    queryKey: ['userNFTs', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      return fetchUserNFTs(userAddress);
    },
    enabled: !!userAddress,
    staleTime: 120000, // 2 minutes
  });
};

export const useNFTCollectionFloor = (contractAddress: string | null) => {
  return useQuery({
    queryKey: ['nftCollectionFloor', contractAddress],
    queryFn: async () => {
      if (!contractAddress) return null;
      return getNFTCollectionFloor(contractAddress);
    },
    enabled: !!contractAddress,
    staleTime: 300000, // 5 minutes
  });
};
