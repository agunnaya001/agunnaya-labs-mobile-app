import apiClient from './api';
import { COINGECKO_API } from '@config/contracts';

export interface TokenPrice {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

export const getTokenPrices = async (tokenIds: string[]): Promise<TokenPrice> => {
  try {
    const response = await apiClient.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: tokenIds.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return {};
  }
};

export const getPortfolioValue = async (
  tokens: Array<{ balance: number; price: number }>
): Promise<number> => {
  return tokens.reduce((total, token) => total + token.balance * token.price, 0);
};

export interface SwapQuote {
  from: string;
  to: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  priceImpact: string;
  minReceived: string;
}

export const get1InchSwapQuote = async (
  fromToken: string,
  toToken: string,
  amount: string,
  userAddress: string
): Promise<SwapQuote | null> => {
  try {
    const response = await apiClient.get('https://api.1inch.io/v5.2/8453/swap', {
      params: {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount,
        fromAddress: userAddress,
        slippage: 1,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching swap quote:', error);
    return null;
  }
};

export const executeSwap = async (
  swapData: SwapQuote,
  signer: any
): Promise<string | null> => {
  try {
    // This would typically call a backend endpoint that handles the actual swap
    // For now, return the transaction hash format
    const tx = await signer.sendTransaction({
      to: swapData.from,
      data: swapData.toAmount, // Placeholder - actual implementation differs
      value: 0,
    });
    return tx.hash;
  } catch (error) {
    console.error('Error executing swap:', error);
    return null;
  }
};
