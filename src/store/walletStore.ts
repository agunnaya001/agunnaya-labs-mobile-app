import { create } from 'zustand';

export interface WalletUser {
  address: string;
  ensName?: string;
  username?: string;
}

interface WalletState {
  user: WalletUser | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: (address: string, ensName?: string) => void;
  disconnect: () => void;
  setConnecting: (connecting: boolean) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  user: null,
  isConnected: false,
  isConnecting: false,
  connect: (address: string, ensName?: string) =>
    set({
      user: { address, ensName },
      isConnected: true,
      isConnecting: false,
    }),
  disconnect: () =>
    set({
      user: null,
      isConnected: false,
      isConnecting: false,
    }),
  setConnecting: (connecting: boolean) => set({ isConnecting: connecting }),
}));
