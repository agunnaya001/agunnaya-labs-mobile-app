import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useWalletStore } from '@store/walletStore';
import { useUserNFTs } from '@hooks/useNFTs';

function NFTCard({ nft }: { nft: { id: string; name: string; image: string; collection: string; rarity?: string; floorPrice?: string } }) {
  return (
    <TouchableOpacity style={styles.nftCard}>
      <View style={styles.nftImageContainer}>
        {nft.image ? (
          <Image source={{ uri: nft.image }} style={styles.nftImage} resizeMode="cover" />
        ) : (
          <View style={styles.nftImagePlaceholder}>
            <Ionicons name="image-outline" size={36} color={Colors.textMuted} />
          </View>
        )}
        {nft.rarity && (
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor(nft.rarity) + '20' }]}>
            <Text style={[styles.rarityText, { color: rarityColor(nft.rarity) }]}>
              {nft.rarity}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.nftInfo}>
        <Text style={styles.nftName} numberOfLines={1}>{nft.name}</Text>
        <Text style={styles.nftCollection} numberOfLines={1}>{nft.collection}</Text>
        {nft.floorPrice && (
          <View style={styles.nftPriceRow}>
            <Ionicons name="logo-bitcoin" size={12} color={Colors.textSecondary} />
            <Text style={styles.nftPrice}>{nft.floorPrice}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function rarityColor(rarity: string) {
  switch (rarity.toLowerCase()) {
    case 'legendary': return Colors.gold;
    case 'epic': return Colors.primary;
    case 'rare': return Colors.accent;
    case 'uncommon': return Colors.success;
    default: return Colors.textSecondary;
  }
}

export default function NFTsScreen() {
  const insets = useSafeAreaInsets();
  const { user, isConnected } = useWalletStore();
  const { data: nfts, isLoading } = useUserNFTs(user?.address || null);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>NFTs</Text>
          {isConnected && nfts && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{nfts.length}</Text>
            </View>
          )}
        </View>

        {!isConnected ? (
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Connect Your Wallet</Text>
            <Text style={styles.emptySubtitle}>Connect to view your NFT collection</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your NFTs...</Text>
          </View>
        ) : nfts && nfts.length > 0 ? (
          <View style={styles.grid}>
            {nfts.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="images-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No NFTs Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your NFTs from Agunnaya Labs will appear here
            </Text>
            <TouchableOpacity style={styles.exploreBtn}>
              <Ionicons name="compass-outline" size={18} color={Colors.primary} />
              <Text style={styles.exploreBtnText}>Explore Marketplace</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Collections preview (always visible) */}
        <Text style={styles.sectionTitle}>Featured Collections</Text>
        <View style={styles.collectionsList}>
          {FEATURED_COLLECTIONS.map((col) => (
            <TouchableOpacity key={col.name} style={styles.collectionRow}>
              <View style={[styles.collectionIcon, { backgroundColor: col.color + '20' }]}>
                <Ionicons name={col.icon as any} size={22} color={col.color} />
              </View>
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionName}>{col.name}</Text>
                <Text style={styles.collectionItems}>{col.items} items</Text>
              </View>
              <View style={styles.collectionFloor}>
                <Text style={styles.collectionFloorLabel}>Floor</Text>
                <Text style={styles.collectionFloorValue}>{col.floor}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const FEATURED_COLLECTIONS = [
  { name: 'Agunnaya Genesis', items: 1000, floor: '0.08 ETH', icon: 'diamond', color: Colors.primary },
  { name: 'Arena Warriors', items: 5000, floor: '0.02 ETH', icon: 'shield', color: Colors.gold },
  { name: 'AGL Founders', items: 500, floor: '0.5 ETH', icon: 'star', color: Colors.accent },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: Platform.OS === 'web' ? 34 : 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  countBadge: {
    backgroundColor: Colors.primary + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  emptyState: {
    marginHorizontal: 20,
    marginTop: 40,
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
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  exploreBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },

  loadingState: {
    marginTop: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  nftCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nftImageContainer: { aspectRatio: 1, position: 'relative' },
  nftImage: { width: '100%', height: '100%' },
  nftImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: { fontSize: 10, fontWeight: '700' },
  nftInfo: { padding: 12 },
  nftName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  nftCollection: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  nftPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  nftPrice: { fontSize: 12, color: Colors.textSecondary },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  collectionsList: {
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
  collectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionInfo: { flex: 1 },
  collectionName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  collectionItems: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  collectionFloor: { alignItems: 'flex-end', marginRight: 8 },
  collectionFloorLabel: { fontSize: 11, color: Colors.textMuted },
  collectionFloorValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
});
