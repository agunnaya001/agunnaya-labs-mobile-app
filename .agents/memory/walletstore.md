---
name: Wallet Store
description: Zustand store setup — persist middleware, all state fields, actions, and daily reward mechanic.
---

Store file: `src/store/walletStore.ts`
Persist key: `agl-wallet-v1` (localStorage on web, no-op on native)

## Extra fields (beyond original)
- `arenaBalance: number` — ARENA token balance (on-chain via useARENABalance hook, displayed on wallet screen)
- `bestStreak: number` — inside ArenaStats; tracks max streak ever
- `lastClaimedAt: number | null` — Unix ms timestamp of last daily AGL claim

## Key actions
- `claimDailyReward()` — returns `{ ok, amount, message }`; enforces 24h cooldown; awards 50 AGL on success
- `recordWin()` — now also updates bestStreak

## Persist config
- Partializes to 100 most recent transactions only
- webStorage() helper returns localStorage on web, no-op object on native

**Why:** Persist was added so connected wallet + AGL balance + arena stats survive page refreshes, which is critical UX for a web3 app where users expect their state to persist.

**How to apply:** Any new state field that should survive reload must be added to the `partialize` return object.
