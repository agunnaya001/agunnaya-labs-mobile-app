import { ethers } from 'ethers';
import { RPC_URLS, CHAIN_ID } from '@config/walletConnect';

// ─── ABIs ─────────────────────────────────────────────────────────────────────

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

export const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function setApprovalForAll(address operator, bool approved)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

export const ARENA_PVE_ABI = [
  'function enterMatch(uint256 entryAmount) external',
  'function getPlayerStats(address player) view returns (uint256 wins, uint256 losses, uint256 totalEarned, uint256 currentStreak, uint256 level)',
  'function getMatchHistory(address player, uint256 limit) view returns (tuple(uint256 timestamp, bool won, uint256 entryFee, uint256 reward, address opponent)[])',
  'function getMinEntryFee() view returns (uint256)',
  'function getMaxEntryFee() view returns (uint256)',
  'function isPaused() view returns (bool)',
  'event MatchResult(address indexed player, address indexed opponent, bool won, uint256 entryFee, uint256 reward)',
];

export const ARENA_PVP_ABI = [
  'function createChallenge(uint256 entryAmount) external returns (uint256 challengeId)',
  'function acceptChallenge(uint256 challengeId) external',
  'function cancelChallenge(uint256 challengeId) external',
  'function getChallenge(uint256 challengeId) view returns (address challenger, address opponent, uint256 entryFee, uint8 status)',
  'function getOpenChallenges(uint256 limit) view returns (tuple(uint256 id, address challenger, uint256 entryFee, uint256 createdAt)[])',
  'function getPlayerStats(address player) view returns (uint256 wins, uint256 losses, uint256 totalEarned, uint256 currentStreak)',
  'function isPaused() view returns (bool)',
  'event ChallengeCreated(uint256 indexed challengeId, address indexed challenger, uint256 entryFee)',
  'event ChallengeAccepted(uint256 indexed challengeId, address indexed opponent)',
  'event MatchResult(uint256 indexed challengeId, address indexed winner, address indexed loser, uint256 reward)',
];

export const ARENA_MARKETPLACE_ABI = [
  'function listItem(address nftContract, uint256 tokenId, uint256 priceInAGL) external returns (uint256 listingId)',
  'function buyItem(uint256 listingId) external',
  'function cancelListing(uint256 listingId) external',
  'function getListing(uint256 listingId) view returns (address seller, address nftContract, uint256 tokenId, uint256 price, bool active)',
  'function getActiveListings(uint256 offset, uint256 limit) view returns (tuple(uint256 id, address seller, address nftContract, uint256 tokenId, uint256 price, uint256 createdAt)[])',
  'function getListingsByCollection(address nftContract) view returns (uint256[])',
  'function totalListings() view returns (uint256)',
  'event ItemListed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price)',
  'event ItemSold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price)',
  'event ListingCancelled(uint256 indexed listingId)',
];

// ─── Provider singleton ───────────────────────────────────────────────────────

let provider: ethers.JsonRpcProvider | null = null;

export const getProvider = (): ethers.JsonRpcProvider => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URLS[CHAIN_ID]);
  }
  return provider;
};

// ─── Generic ERC-20 helpers ───────────────────────────────────────────────────

export const getTokenBalance = async (
  tokenAddress: string,
  userAddress: string,
): Promise<string> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, p);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.decimals(),
    ]);
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('[blockchain] getTokenBalance:', error);
    return '0';
  }
};

export const getNativeBalance = async (userAddress: string): Promise<string> => {
  try {
    const p = getProvider();
    const balance = await p.getBalance(userAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('[blockchain] getNativeBalance:', error);
    return '0';
  }
};

export const getTokenInfo = async (tokenAddress: string) => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, p);
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);
    return { name, symbol, decimals: Number(decimals), totalSupply: ethers.formatUnits(totalSupply, decimals) };
  } catch (error) {
    console.error('[blockchain] getTokenInfo:', error);
    return null;
  }
};

// ─── ERC-721 helpers ──────────────────────────────────────────────────────────

export const getNFTBalance = async (
  nftAddress: string,
  userAddress: string,
): Promise<number> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(nftAddress, ERC721_ABI, p);
    const balance = await contract.balanceOf(userAddress);
    return Number(balance);
  } catch (error) {
    console.error('[blockchain] getNFTBalance:', error);
    return 0;
  }
};

export const getNFTTokensOfOwner = async (
  nftAddress: string,
  userAddress: string,
  maxCount = 50,
): Promise<bigint[]> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(nftAddress, ERC721_ABI, p);
    const balance = Number(await contract.balanceOf(userAddress));
    const count = Math.min(balance, maxCount);
    const indices = Array.from({ length: count }, (_, i) => i);
    const tokenIds = await Promise.all(
      indices.map((i) => contract.tokenOfOwnerByIndex(userAddress, i)),
    );
    return tokenIds;
  } catch (error) {
    console.error('[blockchain] getNFTTokensOfOwner:', error);
    return [];
  }
};

export const getNFTTokenURI = async (
  nftAddress: string,
  tokenId: string | bigint,
): Promise<string | null> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(nftAddress, ERC721_ABI, p);
    return await contract.tokenURI(tokenId);
  } catch (error) {
    console.error('[blockchain] getNFTTokenURI:', error);
    return null;
  }
};

