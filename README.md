# Agunnaya Labs — Mobile App

<div align="center">

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2051-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![EAS Hosting](https://img.shields.io/badge/EAS%20Hosting-Live-4630EB?style=for-the-badge&logo=expo&logoColor=white)](https://agunnayalabs--of7lv3du0x.expo.app)

[![Platform iOS](https://img.shields.io/badge/Platform-iOS-000000?style=flat-square&logo=apple&logoColor=white)](https://expo.dev)
[![Platform Android](https://img.shields.io/badge/Platform-Android-34A853?style=flat-square&logo=android&logoColor=white)](https://expo.dev)
[![Platform Web](https://img.shields.io/badge/Platform-Web-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://agunnayalabs--of7lv3du0x.expo.app)
[![Base Network](https://img.shields.io/badge/Network-Base-0052FF?style=flat-square&logo=coinbase&logoColor=white)](https://base.org)
[![License MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

**Unified Web3 mobile ecosystem — AGL token wallet · Arena gaming · NFT marketplace**

[Live App](https://agunnayalabs--of7lv3du0x.expo.app) · [EAS Dashboard](https://expo.dev/projects/8d5ef6e6-256d-4f6b-a21d-d8e9defc6b80)

</div>

---

## Overview

Agunnaya Labs is a cross-platform mobile-first application built for the AGL token ecosystem on the **Base** network. It combines a non-custodial wallet dashboard, a competitive staking arena, an NFT marketplace, and a full transaction history — all in one dark-mode UI.

---

## Features

| Feature | Description |
|---|---|
| **Wallet Dashboard** | View AGL & ETH balances with live CoinGecko prices, send tokens with address validation, receive via QR, and swap via 1inch |
| **Arena Gaming** | Stake AGL to enter skill-based matches across Recruit / Warrior / Champion tiers with streak bonuses and animated battles |
| **NFT Marketplace** | Browse and purchase Agunnaya Genesis, Arena Warriors, and AGL Founder NFTs with rarity tiers and floor-price display |
| **Transaction History** | Filterable activity feed covering arena wins/losses, sends, NFT purchases, and swaps with USD estimates |
| **Error Boundary** | App-wide React error boundary with graceful recovery UI |
| **Live Price Feeds** | Real-time ETH price via CoinGecko API with 24h change indicators |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Expo](https://expo.dev) SDK 51 + [React Native](https://reactnative.dev) 0.74 |
| **Routing** | [Expo Router](https://docs.expo.dev/router/introduction/) v3 (file-based) |
| **State** | [Zustand](https://github.com/pmndrs/zustand) v4 |
| **Data Fetching** | [TanStack Query](https://tanstack.com/query/latest) v5 |
| **Blockchain** | [Ethers.js](https://docs.ethers.org/) v6 on Base (chain ID 8453) |
| **Styling** | [NativeWind](https://www.nativewind.dev/) + StyleSheet |
| **HTTP** | [Axios](https://axios-http.com/) with interceptors |
| **Language** | TypeScript 5.3 |
| **Deployment** | [EAS Hosting](https://expo.dev/eas) + EAS Build |

---

## Project Structure

```
agunnaya-labs-mobile-app/
├── app/
│   ├── _layout.tsx          # Root layout — QueryClient, SafeArea, ErrorBoundary
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar configuration
│       ├── index.tsx        # Wallet dashboard
│       ├── arena.tsx        # Arena gaming
│       ├── nfts.tsx         # NFT marketplace
│       └── transactions.tsx # Transaction history
├── src/
│   ├── components/
│   │   └── ErrorBoundary.tsx
│   ├── config/
│   │   ├── contracts.ts     # Token addresses & API endpoints
│   │   └── walletConnect.ts # RPC URLs & WalletConnect metadata
│   ├── hooks/
│   │   ├── useTokens.ts     # Balance & price hooks + useRefreshData
│   │   ├── useGaming.ts     # Arena stats & leaderboard
│   │   ├── useNFTs.ts       # NFT collection hooks
│   │   └── useTransactions.ts
│   ├── services/
│   │   ├── api.ts           # Axios instance
│   │   ├── blockchain.ts    # Ethers.js — balance, token info
│   │   ├── tokens.ts        # CoinGecko + 1inch integration
│   │   ├── gaming.ts        # Arena API
│   │   ├── nfts.ts          # NFT API
│   │   └── transactions.ts  # Transaction history API
│   └── store/
│       └── walletStore.ts   # Zustand global state
├── constants/
│   └── colors.ts            # Dark-mode design tokens
├── assets/                  # Icons, splash, fonts
├── app.json                 # Expo config (EAS project linked)
└── eas.json                 # EAS build profiles
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- [EAS CLI](https://docs.expo.dev/eas/cli/) — `npm install -g eas-cli`

### Install

```bash
npm install --legacy-peer-deps
```

### Run

```bash
# Web (browser preview)
npx expo start --web

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android
```

---

## Environment Variables

Set these in Replit Secrets or a local `.env` file:

| Variable | Description | Required |
|---|---|---|
| `EXPO_TOKEN` | Expo account token for EAS CLI | EAS only |
| `EXPO_PUBLIC_API_URL` | Backend API base URL | Optional |
| `EXPO_PUBLIC_AGL_TOKEN_ADDRESS` | AGL ERC-20 contract address on Base | Optional |
| `EXPO_PUBLIC_ARNA_TOKEN_ADDRESS` | ARNA ERC-20 contract address on Base | Optional |
| `EXPO_PUBLIC_ALCHEMY_KEY` | Alchemy API key for RPC access | Optional |
| `EXPO_PUBLIC_OPENSEA_KEY` | OpenSea API key for NFT metadata | Optional |
| `EXPO_PUBLIC_BASE_RPC_URL` | Custom Base network RPC URL | Optional |
| `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Optional |

> **Note:** All `EXPO_PUBLIC_*` variables are bundled into the client. Do not include private keys or server-only secrets here.

---

## Deployment

### Web (EAS Hosting)

```bash
# Build web bundle
npx expo export --platform web

# Deploy to EAS Hosting
eas deploy --export-dir dist

# Promote to production
eas deploy --prod --export-dir dist
```

**Live URL:** https://agunnayalabs--of7lv3du0x.expo.app

### Native (EAS Build)

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

---

## Architecture Notes

### State Management
The `walletStore` (Zustand) is the single source of truth for wallet connection, AGL balance, arena stats, and local transaction history. All mutations are synchronous and side-effect free.

### Blockchain Integration
`src/services/blockchain.ts` uses Ethers.js v6 with a singleton `JsonRpcProvider` connected to Base mainnet (`chainId: 8453`). Token balances are fetched read-only; write operations (send, swap) are currently simulated locally pending wallet signer integration.

### Data Fetching
TanStack Query manages all async state with stale-while-revalidate caching. Balance queries refresh every 30s; price data every 60s. `useRefreshData()` invalidates and refetches all active queries on pull-to-refresh.

### Security
- Non-custodial by design — no private keys are stored
- Input validation on all send/swap forms (EIP-55 address format + ENS regex)
- App-wide error boundary prevents cascading UI failures
- All API calls route through an Axios interceptor for centralized error logging
- Exponential back-off retry on failed queries (max 10s delay)

---

## License

[MIT](./LICENSE) © Agunnaya Labs
