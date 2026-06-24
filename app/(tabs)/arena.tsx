import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useWalletStore } from '@store/walletStore';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ARENA_ADDRESSES } from '@config/contracts';

const BASE_EXPLORER = 'https://basescan.org/address/';

type Phase = 'lobby' | 'matchmaking' | 'battle' | 'result';
type ArenaTab = 'play' | 'leaderboard';

interface MatchResult {
  won: boolean;
  entryFee: number;
  reward: number;
  opponent: string;
}

const TIERS = [
  {
    label: 'Recruit',
    entry: 5,
    reward: 9,
    multiplier: '1.8x',
    color: Colors.accent,
    icon: 'shield-outline' as const,
    desc: 'Low risk · Great for beginners',
  },
  {
    label: 'Warrior',
    entry: 25,
    reward: 47,
    multiplier: '1.88x',
    color: Colors.primary,
    icon: 'flash-outline' as const,
    desc: 'Mid stakes · Popular tier',
    popular: true,
  },
  {
    label: 'Champion',
    entry: 100,
    reward: 195,
    multiplier: '1.95x',
    color: Colors.gold,
    icon: 'trophy-outline' as const,
    desc: 'High stakes · Max rewards',
  },
];

const FAKE_OPPONENTS = [
  'vitalik.eth', '0xA3f2...4d1B', 'CryptoArena99', '0xBe91...22cF',
  'GLadius.eth', 'NightOwl.eth', '0xF44c...8aE3', 'ArenaMaster',
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'CryptoKing.eth',   wins: 247, losses: 89,  earned: 4820, streak: 12 },
  { rank: 2, name: '0xF44c...8aE3',    wins: 198, losses: 71,  earned: 3960, streak: 7  },
  { rank: 3, name: 'NightOwl.eth',     wins: 183, losses: 94,  earned: 3410, streak: 5  },
  { rank: 4, name: 'GLadius.eth',      wins: 156, losses: 88,  earned: 2890, streak: 3  },
  { rank: 5, name: 'ArenaLegend',      wins: 134, losses: 67,  earned: 2540, streak: 8  },
  { rank: 6, name: '0xBe91...22cF',    wins: 121, losses: 80,  earned: 2100, streak: 2  },
  { rank: 7, name: 'vitalik.eth',      wins: 118, losses: 55,  earned: 1980, streak: 4  },
  { rank: 8, name: 'CryptoArena99',    wins: 102, losses: 78,  earned: 1740, streak: 1  },
  { rank: 9, name: '0xA3f2...4d1B',    wins: 97,  losses: 62,  earned: 1620, streak: 0  },
  { rank: 10, name: 'StormRider.eth',  wins: 88,  losses: 54,  earned: 1430, streak: 6  },
];

function randomOpponent() {
  return FAKE_OPPONENTS[Math.floor(Math.random() * FAKE_OPPONENTS.length)];
}
function winProbability(streak: number) {
  return Math.min(0.52 + streak * 0.03, 0.64);
}

