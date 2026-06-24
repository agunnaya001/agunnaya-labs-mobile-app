import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useWalletStore } from '@store/walletStore';
import { useTransactionHistory } from '@hooks/useTransactions';
import { Transaction } from '@services/transactions';
import { format } from 'date-fns';

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function txIcon(type: Transaction['type']) {
  switch (type) {
    case 'send': return { name: 'arrow-up-outline' as const, color: Colors.error, bg: Colors.error };
    case 'receive': return { name: 'arrow-down-outline' as const, color: Colors.success, bg: Colors.success };
    case 'swap': return { name: 'swap-horizontal-outline' as const, color: Colors.gold, bg: Colors.gold };
  }
}

function statusColor(status: Transaction['status']) {
  switch (status) {
    case 'completed': return Colors.success;
    case 'pending': return Colors.warning;
    case 'failed': return Colors.error;
  }
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { user, isConnected } = useWalletStore();
  const { data: transactions, isLoading } = useTransactionHistory(user?.address || null);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {!isConnected ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Connect Your Wallet</Text>
            <Text style={styles.emptySubtitle}>See your transaction history here</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : transactions && transactions.length > 0 ? (
          <View style={styles.txList}>
            {transactions.map((tx) => {
              const icon = txIcon(tx.type);
              return (
                <TouchableOpacity key={tx.id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: icon.bg + '20' }]}>
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txType}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</Text>
                    <Text style={styles.txAddress}>
                      {tx.type === 'receive' ? `From ${formatAddress(tx.from)}` : `To ${formatAddress(tx.to)}`}
                    </Text>
                    <Text style={styles.txDate}>
                      {format(new Date(tx.timestamp * 1000), 'MMM d, yyyy · HH:mm')}
                    </Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: tx.type === 'receive' ? Colors.success : Colors.text }]}>
                      {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.token}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor(tx.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor(tx.status) }]}>
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptySubtitle}>
              Your transaction history will appear here
            </Text>
          </View>
        )}

        {/* Summary cards (shown when connected) */}
        {isConnected && (
          <>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <SummaryCard
                label="Total Sent"
                value={transactions?.filter(t => t.type === 'send').length || 0}
                sublabel="transactions"
                icon="arrow-up-circle-outline"
                color={Colors.error}
              />
              <SummaryCard
                label="Total Received"
                value={transactions?.filter(t => t.type === 'receive').length || 0}
                sublabel="transactions"
                icon="arrow-down-circle-outline"
                color={Colors.success}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  sublabel,
  icon,
  color,
}: {
  label: string;
  value: number;
  sublabel: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <View style={[styles.summaryCard, { borderColor: color + '30' }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summarySublabel}>{sublabel}</Text>
    </View>
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
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  loadingState: {
    marginTop: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

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
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txType: { fontSize: 15, fontWeight: '600', color: Colors.text },
  txAddress: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  txDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 6 },
  txAmount: { fontSize: 15, fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600' },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  summaryValue: { fontSize: 28, fontWeight: '800', color: Colors.text },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  summarySublabel: { fontSize: 11, color: Colors.textMuted },
});
