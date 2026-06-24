export const RPC_URLS: Record<number, string> = {
  1: process.env.EXPO_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  8453: process.env.EXPO_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
};

export const CHAIN_ID = 8453;

export const WALLETCONNECT_PROJECT_ID = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const WALLETCONNECT_METADATA = {
  name: 'Agunnaya Labs',
  description: 'AI + Web3 Ecosystem Mobile App',
  url: 'https://agunnaya.labs',
  icons: ['https://avatars.githubusercontent.com/u/1234567'],
};
