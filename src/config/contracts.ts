export const CHAIN_ID = 8453; // Base mainnet

// ─── Token Contracts ──────────────────────────────────────────────────────────
export const TOKEN_ADDRESSES = {
  AGL:  '0xEA1221B4d80A89BD8C75248Fae7c176BD1854698', // Agunnaya Labs Token
  ARNA: '0x3b855F88CB93aA642EaEB13F59987C552Fc614b5', // Arena Token ERC-20
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b1566dA7C66', // Base USDC
} as const;

// ─── NFT Contracts ────────────────────────────────────────────────────────────
export const NFT_ADDRESSES = {
  ARENA_CHAMPION: '0x68f08b005b09B0F7D07E1c0B5CDe18E43CE2486A', // Arena Champion NFT (ERC-721)
} as const;

// ─── Arena Game Contracts ─────────────────────────────────────────────────────
export const ARENA_ADDRESSES = {
  PVE:         '0xF6fc2B6a306B626548ca9dF25B31a22D0f8971CF', // Arena Battle PVE
  PVP:         '0xd0C4Af12E95f9590e7314D079C58597771E57533', // Arena PVP
  MARKETPLACE: '0x67817157Dd6E5945ac2fAf1a822e7f1dE26C698E', // Arena Marketplace
} as const;

// ─── Decimal precision ────────────────────────────────────────────────────────
export const TOKEN_DECIMALS: Record<string, number> = {
  AGL:  18,
  ARNA: 18,
  USDC: 6,
  ETH:  18,
};

// ─── External APIs ────────────────────────────────────────────────────────────
export const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const API_ENDPOINTS = {
  TOKEN_PRICE:  `${COINGECKO_API}/simple/price`,
  TOKEN_BALANCE: (process.env.EXPO_PUBLIC_API_URL ?? '') + '/api/tokens/balance',
  NFTS:          (process.env.EXPO_PUBLIC_API_URL ?? '') + '/api/nfts',
  GAME_STATS:    (process.env.EXPO_PUBLIC_API_URL ?? '') + '/api/game/stats',
  LEADERBOARD:   (process.env.EXPO_PUBLIC_API_URL ?? '') + '/api/game/leaderboard',
  TRANSACTIONS:  (process.env.EXPO_PUBLIC_API_URL ?? '') + '/api/transactions',
};

export const ALCHEMY_API_KEY  = process.env.EXPO_PUBLIC_ALCHEMY_KEY  ?? '';
export const OPENSEA_API_KEY  = process.env.EXPO_PUBLIC_OPENSEA_KEY  ?? '';
