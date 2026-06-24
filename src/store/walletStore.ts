import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  bestStreak: number;
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
  arenaBalance: number;
  arenaStats: ArenaStats;
  transactions: LocalTx[];
  lastClaimedAt: number | null;

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
  claimDailyReward: () => { ok: boolean; amount: number; message: string };
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function makeHash() {
  return (
    '0x' +
    Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  );
}

const DAILY_REWARD_AGL = 50;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DEFAULT_STATS: ArenaStats = {
  wins: 0,
  losses: 0,
  totalEarned: 0,
  currentStreak: 0,
  bestStreak: 0,
  level: 1,
};

function webStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (_key: string) => null,
    setItem: (_key: string, _value: string) => {},
    removeItem: (_key: string) => {},
  };
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      user: null,
      isConnected: false,
      isConnecting: false,
      aglBalance: 500,
      arenaBalance: 0,
      arenaStats: DEFAULT_STATS,
      transactions: [],
      lastClaimedAt: null,

      connect: (address, ensName) =>
        set({ user: { address, ensName }, isConnected: true, isConnecting: false }),

      disconnect: () =>
        set({
          user: null,
          isConnected: false,
          isConnecting: false,
          aglBalance: 500,
          arenaBalance: 0,
          arenaStats: DEFAULT_STATS,
          transactions: [],
          lastClaimedAt: null,
        }),

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
              bestStreak: Math.max(s.arenaStats.bestStreak, newStreak),
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

      claimDailyReward: () => {
        const { lastClaimedAt, isConnected } = get();
        if (!isConnected) {
          return { ok: false, amount: 0, message: 'Connect your wallet first' };
        }
        const now = Date.now();
        if (lastClaimedAt && now - lastClaimedAt < MS_PER_DAY) {
          const remaining = MS_PER_DAY - (now - lastClaimedAt);
          const hours = Math.floor(remaining / 3600000);
          const mins = Math.floor((remaining % 3600000) / 60000);
          return {
            ok: false,
            amount: 0,
            message: `Next claim in ${hours}h ${mins}m`,
          };
        }
        set((s) => ({
          aglBalance: s.aglBalance + DAILY_REWARD_AGL,
          lastClaimedAt: now,
          transactions: [
            {
              id: makeId(),
              type: 'receive' as const,
              amount: DAILY_REWARD_AGL,
              token: 'AGL',
              description: 'Daily AGL reward claimed',
              timestamp: now,
              status: 'completed' as const,
              hash: makeHash(),
            },
            ...s.transactions,
          ],
        }));
        return { ok: true, amount: DAILY_REWARD_AGL, message: `+${DAILY_REWARD_AGL} AGL claimed!` };
      },
    }),
    {
      name: 'agl-wallet-v1',
      storage: createJSONStorage(webStorage),
      partialize: (s) => ({
        user: s.user,
        isConnected: s.isConnected,
        aglBalance: s.aglBalance,
        arenaBalance: s.arenaBalance,
        arenaStats: s.arenaStats,
        transactions: s.transactions.slice(0, 100),
        lastClaimedAt: s.lastClaimedAt,
      }),
    },
  ),
);
