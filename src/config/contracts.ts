export const TOKEN_ADDRESSES = {
  AGL: process.env.EXPO_PUBLIC_AGL_TOKEN_ADDRESS || '0x',
  ARNA: process.env.EXPO_PUBLIC_ARNA_TOKEN_ADDRESS || '0x',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b1566dA7C66', // Base USDC
};

export const TOKEN_DECIMALS = {
  AGL: 18,
  ARNA: 18,
  USDC: 6,
  ETH: 18,
};

export const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const API_ENDPOINTS = {
  TOKEN_PRICE: `${COINGECKO_API}/simple/price`,
  TOKEN_BALANCE: process.env.EXPO_PUBLIC_API_URL + '/api/tokens/balance',
  NFTS: process.env.EXPO_PUBLIC_API_URL + '/api/nfts',
  GAME_STATS: process.env.EXPO_PUBLIC_API_URL + '/api/game/stats',
  LEADERBOARD: process.env.EXPO_PUBLIC_API_URL + '/api/game/leaderboard',
  TRANSACTIONS: process.env.EXPO_PUBLIC_API_URL + '/api/transactions',
};

export const ALCHEMY_API_KEY = process.env.EXPO_PUBLIC_ALCHEMY_KEY || '';
export const OPENSEA_API_KEY = process.env.EXPO_PUBLIC_OPENSEA_KEY || '';
