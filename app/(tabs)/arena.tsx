import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useWalletStore } from '@store/walletStore';
import { useState, useRef, useEffect, useCallback } from 'react';

type Phase = 'lobby' | 'matchmaking' | 'battle' | 'result';

interface MatchResult {
  won: boolean;
  entryFee: number;
  reward: number;
  opponent: string;
  duration: number;
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

function randomOpponent() {
  return FAKE_OPPONENTS[Math.floor(Math.random() * FAKE_OPPONENTS.length)];
}

function winProbability(streak: number) {
  const base = 0.52;
  const bonus = Math.min(streak * 0.03, 0.12);
  return base + bonus;
}

export default function ArenaScreen() {
  const insets = useSafeAreaInsets();
  const { user, isConnected, aglBalance, arenaStats, spendAGL, recordWin, recordLoss } =
    useWalletStore();

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

  useEffect(() => {
    if (phase === 'matchmaking') {
      const interval = setInterval(() => {
        setMatchmakingDots((d) => (d.length >= 3 ? '' : d + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'matchmaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
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
              const reward = won ? tier.reward : 0;

              if (won) {
                recordWin(tier.entry, tier.reward, opponent);
              } else {
                recordLoss(tier.entry, opponent);
              }

              setMatchResult({ won, entryFee: tier.entry, reward, opponent, duration: 42 });
              setBattlePhase('done');
              setPhase('result');
            }, 2500);
          }
        };
        countDown(3);
      }, 3000);
    },
    [aglBalance, arenaStats.currentStreak, spendAGL, recordWin, recordLoss]
  );

  const resetToLobby = useCallback(() => {
    setPhase('lobby');
    setSelectedTier(null);
    setMatchResult(null);
    setBattlePhase('countdown');
  }, []);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Arena</Text>
            <Text style={styles.headerSub}>Stake AGL · Fight · Earn</Text>
          </View>
          <View style={styles.balancePill}>
            <Ionicons name="diamond" size={14} color={Colors.primary} />
            <Text style={styles.balanceText}>{aglBalance.toLocaleString()} AGL</Text>
          </View>
        </View>

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
              <StatPill label="Wins" value={String(arenaStats.wins)} color={Colors.success} />
              <StatPill label="Losses" value={String(arenaStats.losses)} color={Colors.error} />
              <StatPill label="Win Rate" value={`${winRate}%`} color={Colors.gold} />
              {arenaStats.currentStreak > 0 && (
                <StatPill label="Streak" value={`${arenaStats.currentStreak}🔥`} color={Colors.error} />
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
                    <View style={styles.tierFeeRow}>
                      <Ionicons name="diamond-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.tierFee}>{tier.entry} AGL</Text>
                    </View>
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

            {/* How it works */}
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.howItWorks}>
              {[
                { icon: 'diamond-outline' as const, text: 'Stake AGL to enter a match', color: Colors.primary },
                { icon: 'game-controller-outline' as const, text: 'Get matched with an opponent', color: Colors.accent },
                { icon: 'trophy-outline' as const, text: 'Win and earn AGL rewards', color: Colors.gold },
              ].map((step, i) => (
                <View key={i} style={styles.howStep}>
                  <View style={[styles.howIcon, { backgroundColor: step.color + '20' }]}>
                    <Ionicons name={step.icon} size={20} color={step.color} />
                  </View>
                  <Text style={styles.howText}>{step.text}</Text>
                </View>
              ))}
            </View>

            {/* Recent earnings */}
            {arenaStats.totalEarned > 0 && (
              <View style={styles.earningsCard}>
                <Ionicons name="trending-up" size={20} color={Colors.success} />
                <View style={styles.earningsInfo}>
                  <Text style={styles.earningsLabel}>Total Earned This Session</Text>
                  <Text style={styles.earningsValue}>+{arenaStats.totalEarned} AGL</Text>
                </View>
              </View>
            )}
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
              <Animated.View style={[styles.matchmakingFill, { width: '75%' }]} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Battle Modal */}
      <Modal visible={phase === 'battle'} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View
            style={[styles.modalCard, { transform: [{ translateX: shakeAnim }] }]}
          >
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
                  <View style={styles.vsCircle}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <View style={styles.fighterCard}>
                    <Ionicons name="person" size={32} color={Colors.error} />
                    <Text style={styles.fighterName}>{currentOpponent}</Text>
                  </View>
                </View>
                <Text style={styles.battleStatus}>⚔️ Battle in progress...</Text>
                <View style={styles.battleBars}>
                  <View style={[styles.battleBar, { backgroundColor: Colors.primary + '40' }]}>
                    <Animated.View style={[styles.battleBarFill, { width: '62%', backgroundColor: Colors.primary }]} />
                  </View>
                  <View style={[styles.battleBar, { backgroundColor: Colors.error + '40' }]}>
                    <Animated.View style={[styles.battleBarFill, { width: '38%', backgroundColor: Colors.error }]} />
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
            {/* Result header */}
            <View style={matchResult?.won ? styles.resultBannerWin : styles.resultBannerLoss}>
              <Text style={styles.resultEmoji}>{matchResult?.won ? '🏆' : '💀'}</Text>
              <Text style={styles.resultTitle}>{matchResult?.won ? 'VICTORY' : 'DEFEAT'}</Text>
            </View>

            <View style={styles.resultBody}>
              <Text style={styles.resultOpponent}>vs. {matchResult?.opponent}</Text>