export default function ArenaScreen() {
  const insets = useSafeAreaInsets();
  const { user, isConnected, aglBalance, arenaStats, spendAGL, recordWin, recordLoss } =
    useWalletStore();

  const [activeTab, setActiveTab] = useState<ArenaTab>('play');
  const [phase, setPhase] = useState<Phase>('lobby');
  const [selectedTier, setSelectedTier] = useState<(typeof TIERS)[0] | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchmakingDots, setMatchmakingDots] = useState('');
  const [battleCount, setBattleCount] = useState(3);
  const [battlePhase, setBattlePhase] = useState<'countdown' | 'fighting' | 'done'>('countdown');
  const [currentOpponent, setCurrentOpponent] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const winRate =
    arenaStats.wins + arenaStats.losses > 0
      ? Math.round((arenaStats.wins / (arenaStats.wins + arenaStats.losses)) * 100)
      : 0;

  const totalGames = arenaStats.wins + arenaStats.losses;
  const netPL = arenaStats.totalEarned;

  useEffect(() => {
    if (phase === 'matchmaking') {
      const i = setInterval(() => setMatchmakingDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
      return () => clearInterval(i);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'matchmaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'result') {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      ]).start();
    }
  }, [phase]);

  const startMatchmaking = useCallback(
    (tier: (typeof TIERS)[0]) => {
      if (aglBalance < tier.entry) return;
      const opponent = randomOpponent();
      setCurrentOpponent(opponent);
      setSelectedTier(tier);
      setPhase('matchmaking');
      spendAGL(tier.entry);

      setTimeout(() => {
        setPhase('battle');
        setBattleCount(3);
        setBattlePhase('countdown');

        const countDown = (n: number) => {
          setBattleCount(n);
          if (n > 0) {
            setTimeout(() => countDown(n - 1), 1000);
          } else {
            setBattlePhase('fighting');
            Animated.sequence([
              Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
            ]).start();

            setTimeout(() => {
              const won = Math.random() < winProbability(arenaStats.currentStreak);
              if (won) {
                recordWin(tier.entry, tier.reward, opponent);
              } else {
                recordLoss(tier.entry, opponent);
              }
              setMatchResult({ won, entryFee: tier.entry, reward: won ? tier.reward : 0, opponent });
              setBattlePhase('done');
              setPhase('result');
            }, 2500);
          }
        };
        countDown(3);
      }, 3000);
    },
    [aglBalance, arenaStats.currentStreak, spendAGL, recordWin, recordLoss],
  );

  const resetToLobby = useCallback(() => {
    setPhase('lobby');
    setSelectedTier(null);
    setMatchResult(null);
    setBattlePhase('countdown');
  }, []);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Arena</Text>
          <Text style={styles.headerSub}>Stake AGL · Fight · Earn</Text>
        </View>
        <View style={styles.headerRight}>
          {isConnected && (
            <View style={styles.balancePill}>
              <Ionicons name="diamond" size={13} color={Colors.primary} />
              <Text style={styles.balanceText}>{aglBalance.toLocaleString()} AGL</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => Linking.openURL(BASE_EXPLORER + ARENA_ADDRESSES.PVE)} style={styles.chainBtn}>
            <Ionicons name="link-outline" size={15} color={Colors.accent} />
            <Text style={styles.chainBtnText}>On-chain</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['play', 'leaderboard'] as ArenaTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Ionicons
              name={t === 'play' ? 'game-controller-outline' : 'trophy-outline'}
              size={15}
              color={activeTab === t ? '#fff' : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'play' ? 'Play' : 'Leaderboard'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'play' ? (
          <>
            {!isConnected ? (
              <View style={styles.connectBox}>
                <Ionicons name="game-controller" size={52} color={Colors.primary} />
                <Text style={styles.connectTitle}>Connect to Play</Text>
                <Text style={styles.connectSub}>Connect your wallet to enter the Arena</Text>
              </View>
            ) : (
              <>
                {/* Stats bar */}
                <View style={styles.statsBar}>
                  <StatPill label="Level" value={`Lv.${arenaStats.level}`} color={Colors.primary} />
                  <StatPill label="Record" value={`${arenaStats.wins}W-${arenaStats.losses}L`} color={Colors.text} />
                  <StatPill label="Win Rate" value={`${winRate}%`} color={Colors.gold} />
                  <StatPill label="Net P&L" value={`${netPL >= 0 ? '+' : ''}${netPL} AGL`} color={netPL >= 0 ? Colors.success : Colors.error} />
                  {arenaStats.currentStreak > 0 && (
                    <StatPill label="Streak" value={`${arenaStats.currentStreak}🔥`} color={Colors.error} />
                  )}
                  {arenaStats.bestStreak > 0 && (
                    <StatPill label="Best" value={`${arenaStats.bestStreak}⚡`} color={Colors.gold} />
                  )}
                </View>

                {/* Tier cards */}
                <Text style={styles.sectionTitle}>Choose Your Tier</Text>
                {TIERS.map((tier) => {
                  const canAfford = aglBalance >= tier.entry;
                  return (
                    <TouchableOpacity
                      key={tier.label}
                      style={[
                        styles.tierCard,
                        { borderColor: tier.color + '50' },
                        !canAfford && styles.tierCardDisabled,
                        tier.popular && styles.tierCardPopular,
                      ]}
                      onPress={() => canAfford && startMatchmaking(tier)}
                      disabled={!canAfford}
                      activeOpacity={0.8}
                    >
                      {tier.popular && (
                        <View style={[styles.popularBadge, { backgroundColor: tier.color }]}>
                          <Text style={styles.popularText}>POPULAR</Text>
                        </View>
                      )}
                      <View style={styles.tierLeft}>
                        <View style={[styles.tierIcon, { backgroundColor: tier.color + '20' }]}>
                          <Ionicons name={tier.icon} size={26} color={tier.color} />
                        </View>
                        <View>
                          <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
                          <Text style={styles.tierDesc}>{tier.desc}</Text>
                        </View>
                      </View>
                      <View style={styles.tierRight}>
                        <Text style={styles.tierFee}>{tier.entry} AGL entry</Text>
                        <Text style={styles.tierReward}>Win {tier.reward} AGL</Text>
                        <Text style={[styles.tierMultiplier, { color: tier.color }]}>{tier.multiplier}</Text>
                      </View>
                      {!canAfford && (
                        <View style={styles.insufficientOverlay}>
                          <Text style={styles.insufficientText}>Insufficient AGL</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Contract info */}
                <View style={styles.contractsCard}>
                  <Text style={styles.contractsTitle}>Live on Base · Arena Contracts</Text>
                  <View style={styles.contractsRow}>
                    {[
                      { label: 'PVE', address: ARENA_ADDRESSES.PVE, color: Colors.accent },
                      { label: 'PVP', address: ARENA_ADDRESSES.PVP, color: Colors.primary },
                      { label: 'Market', address: ARENA_ADDRESSES.MARKETPLACE, color: Colors.gold },
                    ].map((c) => (
                      <TouchableOpacity
                        key={c.label}
                        style={[styles.contractChip, { borderColor: c.color + '40' }]}
                        onPress={() => Linking.openURL(BASE_EXPLORER + c.address)}
                      >
                        <View style={[styles.contractChipDot, { backgroundColor: c.color }]} />
                        <Text style={[styles.contractChipText, { color: c.color }]}>{c.label} ↗</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Earnings banner */}
                {arenaStats.totalEarned > 0 && (
                  <View style={styles.earningsCard}>
                    <Ionicons name="trending-up" size={20} color={Colors.success} />
                    <View style={styles.earningsInfo}>
                      <Text style={styles.earningsLabel}>Total Earned</Text>
                      <Text style={styles.earningsValue}>+{arenaStats.totalEarned} AGL</Text>
                    </View>
                    <View style={styles.earningsInfo}>
                      <Text style={styles.earningsLabel}>Games Played</Text>
                      <Text style={styles.earningsValue}>{totalGames}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        ) : (
          /* ── Leaderboard Tab ─────────────────────────────── */
          <>
            <Text style={styles.leaderboardTitle}>Top Fighters · All Time</Text>

            {/* Player's position card */}
            {isConnected && totalGames > 0 && (
              <View style={styles.myRankCard}>
                <View style={styles.myRankLeft}>
                  <Text style={styles.myRankLabel}>Your Rank</Text>
                  <Text style={styles.myRankValue}>#{Math.max(1, 11 - Math.floor(arenaStats.wins / 10))}</Text>
                </View>
                <View style={styles.myRankDivider} />
                <View style={styles.myRankStat}>
                  <Text style={styles.myRankStatLabel}>Wins</Text>
                  <Text style={styles.myRankStatValue}>{arenaStats.wins}</Text>
                </View>
                <View style={styles.myRankStat}>
                  <Text style={styles.myRankStatLabel}>Win Rate</Text>
                  <Text style={styles.myRankStatValue}>{winRate}%</Text>
                </View>
                <View style={styles.myRankStat}>
                  <Text style={styles.myRankStatLabel}>Earned</Text>
                  <Text style={[styles.myRankStatValue, { color: Colors.success }]}>
                    +{arenaStats.totalEarned}
                  </Text>
                </View>
              </View>
            )}

            {/* Leaderboard list */}
            <View style={styles.leaderboardList}>
              <View style={styles.leaderboardHeader}>
                <Text style={[styles.leaderboardHeaderText, { flex: 0.3 }]}>#</Text>
                <Text style={[styles.leaderboardHeaderText, { flex: 1 }]}>Player</Text>
                <Text style={[styles.leaderboardHeaderText, { textAlign: 'right' }]}>W/L</Text>
                <Text style={[styles.leaderboardHeaderText, { textAlign: 'right', flex: 0.9 }]}>Earned</Text>
              </View>
              {MOCK_LEADERBOARD.map((entry) => (
                <View key={entry.rank} style={[styles.leaderboardRow, entry.rank <= 3 && styles.leaderboardRowTop]}>
                  <View style={styles.leaderboardRankWrap}>
                    {entry.rank === 1 ? (
                      <Text style={styles.rankEmoji}>🥇</Text>
                    ) : entry.rank === 2 ? (
                      <Text style={styles.rankEmoji}>🥈</Text>
                    ) : entry.rank === 3 ? (
                      <Text style={styles.rankEmoji}>🥉</Text>
                    ) : (
                      <Text style={styles.leaderboardRank}>{entry.rank}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leaderboardName} numberOfLines={1}>{entry.name}</Text>
                    {entry.streak > 0 && (
                      <Text style={styles.leaderboardStreak}>{entry.streak}🔥 streak</Text>
                    )}
                  </View>
                  <Text style={styles.leaderboardWL}>{entry.wins}/{entry.losses}</Text>
                  <Text style={styles.leaderboardEarned}>+{entry.earned}</Text>
                </View>
              ))}
            </View>

            <View style={styles.leaderboardNote}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.leaderboardNoteText}>
                Leaderboard updates every 10 minutes · Play more to rank up
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Matchmaking Modal */}
      <Modal visible={phase === 'matchmaking'} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Animated.View style={[styles.matchmakingOrb, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="game-controller" size={40} color="#fff" />
            </Animated.View>
            <Text style={styles.modalTitle}>Finding Opponent{matchmakingDots}</Text>
            <Text style={styles.modalSub}>
              Entry fee: <Text style={{ color: Colors.primary, fontWeight: '700' }}>{selectedTier?.entry} AGL</Text> staked
            </Text>
            <View style={styles.matchmakingBar}>
              <View style={styles.matchmakingFill} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Battle Modal */}
      <Modal visible={phase === 'battle'} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ translateX: shakeAnim }] }]}>
            {battlePhase === 'countdown' ? (
              <>
                <Text style={styles.countdownLabel}>Match Starting</Text>
                <Text style={styles.countdown}>{battleCount || 'GO!'}</Text>
                <Text style={styles.modalSub}>vs. {currentOpponent}</Text>
              </>
            ) : (
              <>
                <View style={styles.battleVs}>
                  <View style={styles.fighterCard}>
                    <Ionicons name="person" size={32} color={Colors.primary} />
                    <Text style={styles.fighterName}>{user?.ensName || 'You'}</Text>
                  </View>
                  <View style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></View>
                  <View style={styles.fighterCard}>
                    <Ionicons name="person" size={32} color={Colors.error} />
                    <Text style={styles.fighterName}>{currentOpponent}</Text>
                  </View>
                </View>
                <Text style={styles.battleStatus}>⚔️ Battle in progress...</Text>
                <View style={styles.battleBars}>
                  <View style={[styles.battleBar, { backgroundColor: Colors.primary + '40' }]}>
                    <View style={[styles.battleBarFill, { width: '62%', backgroundColor: Colors.primary }]} />
                  </View>
                  <View style={[styles.battleBar, { backgroundColor: Colors.error + '40' }]}>
                    <View style={[styles.battleBarFill, { width: '38%', backgroundColor: Colors.error }]} />
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal visible={phase === 'result'} transparent animationType="none">
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.resultCard,
              matchResult?.won ? styles.resultCardWin : styles.resultCardLoss,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={matchResult?.won ? styles.resultBannerWin : styles.resultBannerLoss}>
              <Text style={styles.resultEmoji}>{matchResult?.won ? '🏆' : '💀'}</Text>
              <Text style={styles.resultTitle}>{matchResult?.won ? 'VICTORY' : 'DEFEAT'}</Text>
            </View>

            <View style={styles.resultBody}>
              <Text style={styles.resultOpponent}>vs. {matchResult?.opponent}</Text>

              <View style={styles.aglFlow}>
                <View style={styles.aglFlowItem}>
                  <Text style={styles.aglFlowLabel}>Entry Fee</Text>
                  <Text style={[styles.aglFlowValue, { color: Colors.error }]}>−{matchResult?.entryFee} AGL</Text>
                </View>
                <Ionicons
                  name={matchResult?.won ? 'arrow-forward' : 'close'}
                  size={20}
                  color={matchResult?.won ? Colors.success : Colors.error}
                />
                <View style={styles.aglFlowItem}>
                  <Text style={styles.aglFlowLabel}>{matchResult?.won ? 'Reward' : 'Lost'}</Text>
                  <Text style={[styles.aglFlowValue, { color: matchResult?.won ? Colors.success : Colors.textMuted }]}>
                    {matchResult?.won ? `+${matchResult.reward}` : '0'} AGL
                  </Text>
                </View>
              </View>

              <View style={styles.netGain}>
                <Text style={styles.netGainLabel}>Net P&L</Text>
                <Text style={[styles.netGainValue, { color: matchResult?.won ? Colors.success : Colors.error }]}>
                  {matchResult?.won
                    ? `+${(matchResult.reward - matchResult.entryFee).toFixed(0)} AGL`
                    : `−${matchResult?.entryFee} AGL`}
                </Text>
              </View>

              <View style={styles.newBalanceRow}>
                <Ionicons name="diamond" size={14} color={Colors.primary} />
                <Text style={styles.newBalanceText}>New balance: {aglBalance.toLocaleString()} AGL</Text>
              </View>

              {matchResult?.won && arenaStats.currentStreak > 1 && (
                <View style={styles.streakBanner}>
                  <Text style={styles.streakBannerText}>🔥 {arenaStats.currentStreak} Win Streak! Bonus win rate active</Text>
                </View>
              )}
              {matchResult?.won && arenaStats.currentStreak >= arenaStats.bestStreak && arenaStats.bestStreak > 1 && (
                <View style={[styles.streakBanner, { backgroundColor: Colors.gold + '15', borderColor: Colors.gold + '30' }]}>
                  <Text style={[styles.streakBannerText, { color: Colors.gold }]}>⚡ New personal best streak!</Text>
                </View>
              )}
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.rematchBtn} onPress={() => selectedTier && startMatchmaking(selectedTier)}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.rematchText}>Rematch</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.lobbyBtn} onPress={resetToLobby}>
                <Text style={styles.lobbyText}>Back to Lobby</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statPill, { borderColor: color + '40' }]}>
      <Text style={[styles.statPillValue, { color }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
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
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  balancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary + '20', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.primary + '40',
  },
  balanceText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  chainBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent + '10', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.accent + '30',
  },
  chainBtnText: { fontSize: 11, color: Colors.accent, fontWeight: '600' },

  tabBar: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 4,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10 },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: '#fff' },

  connectBox: { marginHorizontal: 20, marginTop: 60, alignItems: 'center', gap: 12 },
  connectTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  connectSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  statsBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 20, marginBottom: 4, marginTop: 8,
  },
  statPill: {
    alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1,
  },
  statPillValue: { fontSize: 13, fontWeight: '700' },
  statPillLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.text,
    marginHorizontal: 20, marginTop: 16, marginBottom: 12,
  },

  tierCard: {
    marginHorizontal: 20, marginBottom: 12, backgroundColor: Colors.surface,
    borderRadius: 18, borderWidth: 1.5, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden',
  },
  tierCardDisabled: { opacity: 0.5 },
  tierCardPopular: { backgroundColor: Colors.surfaceElevated },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  tierIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tierLabel: { fontSize: 17, fontWeight: '700' },
  tierDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  tierRight: { alignItems: 'flex-end', gap: 3 },
  tierFee: { fontSize: 12, color: Colors.textSecondary },
  tierReward: { fontSize: 15, fontWeight: '700', color: Colors.text },
  tierMultiplier: { fontSize: 12, fontWeight: '600' },
  popularBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  popularText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  insufficientOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background + 'AA', borderRadius: 18,
  },
  insufficientText: { fontSize: 13, fontWeight: '600', color: Colors.error },

  contractsCard: {
    marginHorizontal: 20, marginTop: 4, marginBottom: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  contractsTitle: { fontSize: 12, color: Colors.textMuted, marginBottom: 10, fontWeight: '600' },
  contractsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  contractChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surfaceElevated, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  contractChipDot: { width: 6, height: 6, borderRadius: 3 },
  contractChipText: { fontSize: 12, fontWeight: '600' },

  earningsCard: {
    marginHorizontal: 20, marginTop: 4, backgroundColor: Colors.success + '10',
    borderRadius: 14, borderWidth: 1, borderColor: Colors.success + '30',
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  earningsInfo: { flex: 1 },
  earningsLabel: { fontSize: 11, color: Colors.textSecondary },
  earningsValue: { fontSize: 18, fontWeight: '800', color: Colors.success, marginTop: 2 },

  // Leaderboard
  leaderboardTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.text,
    marginHorizontal: 20, marginTop: 16, marginBottom: 12,
  },
  myRankCard: {
    marginHorizontal: 20, marginBottom: 14, backgroundColor: Colors.primary + '15',
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primary + '40', gap: 12,
  },
  myRankLeft: { alignItems: 'center', minWidth: 52 },
  myRankLabel: { fontSize: 10, color: Colors.textMuted },
  myRankValue: { fontSize: 26, fontWeight: '900', color: Colors.primary },
  myRankDivider: { width: 1, height: 36, backgroundColor: Colors.primary + '30' },
  myRankStat: { flex: 1, alignItems: 'center' },
  myRankStatLabel: { fontSize: 10, color: Colors.textMuted },
  myRankStatValue: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 2 },

  leaderboardList: {
    marginHorizontal: 20, backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  leaderboardHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.surfaceElevated, gap: 8,
  },
  leaderboardHeaderText: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  leaderboardRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8,
  },
  leaderboardRowTop: { backgroundColor: Colors.surfaceElevated },
  leaderboardRankWrap: { width: 28, alignItems: 'center' },
  leaderboardRank: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  rankEmoji: { fontSize: 20 },
  leaderboardName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  leaderboardStreak: { fontSize: 10, color: Colors.error, marginTop: 2 },
  leaderboardWL: { fontSize: 12, color: Colors.textSecondary, textAlign: 'right', minWidth: 44 },
  leaderboardEarned: { fontSize: 13, fontWeight: '700', color: Colors.success, textAlign: 'right', minWidth: 52 },

  leaderboardNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 20, marginTop: 12,
  },
  leaderboardNoteText: { fontSize: 11, color: Colors.textMuted, flex: 1 },

  // Modals
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modalCard: {
    width: '100%', maxWidth: 360, backgroundColor: Colors.surface, borderRadius: 24,
    padding: 28, alignItems: 'center', gap: 16, borderWidth: 1, borderColor: Colors.border,
  },
  matchmakingOrb: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  matchmakingBar: { width: '100%', height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  matchmakingFill: { height: '100%', width: '75%', backgroundColor: Colors.primary, borderRadius: 2 },

  countdownLabel: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
  countdown: { fontSize: 72, fontWeight: '900', color: Colors.text },

  battleVs: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'center' },
  fighterCard: { alignItems: 'center', gap: 8, flex: 1 },
  fighterName: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  vsCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold + '20',
    borderWidth: 1, borderColor: Colors.gold + '60', alignItems: 'center', justifyContent: 'center',
  },
  vsText: { fontSize: 14, fontWeight: '900', color: Colors.gold },
  battleStatus: { fontSize: 15, color: Colors.textSecondary },
  battleBars: { width: '100%', gap: 8 },
  battleBar: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden' },
  battleBarFill: { height: '100%', borderRadius: 4 },

  resultCard: {
    width: '100%', maxWidth: 360, borderRadius: 24, overflow: 'hidden', borderWidth: 1,
  },
  resultCardWin: { backgroundColor: Colors.surface, borderColor: Colors.success + '60' },
  resultCardLoss: { backgroundColor: Colors.surface, borderColor: Colors.error + '60' },
  resultBannerWin: {
    backgroundColor: Colors.success + '20', padding: 20, alignItems: 'center', gap: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.success + '30',
  },
  resultBannerLoss: {
    backgroundColor: Colors.error + '20', padding: 20, alignItems: 'center', gap: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.error + '30',
  },
  resultEmoji: { fontSize: 36 },
  resultTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: 2 },
  resultBody: { padding: 20, gap: 12 },
  resultOpponent: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  aglFlow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 14,
  },
  aglFlowItem: { alignItems: 'center', gap: 4 },
  aglFlowLabel: { fontSize: 11, color: Colors.textMuted },
  aglFlowValue: { fontSize: 16, fontWeight: '700' },
  netGain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  netGainLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  netGainValue: { fontSize: 22, fontWeight: '800' },
  newBalanceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    backgroundColor: Colors.primary + '10', paddingVertical: 10, borderRadius: 10,
  },
  newBalanceText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  streakBanner: {
    backgroundColor: Colors.error + '15', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  streakBannerText: { fontSize: 13, color: Colors.error, textAlign: 'center', fontWeight: '600' },

  resultActions: { flexDirection: 'row', gap: 12, padding: 20, paddingTop: 0 },
  rematchBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14,
  },
  rematchText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  lobbyBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
    borderRadius: 14, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  lobbyText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
});
