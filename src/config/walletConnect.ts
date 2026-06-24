import { Platform } from 'react-native';
import { WalletConnectModal } from '@walletconnect/modal-react-native';
import { Core } from '@walletconnect/core';
import { Web3Wallet } from '@walletconnect/web3wallet';

const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('WalletConnect Project ID not set in .env');
}

const core = new Core({
  projectId,
});

export const web3wallet = await Web3Wallet.init({
  core,
  metadata: {
    name: 'Agunnaya Labs',
    description: 'AI + Web3 Ecosystem Mobile App',
    url: 'https://agunnaya.labs',
    icons: ['https://avatars.githubusercontent.com/u/1234567'],
  },
});

export const walletConnectModal = new WalletConnectModal({
  projectId,
  tokens: {
    1: { imageId: 'eth' },
    8453: { imageId: 'base' },
  },
});

export const RPC_URLS = {
  1: process.env.EXPO_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  8453: process.env.EXPO_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
};

export const CHAIN_ID = 8453; // Base
