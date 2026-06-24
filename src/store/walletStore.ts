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

export interface LocalTx {
  id: string;
  type: 'arena_win' | 'arena_loss' | 'send' | 'receive' | 'nft_purchase' | 'swap';
  amount: number;
  token: string;
  description: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  counterparty?: string;
  hash: string;
}

interface WalletState {
  user: WalletUser | null;
  isConnected: boolean;
  isConnecting: boolean;
  aglBalance: number;
  arenaStats: ArenaStats;
  transactions: LocalTx[];

  connect: (address: string, ensName?: string) => void;
  disconnect: () => void;
  setConnecting: (connecting: boolean) => void;
  spendAGL: (amount: number) => void;
  earnAGL: (amount: number) => void;
  sendAGL: (amount: number, to: string) => boolean;
  recordWin: (entryFee: number, reward: number, opponent: string) => void;
  recordLoss: (entryFee: number, opponent: string) => void;
  purchaseNFT: (name: string, price: number) => boolean;
  addTransaction: (tx: Omit<LocalTx, 'id' | 'hash' | 'timestamp'>) => void;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function makeHash() {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
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
  transactions: [],

  connect: (address, ensName) =>
    set({ user: { address, ensName }, isConnected: true, isConnecting: false }),

  disconnect: () =>
    set({ user: null, isConnected: false, isConnecting: false, aglBalance: 500, arenaStats: DEFAULT_STATS, transactions: [] }),

  setConnecting: (isConnecting) => set({ isConnecting }),

  spendAGL: (amount) =>
    set((s) => ({ aglBalance: Math.max(0, s.aglBalance - amount) })),

  earnAGL: (amount) =>
    set((s) => ({ aglBalance: s.aglBalance + amount })),

  sendAGL: (amount, to) => {
    const { aglBalance } = get();
    if (aglBalance < amount) return false;
    set((s) => ({
      aglBalance: s.aglBalance - amount,
      transactions: [
        {
          id: makeId(),
          type: 'send',
          amount,
          token: 'AGL',
          description: `Sent to ${to.slice(0, 6)}...${to.slice(-4)}`,
          timestamp: Date.now(),
          status: 'completed',
          counterparty: to,
          hash: makeHash(),
        },
        ...s.transactions,
      ],
    }));
    return true;
  },

  recordWin: (entryFee, reward, opponent) =>
    set((s) => {
      const newStreak = s.arenaStats.currentStreak + 1;
      const newWins = s.arenaStats.wins + 1;
      const totalGames = newWins + s.arenaStats.losses;
      const net = reward - entryFee;
      return {
        aglBalance: s.aglBalance + reward,
        arenaStats: {
          wins: newWins,
          losses: s.arenaStats.losses,
          totalEarned: s.arenaStats.totalEarned + net,
          currentStreak: newStreak,
          level: Math.max(1, Math.floor(totalGames / 5) + 1),
        },
        transactions: [
          {
            id: makeId(),
            type: 'arena_win' as const,
            amount: net,
            token: 'AGL',
            description: `Arena win vs ${opponent}`,
            timestamp: Date.now(),
            status: 'completed' as const,
            counterparty: opponent,
            hash: makeHash(),
          },
          ...s.transactions,
        ],
      };
    }),

  recordLoss: (entryFee, opponent) =>
    set((s) => {
      const newLosses = s.arenaStats.losses + 1;
      const totalGames = s.arenaStats.wins + newLosses;
      return {
        arenaStats: {
          ...s.arenaStats,
          losses: newLosses,
          currentStreak: 0,
          level: Math.max(1, Math.floor(totalGames / 5) + 1),
        },
        transactions: [
          {
            id: makeId(),
            type: 'arena_loss' as const,
            amount: entryFee,
            token: 'AGL',
            description: `Arena loss vs ${opponent}`,
            timestamp: Date.now(),
            status: 'completed' as const,
            counterparty: opponent,
            hash: makeHash(),
          },
          ...s.transactions,
        ],
      };
    }),

  purchaseNFT: (name, price) => {
    const { aglBalance } = get();
    if (aglBalance < price) return false;
    set((s) => ({
      aglBalance: s.aglBalance - price,
      transactions: [
        {
          id: makeId(),
          type: 'nft_purchase' as const,
          amount: price,
          token: 'AGL',
          description: `Purchased ${name}`,
          timestamp: Date.now(),
          status: 'completed' as const,
          hash: makeHash(),
        },
        ...s.transactions,
      ],
    }));
    return true;
  },

  addTransaction: (tx) =>
    set((s) => ({
      transactions: [
        { ...tx, id: makeId(), hash: makeHash(), timestamp: Date.now() },
        ...s.transactions,
      ],
    })),
}));