              {/* AGL flow */}
              <View style={styles.aglFlow}>
                <View style={styles.aglFlowItem}>
                  <Text style={styles.aglFlowLabel}>Entry Fee</Text>
                  <Text style={[styles.aglFlowValue, { color: Colors.error }]}>
                    −{matchResult?.entryFee} AGL
                  </Text>
                </View>
                <Ionicons
                  name={matchResult?.won ? 'arrow-forward' : 'close'}
                  size={20}
                  color={matchResult?.won ? Colors.success : Colors.error}
                />
                <View style={styles.aglFlowItem}>
                  <Text style={styles.aglFlowLabel}>{matchResult?.won ? 'Reward' : 'Lost'}</Text>
                  <Text
                    style={[
                      styles.aglFlowValue,
                      { color: matchResult?.won ? Colors.success : Colors.textMuted },
                    ]}
                  >
                    {matchResult?.won ? `+${matchResult.reward}` : '0'} AGL
                  </Text>
                </View>
              </View>

              {/* Net gain */}
              <View style={styles.netGain}>
                <Text style={styles.netGainLabel}>Net P&L</Text>
                <Text
                  style={[
                    styles.netGainValue,
                    { color: matchResult?.won ? Colors.success : Colors.error },
                  ]}
                >
                  {matchResult?.won
                    ? `+${(matchResult.reward - matchResult.entryFee).toFixed(0)} AGL`
                    : `−${matchResult?.entryFee} AGL`}
                </Text>
              </View>

              {/* Updated balance */}
              <View style={styles.newBalanceRow}>
                <Ionicons name="diamond" size={14} color={Colors.primary} />
                <Text style={styles.newBalanceText}>New balance: {aglBalance.toLocaleString()} AGL</Text>
              </View>

              {/* Streak */}
              {matchResult?.won && arenaStats.currentStreak > 1 && (
                <View style={styles.streakBanner}>
                  <Text style={styles.streakBannerText}>
                    🔥 {arenaStats.currentStreak} Win Streak! Win rate bonus active
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.rematchBtn}
                onPress={() => selectedTier && startMatchmaking(selectedTier)}
              >
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  balanceText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  connectBox: {
    marginHorizontal: 20,
    marginTop: 60,
    alignItems: 'center',
    gap: 12,
  },
  connectTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  connectSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  statsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 4,
    marginTop: 8,
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statPillValue: { fontSize: 14, fontWeight: '700' },
  statPillLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },

  tierCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  tierCardDisabled: { opacity: 0.5 },
  tierCardPopular: { backgroundColor: Colors.surfaceElevated },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  tierIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierLabel: { fontSize: 17, fontWeight: '700' },
  tierDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  tierRight: { alignItems: 'flex-end', gap: 3 },
  tierFeeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tierFee: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tierReward: { fontSize: 15, fontWeight: '700', color: Colors.text },
  tierMultiplier: { fontSize: 12, fontWeight: '600' },
  popularBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  insufficientOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background + 'AA',
    borderRadius: 18,
  },
  insufficientText: { fontSize: 13, fontWeight: '600', color: Colors.error },

  howItWorks: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  howStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  howIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  howText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },

  earningsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.success + '15',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.success + '40',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  earningsInfo: { flex: 1 },
  earningsLabel: { fontSize: 13, color: Colors.textSecondary },
  earningsValue: { fontSize: 20, fontWeight: '800', color: Colors.success, marginTop: 2 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  matchmakingOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  matchmakingBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  matchmakingFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  countdownLabel: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
  countdown: { fontSize: 72, fontWeight: '900', color: Colors.text },

  battleVs: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'center' },
  fighterCard: { alignItems: 'center', gap: 8, flex: 1 },
  fighterName: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  vsCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold + '20',
    borderWidth: 1,
    borderColor: Colors.gold + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: { fontSize: 14, fontWeight: '900', color: Colors.gold },
  battleStatus: { fontSize: 15, color: Colors.textSecondary },
  battleBars: { width: '100%', gap: 8 },
  battleBar: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden' },
  battleBarFill: { height: '100%', borderRadius: 4 },

  resultCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  resultCardWin: { backgroundColor: Colors.surface, borderColor: Colors.success + '60' },
  resultCardLoss: { backgroundColor: Colors.surface, borderColor: Colors.error + '60' },
  resultBannerWin: {
    backgroundColor: Colors.success + '20',
    padding: 20,
    alignItems: 'center',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.success + '30',
  },
  resultBannerLoss: {
    backgroundColor: Colors.error + '20',
    padding: 20,
    alignItems: 'center',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.error + '30',
  },
  resultEmoji: { fontSize: 36 },
  resultTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: 2 },

  resultBody: { padding: 20, gap: 14 },
  resultOpponent: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },

  aglFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
  },
  aglFlowItem: { alignItems: 'center', gap: 4 },
  aglFlowLabel: { fontSize: 11, color: Colors.textMuted },
  aglFlowValue: { fontSize: 16, fontWeight: '700' },

  netGain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  netGainLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  netGainValue: { fontSize: 22, fontWeight: '800' },

  newBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: 10,
    borderRadius: 10,
  },
  newBalanceText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  streakBanner: {
    backgroundColor: Colors.error + '15',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  streakBannerText: { fontSize: 13, color: Colors.error, textAlign: 'center', fontWeight: '600' },

  resultActions: { flexDirection: 'row', gap: 12, padding: 20, paddingTop: 0 },
  rematchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  rematchText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  lobbyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lobbyText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
});
