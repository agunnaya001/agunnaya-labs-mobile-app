import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useWalletStore } from '@store/walletStore';
import { useState } from 'react';
import { NFT_ADDRESSES, ARENA_ADDRESSES } from '@config/contracts';
import { useChampionNFTBalance, useMarketplaceListings } from '@hooks/useContracts';

const BASE_EXPLORER = 'https://basescan.org/address/';

interface LocalNFT {
  id: string;
  name: string;
  collection: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  floorPrice: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  owned: boolean;
  description: string;
  contractAddress: string;
}

const RARITIES: Record<LocalNFT['rarity'], string> = {
  Common: Colors.textSecondary,
  Uncommon: Colors.success,
  Rare: Colors.info,
  Epic: Colors.primary,
  Legendary: Colors.gold,
};

const DEMO_NFTS: LocalNFT[] = [
  {
    id: '1', name: 'Genesis Warrior #001', collection: 'Agunnaya Genesis',
    rarity: 'Legendary', floorPrice: 800, icon: 'shield', iconColor: Colors.gold,
    owned: true, contractAddress: NFT_ADDRESSES.ARENA_CHAMPION,
    description: 'One of 50 legendary Genesis Warriors. Grants +15% Arena win rate and exclusive tournament access.',
  },
  {
    id: '2', name: 'Arena Champion #042', collection: 'Arena Champions',
    rarity: 'Epic', floorPrice: 320, icon: 'trophy', iconColor: Colors.primary,
    owned: true, contractAddress: NFT_ADDRESSES.ARENA_CHAMPION,
    description: 'A battle-hardened champion from the first Arena season. Grants +8% AGL rewards on wins.',
  },
  {
    id: '3', name: 'AGL Founder Badge', collection: 'AGL Founders',
    rarity: 'Legendary', floorPrice: 1200, icon: 'diamond', iconColor: Colors.accent,
    owned: true, contractAddress: NFT_ADDRESSES.ARENA_CHAMPION,
    description: 'Exclusive to early supporters of Agunnaya Labs. Lifetime 5% fee discount on all platform actions.',
  },
  {
    id: '4', name: 'Storm Blade #217', collection: 'Arena Champions',
    rarity: 'Rare', floorPrice: 150, icon: 'flash', iconColor: Colors.info,
    owned: false, contractAddress: NFT_ADDRESSES.ARENA_CHAMPION,
    description: 'A fearsome weapon wielded by top-ranked Arena competitors. Grants bonus XP on each match.',
  },
  {
    id: '5', name: 'Shadow Crest #089', collection: 'Agunnaya Genesis',
    rarity: 'Epic', floorPrice: 410, icon: 'moon', iconColor: Colors.primary,
    owned: false, contractAddress: NFT_ADDRESSES.ARENA_CHAMPION,
    description: 'Rare crest of the Shadow faction. Reduces Arena entry fees by 10% when equipped.',
  },
  {
    id: '6', name: 'Iron Shield #304', collection: 'Arena Champions',
    rarity: 'Uncommon', floorPrice: 55, icon: 'shield-half', iconColor: Colors.success,
    owned: false, contractAddress: NFT_ADDRESSES.ARENA_CHAMPION,
    description: 'Entry-level Arena equipment. A solid choice for new competitors.',
  },
];

const COLLECTIONS = [
  {
    name: 'Arena Champions NFT',
    items: '∞',
    contract: NFT_ADDRESSES.ARENA_CHAMPION,
    floor: 320,
    icon: 'trophy' as const,
    color: Colors.primary,
    verified: true,
  },
  {
    name: 'Agunnaya Genesis',
    items: '1,000',
    contract: NFT_ADDRESSES.ARENA_CHAMPION,
    floor: 800,
    icon: 'diamond' as const,
    color: Colors.accent,
    verified: true,
  },
  {
    name: 'AGL Founders',
    items: '500',
    contract: NFT_ADDRESSES.ARENA_CHAMPION,
    floor: 1200,
    icon: 'star' as const,
    color: Colors.gold,
    verified: true,
  },
];

type TabFilter = 'owned' | 'market';

