import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useWalletStore } from '@store/walletStore';
import { useState, useCallback } from 'react';
import { TOKEN_ADDRESSES } from '@config/contracts';
import { useTokenBalance, useNativeBalance, useTokenPrices } from '@hooks/useTokens';

const DEMO_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatBalance(balance: string, decimals = 4) {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0.0000';
  return num.toFixed(decimals);
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { user, isConnected, connect, disconnect } = useWalletStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const address = user?.address || null;

  const { data: ethBalance } = useNativeBalance(address);
  const { data: aglBalance } = useTokenBalance(
    TOKEN_ADDRESSES.AGL !== '0x' ? TOKEN_ADDRESSES.AGL : null,
    address
  );
  const { data: prices } = useTokenPrices(['ethereum', 'usd-coin']);

  const handleConnect = useCallback(() => {
    connect(DEMO_ADDRESS, 'vitalik.eth');
  }, [connect]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
  }, []);

  const ethPrice = prices?.['ethereum']?.usd || 0;
  const ethBalanceNum = parseFloat(ethBalance || '0');
  const ethValueUSD = ethBalanceNum * ethPrice;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>Agunnaya Labs</Text>
            <Text style={styles.headerSubtitle}>Web3 Ecosystem</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {!isConnected ? (
          /* Connect Wallet */
          <View style={styles.connectCard}>
            <View style={styles.connectIcon}>
              <Ionicons name="wallet" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.connectTitle}>Connect Your Wallet</Text>
            <Text style={styles.connectSubtitle}>
              Access AGL tokens, Arena gaming, and your NFT collection
            </Text>
            <TouchableOpacity style={styles.connectBtn} onPress={handleConnect}>
              <Ionicons name="link-outline" size={20} color="#fff" />
              <Text style={styles.connectBtnText}>Connect Wallet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Wallet Card */}
            <View style={styles.walletCard}>
              <View style={styles.walletCardTop}>
                <View style={styles.addressRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user?.ensName?.[0]?.toUpperCase() || address?.[2]?.toUpperCase() || 'W'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.ensName}>{user?.ensName || 'My Wallet'}</Text>
                    <Text style={styles.address}>{formatAddress(address!)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={disconnect}>
                  <Ionicons name="log-out-outline" size={22} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.balanceSeparator} />

              <View style={styles.totalBalanceRow}>
                <Text style={styles.totalLabel}>Total Value</Text>
                <Text style={styles.totalValue}>
                  ${ethValueUSD.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Token Balances */}
            <Text style={styles.sectionTitle}>Assets</Text>

            <View style={styles.tokenList}>
              <TokenRow
                symbol="ETH"
                name="Ethereum"
                balance={formatBalance(ethBalance || '0')}
                price={ethPrice}
                change={prices?.['ethereum']?.usd_24h_change}
                iconName="logo-bitcoin"
                iconColor="#627EEA"
              />
              <TokenRow
                symbol="AGL"
                name="Agunnaya Token"
                balance={formatBalance(aglBalance || '0')}
                price={0}
                iconName="diamond-outline"
                iconColor={Colors.primary}
              />
              <TokenRow
                symbol="USDC"
                name="USD Coin"
                balance="0.0000"
                price={1}
                change={0}
                iconName="cash-outline"
                iconColor={Colors.accent}
              />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <QuickAction icon="arrow-up-outline" label="Send" color={Colors.primary} />
              <QuickAction icon="arrow-down-outline" label="Receive" color={Colors.accent} />
              <QuickAction icon="swap-horizontal-outline" label="Swap" color={Colors.gold} />
              <QuickAction icon="add-outline" label="Buy" color={Colors.info} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TokenRow({
  symbol,
  name,
  balance,
  price,
  change,
  iconName,
  iconColor,
}: {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  change?: number;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
}) {
  const value = parseFloat(balance) * price;
  const changePositive = (change || 0) >= 0;

  return (
    <TouchableOpacity style={styles.tokenRow}>
      <View style={[styles.tokenIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenSymbol}>{symbol}</Text>
        <Text style={styles.tokenName}>{name}</Text>
      </View>
      <View style={styles.tokenBalance}>
        <Text style={styles.tokenAmount}>{balance}</Text>
        <Text style={styles.tokenValue}>
          {price > 0 ? `$${value.toFixed(2)}` : '—'}
          {change !== undefined && (
            <Text style={{ color: changePositive ? Colors.success : Colors.error }}>
              {' '}
              {changePositive ? '+' : ''}{change?.toFixed(2)}%
            </Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function QuickAction({
  icon,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
}) {
  return (
    <TouchableOpacity style={styles.quickAction}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: Platform.OS === 'web' ? 34 : 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLabel: { fontSize: 22, fontWeight: '700', color: Colors.text },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  connectCard: {
    margin: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  connectIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  connectTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  connectSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  connectBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  walletCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  walletCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  ensName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  address: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  balanceSeparator: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  totalBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: Colors.textSecondary },
  totalValue: { fontSize: 28, fontWeight: '700', color: Colors.text },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },

  tokenList: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tokenInfo: { flex: 1 },
  tokenSymbol: { fontSize: 16, fontWeight: '600', color: Colors.text },
  tokenName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  tokenBalance: { alignItems: 'flex-end' },
  tokenAmount: { fontSize: 16, fontWeight: '600', color: Colors.text },
  tokenValue: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
  },
  quickAction: { flex: 1, alignItems: 'center', gap: 8 },
  quickActionIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
});
