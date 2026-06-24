import apiClient from './api';

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  hash: string;
  type: 'send' | 'receive' | 'swap';
}

export const fetchTransactionHistory = async (
  userAddress: string,
  limit: number = 50
): Promise<Transaction[]> => {
  try {
    const response = await apiClient.get(`/api/transactions/${userAddress}`, {
      params: { limit },
    });
    return response.data.transactions || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const getTransactionDetails = async (txHash: string): Promise<Transaction | null> => {
  try {
    const response = await apiClient.get(`/api/transactions/details/${txHash}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return null;
  }
};

export interface PushNotificationConfig {
  enabled: boolean;
  tokenTransfers: boolean;
  gameEvents: boolean;
  achievements: boolean;
}

export const setPushNotifications = async (
  userAddress: string,
  config: PushNotificationConfig
): Promise<boolean> => {
  try {
    await apiClient.post(`/api/notifications/${userAddress}`, config);
    return true;
  } catch (error) {
    console.error('Error setting push notifications:', error);
    return false;
  }
};

export const sendTestNotification = async (userAddress: string): Promise<boolean> => {
  try {
    await apiClient.post(`/api/notifications/${userAddress}/test`);
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};
