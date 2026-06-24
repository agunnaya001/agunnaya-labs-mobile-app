import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useWalletStore, LocalTx } from '@store/walletStore';
import { format } from 'date-fns';

type TxType = LocalTx['type'];

const TX_META: Record<TxType, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; label: string }> = {
  arena_win: { icon: 'trophy', color: Colors.gold, label: 'Arena Win' },
  arena_loss: { icon: 'game-controller-outline', color: Colors.error, label: 'Arena Loss' },
  send: { icon: 'arrow-up-circle', color: Colors.primary, label: 'Sent' },
  receive: { icon: 'arrow-down-circle', color: Colors.success, label: 'Received' },
  nft_purchase: { icon: 'image', color: Colors.accent, label: 'NFT Purchase' },
  swap: { icon: 'swap-horizontal', color: Colors.gold, label: 'Swap' },
};

function TxRow({ tx }: { tx: LocalTx }) {
  const meta = TX_META[tx.type];
  const isPositive = tx.type === 'arena_win' || tx.type === 'receive';
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: meta.color + '20' }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={styles.txBody}>
        <Text style={styles.txLabel}>{meta.label}</Text>
        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
        <Text style={styles.txTime}>{format(new Date(tx.timestamp), 'MMM d · HH:mm')}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isPositive ? Colors.success : Colors.error }]}>
          {isPositive ? '+' : '−'}{tx.amount} {tx.token}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: Colors.success + '20' }]}>
          <Text style={[styles.statusText, { color: Colors.success }]}>{tx.status}</Text>
        </View>
      </View>
    </View>
  );
}

const TYPE_FILTERS: { key: TxType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'arena_win', label: 'Wins' },
  { key: 'arena_loss', label: 'Losses' },
  { key: 'send', label: 'Sends' },
  { key: 'nft_purchase', label: 'NFTs' },
  { key: 'swap', label: 'Swaps' },
];

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { isConnected, transactions, arenaStats, aglBalance } = useWalletStore();
  const [activeFilter, setActiveFilter] = useState<TxType | 'all'>('all');

  const filtered =
    activeFilter === 'all' ? transactions : transactions.filter((t) => t.type === activeFilter);

  const totalWon = transactions
    .filter((t) => t.type === 'arena_win')
    .reduce((s, t) => s + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => ['arena_loss', 'nft_purchase', 'send', 'swap'].includes(t.type))
    .reduce((s, t) => s + t.amount, 0);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          {isConnected && transactions.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{transactions.length} txns</Text>
            </View>
          )}
        </View>

        {!isConnected ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Connect Wallet</Text>
            <Text style={styles.emptySub}>Your transaction history will appear here</Text>
          </View>
        ) : (
          <>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderColor: Colors.success + '40' }]}>
                <Ionicons name="trending-up" size={20} color={Colors.success} />
                <Text style={styles.summaryValue}>+{totalWon}</Text>
                <Text style={styles.summaryLabel}>AGL Earned</Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: Colors.primary + '40' }]}>
                <Ionicons name="game-controller-outline" size={20} color={Colors.primary} />
                <Text style={styles.summaryValue}>{arenaStats.wins}W / {arenaStats.losses}L</Text>
                <Text style={styles.summaryLabel}>Arena Record</Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: Colors.gold + '40' }]}>
                <Ionicons name="diamond-outline" size={20} color={Colors.gold} />
                <Text style={styles.summaryValue}>{aglBalance.toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>AGL Balance</Text>
              </View>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="receipt-outline" size={48} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                <Text style={styles.emptySub}>Play Arena matches or send AGL to see history here</Text>
              </View>
            ) : (
              <>
                {/* Filter pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {TYPE_FILTERS.filter((f) =>
                    f.key === 'all' || transactions.some((t) => t.type === f.key)
                  ).map((f) => (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.filterPill, activeFilter === f.key && styles.filterPillActive]}
                      onPress={() => setActiveFilter(f.key)}
                    >
                      <Text
                        style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Transaction list */}
                <View style={styles.txList}>
                  {filtered.length === 0 ? (
                    <View style={styles.emptyFilter}>
                      <Text style={styles.emptyFilterText}>No {activeFilter} transactions</Text>
                    </View>
                  ) : (
                    filtered.map((tx) => <TxRow key={tx.id} tx={tx} />)
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Platform.OS === 'web' ? 34 : 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  countBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  summaryRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
  },
  summaryValue: { fontSize: 14, fontWeight: '800', color: Colors.text },
  summaryLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },

  emptyState: { alignItems: 'center', gap: 12, marginTop: 48, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },

  txList: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  txIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  txBody: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  txDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  txTime: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  txRight: { alignItems: 'flex-end', gap: 5 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },

  emptyFilter: { padding: 24, alignItems: 'center' },
  emptyFilterText: { color: Colors.textMuted, fontSize: 14 },
});
