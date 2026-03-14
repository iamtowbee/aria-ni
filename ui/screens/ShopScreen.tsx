// src/screens/ShopScreen.tsx
/**
 * Shop Screen - Avatars, Pets, Capabilities, Boosts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {
  ShopItem,
  ItemCategory,
  ItemRarity,
  SHOP_ITEMS,
  getItemsByCategory,
  getFeaturedItems,
  getRarityColor,
  canPurchase,
} from '../store/shop/ShopItems';

interface Props {
  userTier: string;
  ownedItems: string[];
  onPurchase: (item: ShopItem) => Promise<void>;
}

export default function ShopScreen({ userTier, ownedItems, onPurchase }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'featured'>(
    'featured'
  );
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'featured' as const, name: '⭐ Featured', icon: '⭐' },
    { id: ItemCategory.AVATAR, name: 'Avatars', icon: '🤖' },
    { id: ItemCategory.PET, name: 'Pets', icon: '🦉' },
    { id: ItemCategory.CAPABILITY, name: 'Capabilities', icon: '🧠' },
    { id: ItemCategory.THEME, name: 'Themes', icon: '🎨' },
    { id: ItemCategory.BOOST, name: 'Boosts', icon: '⚡' },
  ];

  const getDisplayItems = (): ShopItem[] => {
    if (selectedCategory === 'featured') {
      return getFeaturedItems();
    }
    return getItemsByCategory(selectedCategory);
  };

  const handlePurchase = async (item: ShopItem) => {
    // Check if already owned
    if (ownedItems.includes(item.id)) {
      Alert.alert('Already Owned', 'You already have this item!');
      return;
    }

    // Check tier requirement
    if (!canPurchase(item, userTier)) {
      Alert.alert(
        'Upgrade Required',
        `You need ${item.requiredTier?.toUpperCase()} tier to purchase this item.`
      );
      return;
    }

    // Confirm purchase
    Alert.alert(
      'Confirm Purchase',
      `Purchase ${item.name} for $${item.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            setLoading(true);
            try {
              await onPurchase(item);
              Alert.alert('Success!', `${item.name} purchased!`);
            } catch (err) {
              Alert.alert('Error', 'Purchase failed. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.subtitle}>Enhance your AI companion</Text>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              selectedCategory === cat.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items Grid */}
      <FlatList
        data={getDisplayItems()}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.itemsGrid}
        renderItem={({ item }) => (
          <ShopItemCard
            item={item}
            isOwned={ownedItems.includes(item.id)}
            canPurchase={canPurchase(item, userTier)}
            onPress={() => handlePurchase(item)}
            loading={loading}
          />
        )}
      />
    </View>
  );
}

interface ShopItemCardProps {
  item: ShopItem;
  isOwned: boolean;
  canPurchase: boolean;
  onPress: () => void;
  loading: boolean;
}

const ShopItemCard = ({
  item,
  isOwned,
  canPurchase: canPurchaseItem,
  onPress,
  loading,
}: ShopItemCardProps) => {
  const rarityColor = getRarityColor(item.rarity);

  return (
    <TouchableOpacity
      style={[styles.itemCard, { borderColor: rarityColor }]}
      onPress={onPress}
      disabled={isOwned || !canPurchaseItem || loading}
    >
      {/* Rarity badge */}
      <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
        <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
      </View>

      {/* Item preview */}
      <View style={styles.itemPreview}>
        <Text style={styles.itemEmoji}>
          {item.category === ItemCategory.AVATAR && '🤖'}
          {item.category === ItemCategory.PET && '🦉'}
          {item.category === ItemCategory.CAPABILITY && '🧠'}
          {item.category === ItemCategory.THEME && '🎨'}
          {item.category === ItemCategory.BOOST && '⚡'}
        </Text>
      </View>

      {/* Item info */}
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDescription} numberOfLines={2}>
        {item.description}
      </Text>

      {/* Benefits */}
      {item.benefits && item.benefits.length > 0 && (
        <View style={styles.benefits}>
          {item.benefits.slice(0, 2).map((benefit, idx) => (
            <Text key={idx} style={styles.benefitText} numberOfLines={1}>
              • {benefit}
            </Text>
          ))}
        </View>
      )}

      {/* Price/Status */}
      <View style={styles.itemFooter}>
        {isOwned ? (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedText}>✓ OWNED</Text>
          </View>
        ) : !canPurchaseItem ? (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>🔒 {item.requiredTier?.toUpperCase()}</Text>
          </View>
        ) : (
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>${item.price}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213E',
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EAEAEA',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  categories: {
    maxHeight: 70,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#6C63FF',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  categoryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#EAEAEA',
  },
  itemsGrid: {
    padding: 10,
  },
  itemCard: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    margin: 5,
    borderWidth: 2,
    maxWidth: '48%',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  itemPreview: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemEmoji: {
    fontSize: 48,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EAEAEA',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  benefits: {
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 10,
    color: '#6C63FF',
  },
  itemFooter: {
    marginTop: 'auto',
  },
  priceTag: {
    backgroundColor: '#6C63FF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  priceText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ownedBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  ownedText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lockedBadge: {
    backgroundColor: '#666',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  lockedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
