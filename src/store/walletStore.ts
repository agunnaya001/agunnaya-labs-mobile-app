import { create } from 'zustand';

export interface WalletUser {
  address: string;
  ensName?: string;
  username?: string;
}

export interface ArenaStats {
  wins: number;
  losses: number;
  totalEarned: number;
  currentStreak: number;
  level: number;
}

interface WalletState {
  user: WalletUser | null;
  isConnected: boolean;
  isConnecting: boolean;
  aglBalance: number;
  arenaStats: ArenaStats;
  connect: (address: string, ensName?: string) => void;
  disconnect: () => void;
  setConnecting: (connecting: boolean) => void;
  spendAGL: (amount: number) => void;
  earnAGL: (amount: number) => void;
  recordWin: (earned: number) => void;
  recordLoss: () => void;
}

const DEFAULT_STATS: ArenaStats = {
  wins: 0,
  losses: 0,
  totalEarned: 0,
  currentStreak: 0,
  level: 1,
};

export const useWalletStore = create<WalletState>((set, get) => ({
  user: null,
  isConnected: false,
  isConnecting: false,
  aglBalance: 500,
  arenaStats: DEFAULT_STATS,

  connect: (address: string, ensName?: string) =>
    set({ user: { address, ensName }, isConnected: true, isConnecting: false }),

  disconnect: () =>
    set({ user: null, isConnected: false, isConnecting: false, aglBalance: 500, arenaStats: DEFAULT_STATS }),

  setConnecting: (connecting: boolean) => set({ isConnecting: connecting }),

  spendAGL: (amount: number) =>
    set((state) => ({ aglBalance: Math.max(0, state.aglBalance - amount) })),

  earnAGL: (amount: number) =>
    set((state) => ({ aglBalance: state.aglBalance + amount })),

  recordWin: (earned: number) =>
    set((state) => {
      const newStreak = state.arenaStats.currentStreak + 1;
      const newWins = state.arenaStats.wins + 1;
      const totalGames = newWins + state.arenaStats.losses;
      const newLevel = Math.floor(totalGames / 5) + 1;
      return {
        arenaStats: {
          ...state.arenaStats,
          wins: newWins,
          totalEarned: state.arenaStats.totalEarned + earned,
          currentStreak: newStreak,
          level: newLevel,
        },
      };
    }),

  recordLoss: () =>
    set((state) => {
      const newLosses = state.arenaStats.losses + 1;
      const totalGames = state.arenaStats.wins + newLosses;
      const newLevel = Math.floor(totalGames / 5) + 1;
      return {
        arenaStats: {
          ...state.arenaStats,
          losses: newLosses,
          currentStreak: 0,
          level: newLevel,
        },
      };
    }),
}));
