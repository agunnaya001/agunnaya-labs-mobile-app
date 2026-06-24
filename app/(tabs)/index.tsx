import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useWalletStore } from '@store/walletStore';
import { useState, useCallback } from 'react';
import { useNativeBalance, useTokenPrices, useRefreshData } from '@hooks/useTokens';
import { useARENABalance } from '@hooks/useContracts';

const DEMO_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const AGL_USD_PRICE = 0.042;
const ARENA_USD_PRICE = 0.0085;

const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const ENS_REGEX = /^[a-zA-Z0-9-]+\.eth$/;

function isValidAddress(input: string) {
  return ETH_ADDRESS_REGEX.test(input) || ENS_REGEX.test(input);
}

function formatAddress(a: string) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

async function copyToClipboard(text: string) {
  if (Platform.OS === 'web') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

type ActionModal = 'send' | 'receive' | 'swap' | null;

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const {
    user, isConnected, aglBalance, arenaBalance,
    connect, disconnect, sendAGL, addTransaction, spendAGL,
    claimDailyReward, lastClaimedAt,
  } = useWalletStore();

  const [activeModal, setActiveModal] = useState<ActionModal>(null);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [swapFrom, setSwapFrom] = useState<'AGL' | 'ARENA'>('AGL');
  const [swapAmount, setSwapAmount] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);
  const [claimResult, setClaimResult] = useState<{ ok: boolean; message: string } | null>(null);

  const address = user?.address ?? null;
  const { data: ethBalance } = useNativeBalance(address);
  const { data: prices } = useTokenPrices(['ethereum']);
  const { data: arenaOnChain } = useARENABalance(address);
  const { refresh, isRefreshing } = useRefreshData();

  const ethPrice = prices?.['ethereum']?.usd ?? 0;
  const ethNum = parseFloat(ethBalance ?? '0');
  const ethUSD = ethNum * ethPrice;
  const aglUSD = aglBalance * AGL_USD_PRICE;
  const arenaUSD = (arenaBalance || parseFloat(arenaOnChain ?? '0')) * ARENA_USD_PRICE;
  const totalUSD = ethUSD + aglUSD + arenaUSD;

  const canClaimToday = !lastClaimedAt || Date.now() - lastClaimedAt >= 24 * 60 * 60 * 1000;

  const showSuccess = useCallback((msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  }, []);

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    const ok = await copyToClipboard(address);
    if (ok) {
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } else {
      Alert.alert('Wallet Address', address, [{ text: 'Close', style: 'cancel' }]);
    }
  }, [address]);

  const handleClaim = useCallback(() => {
    const result = claimDailyReward();
    setClaimResult(result);
    if (result.ok) showSuccess(result.message);
    setTimeout(() => setClaimResult(null), 3000);
  }, [claimDailyReward, showSuccess]);

  const sendAddressError =
    sendAddress.length > 3 && !isValidAddress(sendAddress)
      ? 'Enter a valid 0x address or ENS name'
      : null;

  const handleSend = useCallback(() => {
    const amount = parseFloat(sendAmount);
    if (!sendAddress || isNaN(amount) || amount <= 0) return;
    if (!isValidAddress(sendAddress)) return;
    const ok = sendAGL(amount, sendAddress);
    if (ok) {
      showSuccess(`Sent ${amount} AGL to ${formatAddress(sendAddress)}`);
      setSendAddress('');
      setSendAmount('');
      setActiveModal(null);
    }
  }, [sendAddress, sendAmount, sendAGL, showSuccess]);

  const handleSwap = useCallback(() => {
    const amount = parseFloat(swapAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (swapFrom === 'AGL' && aglBalance < amount) return;
    const toToken = swapFrom === 'AGL' ? 'ARENA' : 'AGL';
    addTransaction({
      type: 'swap',
      amount,
      token: swapFrom,
      description: `Swapped ${amount} ${swapFrom} → ${toToken}`,
      status: 'completed',
      counterparty: '1inch Router',
    });
    if (swapFrom === 'AGL') spendAGL(amount);
    showSuccess(`Swapped ${amount} ${swapFrom} → ${toToken}`);
    setSwapAmount('');
    setActiveModal(null);
  }, [swapAmount, swapFrom, aglBalance, addTransaction, spendAGL, showSuccess]);

  const canSend =
    !!sendAddress &&
    !!sendAmount &&
    !sendAddressError &&
    parseFloat(sendAmount) > 0 &&
    parseFloat(sendAmount) <= aglBalance;

  const arenaDisplayBalance = arenaBalance || parseFloat(arenaOnChain ?? '0');

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>Agunnaya Labs</Text>
            <Text style={styles.headerSub}>Web3 Ecosystem · Base</Text>
          </View>
          <View style={styles.networkBadge}>
            <View style={styles.networkDot} />
            <Text style={styles.networkText}>Base Mainnet</Text>
          </View>
        </View>

        {/* Toasts */}
        {actionSuccess && (
          <View style={styles.successToast}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.successText}>{actionSuccess}</Text>
          </View>
        )}
        {claimResult && !claimResult.ok && (
          <View style={styles.infoToast}>
            <Ionicons name="time-outline" size={16} color={Colors.gold} />
            <Text style={styles.infoToastText}>{claimResult.message}</Text>
          </View>
        )}

        {!isConnected ? (
          <View style={styles.connectCard}>
            <View style={styles.connectGlow} />
            <View style={styles.connectIcon}>
              <Ionicons name="wallet" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.connectTitle}>Connect Your Wallet</Text>
            <Text style={styles.connectSub}>
              Access AGL tokens, Arena gaming, and your NFT collection on Base
            </Text>
            <TouchableOpacity style={styles.connectBtn} onPress={() => connect(DEMO_ADDRESS, 'vitalik.eth')}>
              <Ionicons name="link-outline" size={20} color="#fff" />
              <Text style={styles.connectBtnText}>Connect Wallet</Text>
            </TouchableOpacity>
            <Text style={styles.connectNote}>Demo mode · No real assets required</Text>
          </View>
        ) : (
          <>
            {/* Portfolio card */}
            <View style={styles.portfolioCard}>
              <View style={styles.portfolioTop}>
                <View style={styles.addressRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user?.ensName?.[0]?.toUpperCase() ?? 'W'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.ensName}>{user?.ensName ?? 'My Wallet'}</Text>
                    <TouchableOpacity style={styles.addressCopyRow} onPress={handleCopyAddress} activeOpacity={0.7}>
                      <Text style={styles.addressText}>{formatAddress(address!)}</Text>
                      <Ionicons
                        name={addressCopied ? 'checkmark-outline' : 'copy-outline'}
                        size={13}
                        color={addressCopied ? Colors.success : Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={disconnect} style={styles.logoutBtn}>
                  <Ionicons name="log-out-outline" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>Total Portfolio</Text>
                  <Text style={styles.totalValue}>${totalUSD.toFixed(2)}</Text>
                </View>
                <View style={styles.aglPill}>
                  <Ionicons name="diamond" size={13} color={Colors.primary} />
                  <Text style={styles.aglPillText}>{aglBalance.toLocaleString()} AGL</Text>
                </View>
              </View>

              {/* Mini chart */}
              <View style={styles.miniChart}>
                {[40, 55, 45, 70, 60, 80, 75, 90, 85, 95].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.chartBar,
                      { height: h * 0.5, backgroundColor: i === 9 ? Colors.primary : Colors.primary + '40' },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Daily Claim */}
            <TouchableOpacity
              style={[styles.dailyClaimBtn, !canClaimToday && styles.dailyClaimBtnDimmed]}
              onPress={handleClaim}
              activeOpacity={0.85}
            >
              <View style={styles.dailyClaimLeft}>
                <View style={styles.dailyClaimIcon}>
                  <Ionicons name="gift" size={22} color={canClaimToday ? Colors.gold : Colors.textMuted} />
                </View>
                <View>
                  <Text style={styles.dailyClaimTitle}>
                    {canClaimToday ? 'Daily AGL Reward' : 'Already Claimed Today'}
                  </Text>
                  <Text style={styles.dailyClaimSub}>
                    {canClaimToday ? 'Tap to claim 50 free AGL' : 'Come back tomorrow for more'}
                  </Text>
                </View>
              </View>
              {canClaimToday ? (
                <View style={styles.dailyClaimBadge}>
                  <Text style={styles.dailyClaimBadgeText}>+50 AGL</Text>
                </View>
              ) : (
                <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
              )}
            </TouchableOpacity>

            {/* Quick actions */}
            <View style={styles.actionsRow}>
              {([
                { icon: 'arrow-up-outline', label: 'Send', color: Colors.primary, action: 'send' },
                { icon: 'arrow-down-outline', label: 'Receive', color: Colors.accent, action: 'receive' },
                { icon: 'swap-horizontal-outline', label: 'Swap', color: Colors.gold, action: 'swap' },
              ] as const).map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={styles.actionBtn}
                  onPress={() => setActiveModal(a.action as ActionModal)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
                    <Ionicons name={a.icon as any} size={22} color={a.color} />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Assets */}
            <Text style={styles.sectionTitle}>Assets</Text>
            <View style={styles.assetList}>
              <AssetRow
                symbol="AGL"
                name="Agunnaya Labs Token"
                balance={aglBalance.toFixed(2)}
                valueUSD={aglUSD}
                change={+5.3}
                iconName="diamond"
                iconColor={Colors.primary}
              />
              <AssetRow
                symbol="ARENA"
                name="Arena Token"
                balance={arenaDisplayBalance > 0 ? arenaDisplayBalance.toFixed(4) : '0.0000'}
                valueUSD={arenaUSD}
                change={+12.7}
                iconName="game-controller"
                iconColor={Colors.accent}
              />
              <AssetRow
                symbol="ETH"
                name="Ethereum"
                balance={ethNum.toFixed(4)}
                valueUSD={ethUSD}
                change={prices?.['ethereum']?.usd_24h_change}
                iconName="logo-bitcoin"
                iconColor="#627EEA"
              />
              <AssetRow
                symbol="USDC"
                name="USD Coin"
                balance="0.00"
                valueUSD={0}
                change={0}
                iconName="cash-outline"
                iconColor={Colors.accent}
              />
            </View>

            {/* Security */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.accent} />
              <Text style={styles.securityText}>Non-custodial · Your keys, your tokens · Base Network</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Send Modal */}
      <Modal visible={activeModal === 'send'} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Send AGL</Text>
            <Text style={styles.sheetSub}>Balance: {aglBalance.toLocaleString()} AGL</Text>

            <Text style={styles.inputLabel}>Recipient Address</Text>
            <TextInput
              style={[styles.input, sendAddressError ? styles.inputError : null]}
              value={sendAddress}
              onChangeText={setSendAddress}
              placeholder="0x... or ENS name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {sendAddressError && <Text style={styles.inputErrorText}>{sendAddressError}</Text>}

            <Text style={styles.inputLabel}>Amount (AGL)</Text>
            <TextInput
              style={styles.input}
              value={sendAmount}
              onChangeText={setSendAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />
            {parseFloat(sendAmount) > aglBalance && (
              <Text style={styles.inputErrorText}>Exceeds available balance</Text>
            )}
            {parseFloat(sendAmount) > 0 && (
              <Text style={styles.usdEstimate}>≈ ${(parseFloat(sendAmount) * AGL_USD_PRICE).toFixed(4)} USD</Text>
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !canSend && styles.confirmBtnDisabled]}
                onPress={handleSend}
                disabled={!canSend}
              >
                <Ionicons name="arrow-up-outline" size={18} color="#fff" />
                <Text style={styles.confirmText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Receive Modal */}
      <Modal visible={activeModal === 'receive'} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Receive Tokens</Text>
            <Text style={styles.sheetSub}>Share your address to receive AGL or ARENA</Text>

            <View style={styles.qrPlaceholder}>
              <View style={styles.qrInner}>
                <Ionicons name="qr-code-outline" size={80} color={Colors.primary} />
              </View>
            </View>

            <TouchableOpacity style={styles.addressBox} onPress={handleCopyAddress} activeOpacity={0.8}>
              <Text style={styles.addressBoxText} selectable>{address}</Text>
              <Ionicons
                name={addressCopied ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color={addressCopied ? Colors.success : Colors.primary}
              />
            </TouchableOpacity>
            {addressCopied && <Text style={styles.copiedText}>Copied to clipboard!</Text>}
            <Text style={styles.receiveNote}>Only send tokens on Base network (Chain ID: 8453)</Text>

            <TouchableOpacity style={styles.closeBtnFull} onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Swap Modal */}
      <Modal visible={activeModal === 'swap'} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Swap Tokens</Text>
            <Text style={styles.sheetSub}>Powered by 1inch on Base</Text>

            <View style={styles.swapRow}>
              <View style={styles.swapToken}>
                <Text style={styles.swapTokenLabel}>From</Text>
                <TouchableOpacity
                  style={styles.swapTokenBtn}
                  onPress={() => setSwapFrom(swapFrom === 'AGL' ? 'ARENA' : 'AGL')}
                >
                  <Ionicons
                    name={swapFrom === 'AGL' ? 'diamond-outline' : 'game-controller-outline'}
                    size={18}
                    color={Colors.primary}
                  />
                  <Text style={styles.swapTokenName}>{swapFrom}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.swapArrowCircle}>
                <Ionicons name="swap-horizontal" size={18} color={Colors.gold} />
              </View>
              <View style={styles.swapToken}>
                <Text style={styles.swapTokenLabel}>To</Text>
                <View style={[styles.swapTokenBtn, { opacity: 0.7 }]}>
                  <Ionicons
                    name={swapFrom === 'AGL' ? 'game-controller-outline' : 'diamond-outline'}
                    size={18}
                    color={Colors.accent}
                  />
                  <Text style={styles.swapTokenName}>{swapFrom === 'AGL' ? 'ARENA' : 'AGL'}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              value={swapAmount}
              onChangeText={setSwapAmount}
              placeholder={`0.00 ${swapFrom}`}
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />
            {swapFrom === 'AGL' && parseFloat(swapAmount) > aglBalance && (
              <Text style={styles.inputErrorText}>Exceeds available AGL balance</Text>
            )}

            {parseFloat(swapAmount) > 0 && (
              <View style={styles.swapEstimate}>
                <Text style={styles.swapEstimateLabel}>You receive ≈</Text>
                <Text style={styles.swapEstimateValue}>
                  {swapFrom === 'AGL'
                    ? `${(parseFloat(swapAmount) * AGL_USD_PRICE / Math.max(ARENA_USD_PRICE, 0.000001)).toFixed(2)} ARENA`
                    : `${(parseFloat(swapAmount) * ARENA_USD_PRICE / Math.max(AGL_USD_PRICE, 0.000001)).toFixed(4)} AGL`}
                </Text>
              </View>
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !swapAmount && styles.confirmBtnDisabled]}
                onPress={handleSwap}
                disabled={!swapAmount}
              >
                <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
                <Text style={styles.confirmText}>Swap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function AssetRow({
  symbol, name, balance, valueUSD, change, iconName, iconColor,
}: {
  symbol: string; name: string; balance: string;
  valueUSD: number; change?: number; iconName: any; iconColor: string;
}) {
  const pos = (change ?? 0) >= 0;
  return (
    <View style={styles.assetRow}>
      <View style={[styles.assetIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.assetInfo}>
        <Text style={styles.assetSymbol}>{symbol}</Text>
        <Text style={styles.assetName}>{name}</Text>
      </View>
      <View style={styles.assetRight}>
        <Text style={styles.assetBalance}>{balance}</Text>
        <View style={styles.assetValueRow}>
          <Text style={styles.assetUSD}>${valueUSD.toFixed(2)}</Text>
          {change !== undefined && (
            <Text style={[styles.assetChange, { color: pos ? Colors.success : Colors.error }]}>
              {pos ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: Platform.OS === 'web' ? 34 : 24 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  headerLabel: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  networkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
  },
  networkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  networkText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  successToast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 8, backgroundColor: Colors.success + '20',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.success + '40',
  },
  successText: { fontSize: 13, color: Colors.success, flex: 1 },
  infoToast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 8, backgroundColor: Colors.gold + '15',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  infoToastText: { fontSize: 13, color: Colors.gold, flex: 1 },

  connectCard: {
    margin: 20, backgroundColor: Colors.surface, borderRadius: 24, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '30', overflow: 'hidden',
  },
  connectGlow: {
    position: 'absolute', top: -80, width: 200, height: 200,
    borderRadius: 100, backgroundColor: Colors.primary + '10',
  },
  connectIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  connectTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 10, textAlign: 'center' },
  connectSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, marginBottom: 12,
  },
  connectBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  connectNote: { fontSize: 12, color: Colors.textMuted },

  portfolioCard: {
    marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  portfolioTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary + '30',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary + '50',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  ensName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  addressCopyRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  addressText: { fontSize: 12, color: Colors.textMuted },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  totalLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  totalValue: { fontSize: 32, fontWeight: '800', color: Colors.text },
  aglPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary + '20', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.primary + '40',
  },
  aglPillText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 50, marginTop: 16, paddingTop: 4 },
  chartBar: { flex: 1, borderRadius: 3 },

  dailyClaimBtn: {
    marginHorizontal: 20, marginTop: 14, backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.gold + '40',
  },
  dailyClaimBtnDimmed: { borderColor: Colors.border, opacity: 0.7 },
  dailyClaimLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dailyClaimIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  dailyClaimTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  dailyClaimSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  dailyClaimBadge: {
    backgroundColor: Colors.gold + '25', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.gold + '50',
  },
  dailyClaimBadgeText: { fontSize: 13, fontWeight: '800', color: Colors.gold },

  actionsRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, gap: 12 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.text,
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  assetList: {
    marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  assetRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  assetIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  assetInfo: { flex: 1 },
  assetSymbol: { fontSize: 15, fontWeight: '700', color: Colors.text },
  assetName: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  assetRight: { alignItems: 'flex-end', gap: 3 },
  assetBalance: { fontSize: 15, fontWeight: '700', color: Colors.text },
  assetValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assetUSD: { fontSize: 12, color: Colors.textMuted },
  assetChange: { fontSize: 11, fontWeight: '600' },

  securityNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 16, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.accent + '10', borderRadius: 10,
    borderWidth: 1, borderColor: Colors.accent + '25',
  },
  securityText: { fontSize: 12, color: Colors.accent, fontWeight: '500' },

  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'web' ? 40 : 32,
    borderTopWidth: 1, borderTopColor: Colors.border, gap: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 8,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  sheetSub: { fontSize: 13, color: Colors.textMuted },
  inputLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginTop: 4 },
  input: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, color: Colors.text,
    fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.error },
  inputErrorText: { fontSize: 12, color: Colors.error, marginTop: -6 },
  usdEstimate: { fontSize: 12, color: Colors.textMuted, textAlign: 'right' },

  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  confirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.primary,
  },
  confirmBtnDisabled: { backgroundColor: Colors.border, opacity: 0.6 },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  qrPlaceholder: { alignItems: 'center', paddingVertical: 12 },
  qrInner: {
    width: 160, height: 160, borderRadius: 16, backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  addressBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  addressBoxText: {
    fontSize: 12, color: Colors.text, flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copiedText: { fontSize: 12, color: Colors.success, textAlign: 'center', marginTop: -4 },
  receiveNote: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  closeBtnFull: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  swapRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swapToken: { flex: 1, gap: 6 },
  swapTokenLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  swapTokenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surfaceElevated, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  swapTokenName: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  swapArrowCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold + '20',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.gold + '40', marginTop: 22,
  },
  swapEstimate: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  swapEstimateLabel: { fontSize: 13, color: Colors.textMuted },
  swapEstimateValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
});
