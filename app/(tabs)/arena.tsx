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
import { usePlayerStats, useLeaderboard, usePlayerAchievements } from '@hooks/useGaming';

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ArenaScreen() {
  const insets = useSafeAreaInsets();
  const { user, isConnected } = useWalletStore();

  const { data: stats, isLoading: statsLoading } = usePlayerStats(user?.address || null);
  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard();
  const { data: achievements } = usePlayerAchievements(user?.address || null);

  const topPlayers = leaderboard?.slice(0, 5) || [];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Arena</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Play Card */}
        <View style={styles.playCard}>
          <View style={styles.playCardGlow} />
          <Ionicons name="game-controller" size={48} color={Colors.primary} style={styles.gameIcon} />
          <Text style={styles.playTitle}>Arena Gaming</Text>
          <Text style={styles.playSubtitle}>Compete, earn AGL tokens, and climb the leaderboard</Text>
          <TouchableOpacity
            style={[styles.playBtn, !isConnected && styles.playBtnDisabled]}
            disabled={!isConnected}
          >
            <Ionicons name="play-circle" size={22} color={isConnected ? '#fff' : Colors.textMuted} />
            <Text style={[styles.playBtnText, !isConnected && styles.playBtnTextDisabled]}>
              {isConnected ? 'Enter Arena' : 'Connect Wallet to Play'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Player Stats */}
        {isConnected && (
          <>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            {statsLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : stats ? (
              <View style={styles.statsGrid}>
                <StatCard label="Level" value={String(stats.level)} icon="trending-up" color={Colors.primary} />
                <StatCard label="Wins" value={String(stats.wins)} icon="trophy-outline" color={Colors.gold} />
                <StatCard label="Win Rate" value={`${stats.winRate}%`} icon="stats-chart-outline" color={Colors.accent} />
                <StatCard label="Streak" value={`${stats.currentStreak}🔥`} icon="flame-outline" color={Colors.error} />
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="game-controller-outline" size={36} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No stats yet — play your first game!</Text>
              </View>
            )}

            {/* Achievements */}
            {achievements && achievements.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
                  {achievements.map((a) => (
                    <View key={a.id} style={styles.achievementCard}>
                      <Text style={styles.achievementIcon}>{a.icon}</Text>
                      <Text style={styles.achievementName}>{a.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </>
        )}

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>Top Players</Text>
        {lbLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : topPlayers.length > 0 ? (
          <View style={styles.leaderboard}>
            {topPlayers.map((player, idx) => (
              <View key={player.address} style={styles.leaderboardRow}>
                <Text style={[styles.rank, idx < 3 && { color: Colors.gold }]}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${player.rank}`}
                </Text>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>
                    {player.username || formatAddress(player.address)}
                  </Text>
                  <Text style={styles.playerWins}>{player.wins} wins · Lv.{player.level}</Text>
                </View>
                <View style={styles.earningsTag}>
                  <Ionicons name="diamond-outline" size={12} color={Colors.primary} />
                  <Text style={styles.earningsText}>{player.earnings}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="podium-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Leaderboard is empty — be the first!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: color + '40' }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  liveText: { fontSize: 12, fontWeight: '700', color: Colors.error },

  playCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    overflow: 'hidden',
  },
  playCardGlow: {
    position: 'absolute',
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary + '15',
  },
  gameIcon: { marginBottom: 16 },
  playTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  playSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  playBtnDisabled: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  playBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  playBtnTextDisabled: { color: Colors.textMuted },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },

  loadingBox: {
    marginHorizontal: 20,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  emptyBox: {
    marginHorizontal: 20,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  emptyText: { color: Colors.textMuted, fontSize: 14 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary },

  achievementsScroll: { paddingLeft: 20, marginBottom: 8 },
  achievementCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    width: 100,
    gap: 8,
  },
  achievementIcon: { fontSize: 32 },
  achievementName: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },

  leaderboard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  rank: { fontSize: 20, width: 36, color: Colors.textSecondary, textAlign: 'center' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  playerWins: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  earningsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  earningsText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
