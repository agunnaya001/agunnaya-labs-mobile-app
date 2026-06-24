import apiClient from './api';

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

export const fetchUserNFTs = async (userAddress: string): Promise<NFT[]> => {
  try {
    const response = await apiClient.get(`/api/nfts/${userAddress}`);
    return response.data.nfts || [];
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
};

export const getNFTMetadata = async (
  contractAddress: string,
  tokenId: string
): Promise<NFT | null> => {
  try {
    const response = await apiClient.get(
      `/api/nft-metadata/${contractAddress}/${tokenId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
};

export const getNFTCollectionFloor = async (
  contractAddress: string
): Promise<number | null> => {
  try {
    const response = await apiClient.get(`/api/nft-collection/${contractAddress}`);
    return response.data.floorPrice;
  } catch (error) {
    console.error('Error fetching collection floor price:', error);
    return null;
  }
};
