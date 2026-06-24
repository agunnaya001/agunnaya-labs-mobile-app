---
name: Agunnaya Labs Contract Addresses
description: Real Base mainnet contract addresses for all AGL ecosystem contracts
---

All contracts live on **Base mainnet** (chain ID 8453).

| Contract | Address |
|---|---|
| AGL Token (ERC-20) | 0xEA1221B4d80A89BD8C75248Fae7c176BD1854698 |
| ARNA Token (ERC-20) | 0x3b855F88CB93aA642EaEB13F59987C552Fc614b5 |
| Arena Champion NFT (ERC-721) | 0x68f08b005b09B0F7D07E1c0B5CDe18E43CE2486A |
| Arena Battle PVE | 0xF6fc2B6a306B626548ca9dF25B31a22D0f8971CF |
| Arena PVP | 0xd0C4Af12E95f9590e7314D079C58597771E57533 |
| Arena Marketplace | 0x67817157Dd6E5945ac2fAf1a822e7f1dE26C698E |

**Source of truth:** `src/config/contracts.ts`

**Why:** These are real deployed contracts — never use placeholder addresses.

**How to apply:** Any new feature touching tokens, NFTs, arena, or marketplace must import from `@config/contracts` rather than hardcoding addresses.
