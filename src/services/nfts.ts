import apiClient from './api';
import { NFT_ADDRESSES, ARENA_ADDRESSES } from '@config/contracts';
import {
  getNFTBalance,
  getNFTTokensOfOwner,
  getNFTTokenURI,
  getActiveMarketplaceListings,
  type MarketplaceListing,
} from './blockchain';

export { type MarketplaceListing };

export interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  rarity?: string;
  floorPrice?: string;
  tokenAddress: string;
  tokenId: string;
}

export interface ChainNFT {
  tokenId: string;
  tokenURI: string | null;
  contractAddress: string;
  collection: string;
}

// ─── On-chain reads ──────────────────────────────────────────────────────────

export const fetchChampionNFTBalance = async (userAddress: string): Promise<number> =>
  getNFTBalance(NFT_ADDRESSES.ARENA_CHAMPION, userAddress);

export const fetchChampionNFTs = async (userAddress: string): Promise<ChainNFT[]> => {
  try {
    const tokenIds = await getNFTTokensOfOwner(NFT_ADDRESSES.ARENA_CHAMPION, userAddress, 50);
    const results = await Promise.allSettled(
      tokenIds.map(async (id) => {
        const uri = await getNFTTokenURI(NFT_ADDRESSES.ARENA_CHAMPION, id);
        const nft: ChainNFT = {
          tokenId: id.toString(),
          tokenURI: uri,
          contractAddress: NFT_ADDRESSES.ARENA_CHAMPION,
          collection: 'Arena Champions',
        };
        return nft;
      }),
    );
    const nfts: ChainNFT[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') nfts.push(r.value);
    }
    return nfts;
  } catch (error) {
    console.error('[nfts] fetchChampionNFTs:', error);
    return [];
  }
};

export const fetchMarketplaceListings = async (
  offset = 0,
  limit = 20,
): Promise<MarketplaceListing[]> =>
  getActiveMarketplaceListings(ARENA_ADDRESSES.MARKETPLACE, offset, limit);

// ─── API-backed reads (with on-chain fallback) ────────────────────────────────

export const fetchUserNFTs = async (userAddress: string): Promise<NFT[]> => {
  try {
    const [apiResult, chainResult] = await Promise.allSettled([
      apiClient.get(`/api/nfts/${userAddress}`).then((r) => (r.data.nfts as NFT[]) || []),
      fetchChampionNFTs(userAddress),
    ]);

    const apiNFTs: NFT[] = apiResult.status === 'fulfilled' ? apiResult.value : [];
    const chain: ChainNFT[] = chainResult.status === 'fulfilled' ? chainResult.value : [];

    const knownIds = new Set(apiNFTs.map((n) => n.tokenId));
    const newFromChain: NFT[] = chain
      .filter((c) => !knownIds.has(c.tokenId))
      .map((c) => ({
        id: c.tokenId,
        name: `Arena Champion #${c.tokenId}`,
        image: c.tokenURI ?? '',
        collection: c.collection,
        rarity: 'Epic',
        floorPrice: undefined,
        tokenAddress: c.contractAddress,
        tokenId: c.tokenId,
      }));

    return [...apiNFTs, ...newFromChain];
  } catch (error) {
    console.error('[nfts] fetchUserNFTs:', error);
    return [];
  }
};

export const getNFTMetadata = async (
  contractAddress: string,
  tokenId: string,
): Promise<NFT | null> => {
  try {
    const response = await apiClient.get(`/api/nft-metadata/${contractAddress}/${tokenId}`);
    return response.data;
  } catch {
    try {
      const uri = await getNFTTokenURI(contractAddress, tokenId);
      if (!uri) return null;
      return {
        id: tokenId,
        name: `Token #${tokenId}`,
        image: uri,
        collection: 'Unknown',
        tokenAddress: contractAddress,
        tokenId,
      };
    } catch (error) {
      console.error('[nfts] getNFTMetadata:', error);
      return null;
    }
  }
};

export const getNFTCollectionFloor = async (contractAddress: string): Promise<number | null> => {
  try {
    const response = await apiClient.get(`/api/nft-collection/${contractAddress}`);
    return response.data.floorPrice;
  } catch (error) {
    console.error('[nfts] getNFTCollectionFloor:', error);
    return null;
  }
};