export default function NFTsScreen() {
  const insets = useSafeAreaInsets();
  const { isConnected, user, aglBalance, purchaseNFT } = useWalletStore();
  const [tab, setTab] = useState<TabFilter>('owned');
  const [selectedNFT, setSelectedNFT] = useState<LocalNFT | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(
    new Set(DEMO_NFTS.filter((n) => n.owned).map((n) => n.id)),
  );

  const { data: chainNFTBalance } = useChampionNFTBalance(user?.address ?? null);
  const { data: marketListings } = useMarketplaceListings(0, 10);

  const displayed = DEMO_NFTS.filter((n) =>
    tab === 'owned' ? ownedIds.has(n.id) : !ownedIds.has(n.id),
  );

  const totalOwned = ownedIds.size + (chainNFTBalance ?? 0);

  const handleBuy = (nft: LocalNFT) => {
    if (aglBalance < nft.floorPrice) return;
    const ok = purchaseNFT(nft.name, nft.floorPrice);
    if (ok) {
      setOwnedIds((prev) => new Set([...prev, nft.id]));
      setSelectedNFT(null);
      setPurchaseSuccess(`Purchased ${nft.name}!`);
      setTimeout(() => setPurchaseSuccess(null), 3000);
    }
  };

  const openExplorer = (address: string) => {
    Linking.openURL(BASE_EXPLORER + address);
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
              <Text style={styles.countText}>{totalOwned} owned</Text>
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
                    {t === 'owned' ? `My NFTs (${totalOwned})` : 'Marketplace'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {tab === 'market' && (
              <View style={styles.balanceHint}>
                <Ionicons name="diamond" size={13} color={Colors.primary} />
                <Text style={styles.balanceHintText}>
                  {aglBalance.toLocaleString()} AGL available to spend
                </Text>
              </View>
            )}

            {/* On-chain marketplace listings banner */}
            {tab === 'market' && marketListings && marketListings.length > 0 && (
              <View style={styles.chainBanner}>
                <Ionicons name="link" size={14} color={Colors.success} />
                <Text style={styles.chainBannerText}>
                  {marketListings.length} live listing{marketListings.length !== 1 ? 's' : ''} on-chain
                </Text>
                <TouchableOpacity onPress={() => openExplorer(ARENA_ADDRESSES.MARKETPLACE)}>
                  <Text style={styles.chainBannerLink}>View on Basescan ↗</Text>
                </TouchableOpacity>
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
            <Text style={styles.sectionTitle}>Collections · Base Network</Text>
            <View style={styles.collectionList}>
              {COLLECTIONS.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={styles.collectionRow}
                  onPress={() => openExplorer(c.contract)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.collectionIcon, { backgroundColor: c.color + '20' }]}>
                    <Ionicons name={c.icon} size={20} color={c.color} />
                  </View>
                  <View style={styles.collectionInfo}>
                    <View style={styles.collectionNameRow}>
                      <Text style={styles.collectionName}>{c.name}</Text>
                      {c.verified && (
                        <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
                      )}
                    </View>
                    <Text style={styles.collectionContract} numberOfLines={1}>
                      {c.contract.slice(0, 10)}...{c.contract.slice(-6)}
                    </Text>
                  </View>
                  <View style={styles.collectionFloor}>
                    <Text style={styles.floorLabel}>Floor</Text>
                    <View style={styles.floorValue}>
                      <Ionicons name="diamond-outline" size={11} color={Colors.primary} />
                      <Text style={styles.floorValueText}>{c.floor} AGL</Text>
                    </View>
                  </View>
                  <Ionicons name="open-outline" size={15} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Contract addresses reference */}
            <Text style={styles.sectionTitle}>Contract Addresses</Text>
            <View style={styles.contractList}>
              {[
                { label: 'Arena Champion NFT', address: NFT_ADDRESSES.ARENA_CHAMPION, color: Colors.primary },
                { label: 'AGL Token', address: '0xEA1221B4d80A89BD8C75248Fae7c176BD1854698', color: Colors.gold },
                { label: 'ARENA Token', address: '0x3b855F88CB93aA642EaEB13F59987C552Fc614b5', color: Colors.accent },
                { label: 'Marketplace', address: ARENA_ADDRESSES.MARKETPLACE, color: Colors.success },
                { label: 'Arena PVE', address: ARENA_ADDRESSES.PVE, color: Colors.info },
                { label: 'Arena PVP', address: ARENA_ADDRESSES.PVP, color: Colors.error },
              ].map((c) => (
                <TouchableOpacity
                  key={c.label}
                  style={styles.contractRow}
                  onPress={() => openExplorer(c.address)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.contractDot, { backgroundColor: c.color }]} />
                  <View style={styles.contractInfo}>
                    <Text style={styles.contractLabel}>{c.label}</Text>
                    <Text style={styles.contractAddress}>{c.address}</Text>
                  </View>
                  <Ionicons name="open-outline" size={13} color={Colors.textMuted} />
                </TouchableOpacity>
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

                  {/* Contract link */}
                  <TouchableOpacity
                    style={styles.contractLink}
                    onPress={() => openExplorer(selectedNFT.contractAddress)}
                  >
                    <Ionicons name="link-outline" size={13} color={Colors.primary} />
                    <Text style={styles.contractLinkText}>
                      {selectedNFT.contractAddress.slice(0, 10)}...{selectedNFT.contractAddress.slice(-6)} ↗
                    </Text>
                  </TouchableOpacity>

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
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primary + '10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
  },
  balanceHintText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },

  chainBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.success + '10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.success + '25',
    flexWrap: 'wrap',
  },
  chainBannerText: { fontSize: 12, color: Colors.success, flex: 1 },
  chainBannerLink: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

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
  rarityDot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5 },
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
  collectionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  collectionName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  collectionContract: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  collectionFloor: { alignItems: 'flex-end', marginRight: 4 },
  floorLabel: { fontSize: 10, color: Colors.textMuted },
  floorValue: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  floorValueText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  contractList: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  contractDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  contractInfo: { flex: 1 },
  contractLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  contractAddress: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

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
  rarityDotLg: { position: 'absolute', top: 14, right: 14, width: 14, height: 14, borderRadius: 7 },
  detailInfo: { gap: 8 },
  rarityTagLg: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rarityTagText: { fontSize: 12, fontWeight: '700' },
  detailName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  detailCollection: { fontSize: 14, color: Colors.textMuted },
  detailDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginTop: 4 },
  contractLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contractLinkText: { fontSize: 12, color: Colors.primary },
  detailStats: { flexDirection: 'row', gap: 12, marginTop: 4 },
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
