import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useWalletStore } from '@store/walletStore';
import { useState } from 'react';

interface NFT {
  id: string;
  name: string;
  collection: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  floorPrice: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  owned: boolean;
  description: string;
}

const RARITIES: Record<NFT['rarity'], string> = {
  Common: Colors.textSecondary,
  Uncommon: Colors.success,
  Rare: Colors.info,
  Epic: Colors.primary,
  Legendary: Colors.gold,
};

const DEMO_NFTS: NFT[] = [
  {
    id: '1', name: 'Genesis Warrior #001', collection: 'Agunnaya Genesis',
    rarity: 'Legendary', floorPrice: 800, icon: 'shield', iconColor: Colors.gold,
    owned: true, description: 'One of 50 legendary Genesis Warriors. Grants +15% Arena win rate and exclusive tournament access.',
  },
  {
    id: '2', name: 'Arena Champion #042', collection: 'Arena Warriors',
    rarity: 'Epic', floorPrice: 320, icon: 'trophy', iconColor: Colors.primary,
    owned: true, description: 'A battle-hardened champion from the first Arena season. Grants +8% AGL rewards on wins.',
  },
  {
    id: '3', name: 'AGL Founder Badge', collection: 'AGL Founders',
    rarity: 'Legendary', floorPrice: 1200, icon: 'diamond', iconColor: Colors.accent,
    owned: true, description: 'Exclusive to early supporters of Agunnaya Labs. Lifetime 5% fee discount on all platform actions.',
  },
  {
    id: '4', name: 'Storm Blade #217', collection: 'Arena Warriors',
    rarity: 'Rare', floorPrice: 150, icon: 'flash', iconColor: Colors.info,
    owned: false, description: 'A fearsome weapon wielded by top-ranked Arena competitors. Grants bonus XP on each match.',
  },
  {
    id: '5', name: 'Shadow Crest #089', collection: 'Agunnaya Genesis',
    rarity: 'Epic', floorPrice: 410, icon: 'moon', iconColor: Colors.primary,
    owned: false, description: 'Rare crest of the Shadow faction. Reduces Arena entry fees by 10% when equipped.',
  },
  {
    id: '6', name: 'Iron Shield #304', collection: 'Arena Warriors',
    rarity: 'Uncommon', floorPrice: 55, icon: 'shield-half', iconColor: Colors.success,
    owned: false, description: 'Entry-level Arena equipment. A solid choice for new competitors.',
  },
];

type TabFilter = 'owned' | 'market';

