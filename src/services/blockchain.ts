import { ethers } from 'ethers';
import { RPC_URLS, CHAIN_ID } from '@config/walletConnect';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
];

let provider: ethers.Provider | null = null;

export const getProvider = () => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URLS[CHAIN_ID]);
  }
  return provider;
};

export const getTokenBalance = async (
  tokenAddress: string,
  userAddress: string
): Promise<string> => {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(userAddress);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return '0';
  }
};

export const getNativeBalance = async (userAddress: string): Promise<string> => {
  try {
    const provider = getProvider();
    const balance = await provider.getBalance(userAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error fetching native balance:', error);
    return '0';
  }
};

export const getTokenInfo = async (tokenAddress: string) => {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);
    return { name, symbol, decimals };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
};