// ─── Arena PVE helpers ────────────────────────────────────────────────────────

export interface OnChainPlayerStats {
  wins: number;
  losses: number;
  totalEarned: string;
  currentStreak: number;
  level: number;
}

export const getPVEPlayerStats = async (
  pveAddress: string,
  userAddress: string,
): Promise<OnChainPlayerStats | null> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(pveAddress, ARENA_PVE_ABI, p);
    const [wins, losses, totalEarned, currentStreak, level] =
      await contract.getPlayerStats(userAddress);
    return {
      wins: Number(wins),
      losses: Number(losses),
      totalEarned: ethers.formatUnits(totalEarned, 18),
      currentStreak: Number(currentStreak),
      level: Number(level),
    };
  } catch (error) {
    console.error('[blockchain] getPVEPlayerStats:', error);
    return null;
  }
};

export const getPVEMatchHistory = async (
  pveAddress: string,
  userAddress: string,
  limit = 20,
): Promise<Array<{ timestamp: number; won: boolean; entryFee: string; reward: string; opponent: string }>> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(pveAddress, ARENA_PVE_ABI, p);
    const history = await contract.getMatchHistory(userAddress, limit);
    return history.map((h: any) => ({
      timestamp: Number(h.timestamp) * 1000,
      won: h.won,
      entryFee: ethers.formatUnits(h.entryFee, 18),
      reward: ethers.formatUnits(h.reward, 18),
      opponent: h.opponent,
    }));
  } catch (error) {
    console.error('[blockchain] getPVEMatchHistory:', error);
    return [];
  }
};

export const isPVEPaused = async (pveAddress: string): Promise<boolean> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(pveAddress, ARENA_PVE_ABI, p);
    return await contract.isPaused();
  } catch {
    return false;
  }
};

// ─── Arena PVP helpers ────────────────────────────────────────────────────────

export interface OpenChallenge {
  id: number;
  challenger: string;
  entryFee: string;
  createdAt: number;
}

export const getOpenPVPChallenges = async (
  pvpAddress: string,
  limit = 20,
): Promise<OpenChallenge[]> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(pvpAddress, ARENA_PVP_ABI, p);
    const challenges = await contract.getOpenChallenges(limit);
    return challenges.map((c: any) => ({
      id: Number(c.id),
      challenger: c.challenger,
      entryFee: ethers.formatUnits(c.entryFee, 18),
      createdAt: Number(c.createdAt) * 1000,
    }));
  } catch (error) {
    console.error('[blockchain] getOpenPVPChallenges:', error);
    return [];
  }
};

export const getPVPPlayerStats = async (
  pvpAddress: string,
  userAddress: string,
): Promise<OnChainPlayerStats | null> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(pvpAddress, ARENA_PVP_ABI, p);
    const [wins, losses, totalEarned, currentStreak] =
      await contract.getPlayerStats(userAddress);
    return {
      wins: Number(wins),
      losses: Number(losses),
      totalEarned: ethers.formatUnits(totalEarned, 18),
      currentStreak: Number(currentStreak),
      level: 1,
    };
  } catch (error) {
    console.error('[blockchain] getPVPPlayerStats:', error);
    return null;
  }
};

// ─── Marketplace helpers ──────────────────────────────────────────────────────

export interface MarketplaceListing {
  id: number;
  seller: string;
  nftContract: string;
  tokenId: string;
  price: string;
  createdAt: number;
}

export const getActiveMarketplaceListings = async (
  marketplaceAddress: string,
  offset = 0,
  limit = 20,
): Promise<MarketplaceListing[]> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(marketplaceAddress, ARENA_MARKETPLACE_ABI, p);
    const listings = await contract.getActiveListings(offset, limit);
    return listings.map((l: any) => ({
      id: Number(l.id),
      seller: l.seller,
      nftContract: l.nftContract,
      tokenId: l.tokenId.toString(),
      price: ethers.formatUnits(l.price, 18),
      createdAt: Number(l.createdAt) * 1000,
    }));
  } catch (error) {
    console.error('[blockchain] getActiveMarketplaceListings:', error);
    return [];
  }
};

export const getMarketplaceListing = async (
  marketplaceAddress: string,
  listingId: number,
): Promise<MarketplaceListing | null> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(marketplaceAddress, ARENA_MARKETPLACE_ABI, p);
    const [seller, nftContract, tokenId, price, active] =
      await contract.getListing(listingId);
    if (!active) return null;
    return {
      id: listingId,
      seller,
      nftContract,
      tokenId: tokenId.toString(),
      price: ethers.formatUnits(price, 18),
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error('[blockchain] getMarketplaceListing:', error);
    return null;
  }
};

export const getListingsByCollection = async (
  marketplaceAddress: string,
  nftContract: string,
): Promise<number[]> => {
  try {
    const p = getProvider();
    const contract = new ethers.Contract(marketplaceAddress, ARENA_MARKETPLACE_ABI, p);
    const ids = await contract.getListingsByCollection(nftContract);
    return ids.map(Number);
  } catch (error) {
    console.error('[blockchain] getListingsByCollection:', error);
    return [];
  }
};