export default function NFTsScreen() {
  const insets = useSafeAreaInsets();
  const { isConnected, aglBalance, purchaseNFT, addTransaction } = useWalletStore();
  const [tab, setTab] = useState<TabFilter>('owned');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(
    new Set(DEMO_NFTS.filter((n) => n.owned).map((n) => n.id))
  );

  const displayed = DEMO_NFTS.filter((n) =>
    tab === 'owned' ? ownedIds.has(n.id) : !ownedIds.has(n.id)
  );

  const handleBuy = (nft: NFT) => {
    if (aglBalance < nft.floorPrice) return;
    const ok = purchaseNFT(nft.name, nft.floorPrice);
    if (ok) {
      setOwnedIds((prev) => new Set([...prev, nft.id]));
      setSelectedNFT(null);
      setPurchaseSuccess(`Purchased ${nft.name}!`);
      setTimeout(() => setPurchaseSuccess(null), 3000);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>NFTs</Text>
          {isConnected && (
            <View style={styles.countBadge}>
              <Ionicons name="diamond-outline" size={12} color={Colors.primary} />
              <Text style={styles.countText}>{ownedIds.size} owned</Text>
            </View>
          )}
        </View>

        {purchaseSuccess && (
          <View style={styles.successToast}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.successText}>{purchaseSuccess}</Text>
          </View>
        )}

        {!isConnected ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="grid-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Connect Wallet</Text>
            <Text style={styles.emptySub}>Connect to view and collect Agunnaya NFTs</Text>
          </View>
        ) : (
          <>
            {/* Tab switcher */}
            <View style={styles.tabBar}>
              {(['owned', 'market'] as TabFilter[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                  onPress={() => setTab(t)}
                >
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                    {t === 'owned' ? `My NFTs (${ownedIds.size})` : 'Marketplace'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Balance hint for marketplace */}
            {tab === 'market' && (
              <View style={styles.balanceHint}>
                <Ionicons name="diamond" size={13} color={Colors.primary} />
                <Text style={styles.balanceHintText}>{aglBalance.toLocaleString()} AGL available to spend</Text>
              </View>
            )}

            {/* Grid */}
            {displayed.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>{tab === 'owned' ? 'No NFTs Yet' : 'All Owned!'}</Text>
                <Text style={styles.emptySub}>
                  {tab === 'owned'
                    ? 'Browse the marketplace to buy your first NFT'
                    : 'You own all available NFTs'}
                </Text>
                {tab === 'owned' && (
                  <TouchableOpacity style={styles.browseBtn} onPress={() => setTab('market')}>
                    <Text style={styles.browseBtnText}>Browse Marketplace</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.grid}>
                {displayed.map((nft) => (
                  <TouchableOpacity
                    key={nft.id}
                    style={[styles.nftCard, { borderColor: RARITIES[nft.rarity] + '50' }]}
                    onPress={() => setSelectedNFT(nft)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.nftArtwork, { backgroundColor: nft.iconColor + '15' }]}>
                      <Ionicons name={nft.icon} size={44} color={nft.iconColor} />
                      <View style={[styles.rarityDot, { backgroundColor: RARITIES[nft.rarity] }]} />
                    </View>
                    <View style={styles.nftMeta}>
                      <Text style={styles.nftName} numberOfLines={1}>{nft.name}</Text>
                      <Text style={styles.nftCollection} numberOfLines={1}>{nft.collection}</Text>
                      <View style={styles.nftBottom}>
                        <View style={[styles.rarityTag, { backgroundColor: RARITIES[nft.rarity] + '20' }]}>
                          <Text style={[styles.rarityText, { color: RARITIES[nft.rarity] }]}>
                            {nft.rarity}
                          </Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Ionicons name="diamond-outline" size={11} color={Colors.primary} />
                          <Text style={styles.priceText}>{nft.floorPrice}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Collections */}
            <Text style={styles.sectionTitle}>Collections</Text>
            <View style={styles.collectionList}>
              {[
                { name: 'Agunnaya Genesis', items: 1000, floor: 800, icon: 'diamond' as const, color: Colors.accent },
                { name: 'Arena Warriors', items: 5000, floor: 55, icon: 'shield' as const, color: Colors.primary },
                { name: 'AGL Founders', items: 500, floor: 1200, icon: 'star' as const, color: Colors.gold },
              ].map((c) => (
                <View key={c.name} style={styles.collectionRow}>
                  <View style={[styles.collectionIcon, { backgroundColor: c.color + '20' }]}>
                    <Ionicons name={c.icon} size={20} color={c.color} />
                  </View>
                  <View style={styles.collectionInfo}>
                    <Text style={styles.collectionName}>{c.name}</Text>
                    <Text style={styles.collectionItems}>{c.items.toLocaleString()} items</Text>
                  </View>
                  <View style={styles.collectionFloor}>
                    <Text style={styles.floorLabel}>Floor</Text>
                    <View style={styles.floorValue}>
                      <Ionicons name="diamond-outline" size={11} color={Colors.primary} />
                      <Text style={styles.floorValueText}>{c.floor} AGL</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* NFT Detail Modal */}
      <Modal visible={!!selectedNFT} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            <View style={styles.sheetHandle} />
            {selectedNFT && (
              <>
                <View style={[styles.detailArtwork, { backgroundColor: selectedNFT.iconColor + '15' }]}>
                  <Ionicons name={selectedNFT.icon} size={80} color={selectedNFT.iconColor} />
                  <View style={[styles.rarityDotLg, { backgroundColor: RARITIES[selectedNFT.rarity] }]} />
                </View>

                <View style={styles.detailInfo}>
                  <View style={[styles.rarityTagLg, { backgroundColor: RARITIES[selectedNFT.rarity] + '20' }]}>
                    <Text style={[styles.rarityTagText, { color: RARITIES[selectedNFT.rarity] }]}>
                      {selectedNFT.rarity}
                    </Text>
                  </View>
                  <Text style={styles.detailName}>{selectedNFT.name}</Text>
                  <Text style={styles.detailCollection}>{selectedNFT.collection}</Text>
                  <Text style={styles.detailDesc}>{selectedNFT.description}</Text>

                  <View style={styles.detailStats}>
                    <View style={styles.detailStat}>
                      <Text style={styles.detailStatLabel}>Floor Price</Text>
                      <View style={styles.detailStatValue}>
                        <Ionicons name="diamond" size={14} color={Colors.primary} />
                        <Text style={styles.detailStatText}>{selectedNFT.floorPrice} AGL</Text>
                      </View>
                    </View>
                    <View style={styles.detailStat}>
                      <Text style={styles.detailStatLabel}>Your Balance</Text>
                      <View style={styles.detailStatValue}>
                        <Ionicons name="diamond" size={14} color={Colors.primary} />
                        <Text style={styles.detailStatText}>{aglBalance.toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedNFT(null)}>
                    <Text style={styles.cancelText}>Close</Text>
                  </TouchableOpacity>
                  {ownedIds.has(selectedNFT.id) ? (
                    <View style={styles.ownedBtn}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                      <Text style={styles.ownedText}>In your collection</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.buyBtn,
                        aglBalance < selectedNFT.floorPrice && styles.buyBtnDisabled,
                      ]}
                      onPress={() => handleBuy(selectedNFT)}
                      disabled={aglBalance < selectedNFT.floorPrice}
                    >
                      <Ionicons name="bag-outline" size={18} color="#fff" />
                      <Text style={styles.buyText}>
                        {aglBalance < selectedNFT.floorPrice
                          ? 'Insufficient AGL'
                          : `Buy · ${selectedNFT.floorPrice} AGL`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  countText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: Colors.success + '20',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  successText: { fontSize: 13, color: Colors.success, flex: 1 },

  emptyState: { alignItems: 'center', gap: 12, marginTop: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  browseBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: '#fff' },

  balanceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primary + '10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
  },
  balanceHintText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  nftCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  nftArtwork: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rarityDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nftMeta: { padding: 12 },
  nftName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  nftCollection: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  nftBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rarityTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  rarityText: { fontSize: 10, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  priceText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  collectionList: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  collectionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  collectionInfo: { flex: 1 },
  collectionName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  collectionItems: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  collectionFloor: { alignItems: 'flex-end', marginRight: 4 },
  floorLabel: { fontSize: 10, color: Colors.textMuted },
  floorValue: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  floorValueText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Detail modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  detailSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'web' ? 40 : 32,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  detailArtwork: {
    height: 200,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  rarityDotLg: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  detailInfo: { gap: 8 },
  rarityTagLg: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rarityTagText: { fontSize: 12, fontWeight: '700' },
  detailName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  detailCollection: { fontSize: 14, color: Colors.textMuted },
  detailDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginTop: 4 },
  detailStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  detailStat: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  detailStatLabel: { fontSize: 11, color: Colors.textMuted },
  detailStatValue: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailStatText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  detailActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  buyBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  buyBtnDisabled: { backgroundColor: Colors.border, opacity: 0.6 },
  buyText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ownedBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.success + '20',
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  ownedText: { color: Colors.success, fontWeight: '700', fontSize: 15 },
});
