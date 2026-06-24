import { useQuery } from '@tanstack/react-query';
import { TOKEN_ADDRESSES, NFT_ADDRESSES, ARENA_ADDRESSES } from '@config/contracts';
import {
  getTokenBalance,
  getNFTBalance,
  getNFTTokensOfOwner,
  getPVEPlayerStats,
  getPVPPlayerStats,
  getPVEMatchHistory,
  getOpenPVPChallenges,
  getActiveMarketplaceListings,
  isPVEPaused,
  type OnChainPlayerStats,
  type MarketplaceListing,
  type OpenChallenge,
} from '@services/blockchain';

// ─── AGL Token ───────────────────────────────────────────────────────────────

export const useAGLBalance = (userAddress: string | null) => {
  return useQuery({
    queryKey: ['aglBalance', userAddress],
    queryFn: async () => {
      if (!userAddress) return '0';
      return getTokenBalance(TOKEN_ADDRESSES.AGL, userAddress);
    },
    enabled: !!userAddress,
    staleTime: 30_000,
  });
};

// ─── ARNA Token ───────────────────────────────────────────────────────────────

export const useARNABalance = (userAddress: string | null) => {
  return useQuery({
    queryKey: ['arnaBalance', userAddress],
    queryFn: async () => {
      if (!userAddress) return '0';
      return getTokenBalance(TOKEN_ADDRESSES.ARNA, userAddress);
    },
    enabled: !!userAddress,
    staleTime: 30_000,
  });
};

// ─── Arena Champion NFT ───────────────────────────────────────────────────────

export const useChampionNFTBalance = (userAddress: string | null) => {
  return useQuery({
    queryKey: ['championNFTBalance', userAddress],
    queryFn: async () => {
      if (!userAddress) return 0;
      return getNFTBalance(NFT_ADDRESSES.ARENA_CHAMPION, userAddress);
    },
    enabled: !!userAddress,
    staleTime: 60_000,
  });
};

export const useChampionNFTTokens = (userAddress: string | null) => {
  return useQuery({
    queryKey: ['championNFTTokens', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      return getNFTTokensOfOwner(NFT_ADDRESSES.ARENA_CHAMPION, userAddress, 50);
    },
    enabled: !!userAddress,
    staleTime: 120_000,
  });
};

// ─── Arena PVE ────────────────────────────────────────────────────────────────

export const usePVEPlayerStats = (userAddress: string | null) => {
  return useQuery<OnChainPlayerStats | null>({
    queryKey: ['pveStats', userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      return getPVEPlayerStats(ARENA_ADDRESSES.PVE, userAddress);
    },
    enabled: !!userAddress,
    staleTime: 60_000,
  });
};

export const usePVEMatchHistory = (userAddress: string | null, limit = 20) => {
  return useQuery({
    queryKey: ['pveHistory', userAddress, limit],
    queryFn: async () => {
      if (!userAddress) return [];
      return getPVEMatchHistory(ARENA_ADDRESSES.PVE, userAddress, limit);
    },
    enabled: !!userAddress,
    staleTime: 60_000,
  });
};

export const usePVEPaused = () => {
  return useQuery({
    queryKey: ['pvePaused'],
    queryFn: () => isPVEPaused(ARENA_ADDRESSES.PVE),
    staleTime: 120_000,
  });
};

// ─── Arena PVP ────────────────────────────────────────────────────────────────

export const usePVPPlayerStats = (userAddress: string | null) => {
  return useQuery<OnChainPlayerStats | null>({
    queryKey: ['pvpStats', userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      return getPVPPlayerStats(ARENA_ADDRESSES.PVP, userAddress);
    },
    enabled: !!userAddress,
    staleTime: 60_000,
  });
};

export const useOpenPVPChallenges = (limit = 20) => {
  return useQuery<OpenChallenge[]>({
    queryKey: ['pvpOpenChallenges', limit],
    queryFn: () => getOpenPVPChallenges(ARENA_ADDRESSES.PVP, limit),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
};

// ─── Marketplace ──────────────────────────────────────────────────────────────

export const useMarketplaceListings = (offset = 0, limit = 20) => {
  return useQuery<MarketplaceListing[]>({
    queryKey: ['marketplaceListings', offset, limit],
    queryFn: () => getActiveMarketplaceListings(ARENA_ADDRESSES.MARKETPLACE, offset, limit),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
};

export const useCollectionListings = (nftContract: string | null) => {
  return useQuery({
    queryKey: ['collectionListings', nftContract],
    queryFn: async () => {
      if (!nftContract) return [];
      const { getListingsByCollection } = await import('@services/blockchain');
      return getListingsByCollection(ARENA_ADDRESSES.MARKETPLACE, nftContract);
    },
    enabled: !!nftContract,
    staleTime: 60_000,
  });
};
