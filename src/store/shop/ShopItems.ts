// src/store/shop/ShopItems.ts
/**
 * Shop Items - Avatars, Pets, Capabilities
 */

export enum ItemCategory {
  AVATAR = 'avatar',
  PET = 'pet',
  THEME = 'theme',
  CAPABILITY = 'capability',
  BOOST = 'boost',
}

export enum ItemRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface ShopItem {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  description: string;
  price: number; // USD
  requiredTier?: string;
  previewUrl?: string;
  benefits?: string[];
  
  // For capabilities
  enhancementType?: 'memory' | 'reasoning' | 'creativity' | 'emotion';
  multiplier?: number;
  duration?: number; // days, -1 for permanent
}

export const SHOP_ITEMS: ShopItem[] = [
  // AVATARS
  {
    id: 'avatar_robot',
    name: 'Cyber Robot',
    category: ItemCategory.AVATAR,
    rarity: ItemRarity.RARE,
    description: 'Futuristic AI robot with holographic effects',
    price: 2.99,
    benefits: ['Unique animations', 'Tech-themed responses'],
  },
  {
    id: 'avatar_wizard',
    name: 'Mystical Wizard',
    category: ItemCategory.AVATAR,
    rarity: ItemRarity.EPIC,
    description: 'Wise wizard with magical particle effects',
    price: 4.99,
    benefits: ['Magic animations', 'Wise personality mode'],
  },
  {
    id: 'avatar_phoenix',
    name: 'Phoenix Rising',
    category: ItemCategory.AVATAR,
    rarity: ItemRarity.LEGENDARY,
    description: 'Legendary phoenix with fire effects',
    price: 9.99,
    requiredTier: 'pro',
    benefits: ['Fire animations', 'Resilient personality', 'Exclusive'],
  },
  
  // PETS (Like Jow)
  {
    id: 'pet_dragon',
    name: 'Baby Dragon',
    category: ItemCategory.PET,
    rarity: ItemRarity.EPIC,
    description: 'Playful dragon that learns from conversations',
    price: 7.99,
    benefits: ['2x learning speed', 'Fire breath animations', 'Unique personality'],
  },
  {
    id: 'pet_unicorn',
    name: 'Magic Unicorn',
    category: ItemCategory.PET,
    rarity: ItemRarity.RARE,
    description: 'Magical unicorn with rainbow effects',
    price: 5.99,
    benefits: ['Enhanced creativity', 'Rainbow animations', 'Positive energy'],
  },
  {
    id: 'pet_phoenix_chick',
    name: 'Phoenix Chick',
    category: ItemCategory.PET,
    rarity: ItemRarity.LEGENDARY,
    description: 'Rare phoenix companion with rebirth abilities',
    price: 12.99,
    requiredTier: 'pro',
    benefits: ['3x learning speed', 'Memory backup', 'Legendary companion'],
  },
  
  // THEMES
  {
    id: 'theme_cyberpunk',
    name: 'Cyberpunk Neon',
    category: ItemCategory.THEME,
    rarity: ItemRarity.RARE,
    description: 'Neon-lit cyberpunk interface',
    price: 1.99,
    benefits: ['Neon colors', 'Glitch effects', 'Custom sounds'],
  },
  {
    id: 'theme_forest',
    name: 'Enchanted Forest',
    category: ItemCategory.THEME,
    rarity: ItemRarity.EPIC,
    description: 'Peaceful forest with nature sounds',
    price: 2.99,
    benefits: ['Nature theme', 'Ambient sounds', 'Calming effects'],
  },
  
  // CAPABILITIES
  {
    id: 'capability_memory_boost',
    name: 'Memory Expansion',
    category: ItemCategory.CAPABILITY,
    rarity: ItemRarity.RARE,
    description: 'Expand context window to 16k tokens',
    price: 4.99,
    enhancementType: 'memory',
    multiplier: 2.0,
    duration: 30,
    benefits: ['2x context window', 'Better recall', '30 days'],
  },
  {
    id: 'capability_reasoning_pro',
    name: 'Advanced Reasoning',
    category: ItemCategory.CAPABILITY,
    rarity: ItemRarity.EPIC,
    description: 'Enable multi-step chain-of-thought reasoning',
    price: 7.99,
    enhancementType: 'reasoning',
    multiplier: 1.5,
    duration: 30,
    benefits: ['Chain-of-thought', 'Better logic', 'Deeper analysis'],
  },
  {
    id: 'capability_creativity_max',
    name: 'Creative Genius',
    category: ItemCategory.CAPABILITY,
    rarity: ItemRarity.LEGENDARY,
    description: 'Unlock maximum creative potential',
    price: 9.99,
    enhancementType: 'creativity',
    multiplier: 3.0,
    duration: 30,
    benefits: ['3x creativity', 'Unique ideas', 'Artistic mode'],
  },
  {
    id: 'capability_empathy_expert',
    name: 'Emotional Expert',
    category: ItemCategory.CAPABILITY,
    rarity: ItemRarity.EPIC,
    description: 'Master-level emotional intelligence',
    price: 6.99,
    enhancementType: 'emotion',
    multiplier: 2.0,
    duration: 30,
    benefits: ['Expert empathy', 'Better understanding', 'Therapeutic mode'],
  },
  
  // BOOSTS (Temporary)
  {
    id: 'boost_speed_24h',
    name: '24hr Speed Boost',
    category: ItemCategory.BOOST,
    rarity: ItemRarity.COMMON,
    description: 'Instant responses for 24 hours',
    price: 0.99,
    duration: 1,
    benefits: ['Instant speed', '24 hours', 'No cooldown'],
  },
  {
    id: 'boost_unlimited_7d',
    name: '7-Day Unlimited',
    category: ItemCategory.BOOST,
    rarity: ItemRarity.RARE,
    description: 'Unlimited messages for 7 days',
    price: 4.99,
    duration: 7,
    benefits: ['Unlimited messages', '7 days', 'No daily limit'],
  },
  {
    id: 'boost_ultimate_24h',
    name: '24hr Ultimate Trial',
    category: ItemCategory.BOOST,
    rarity: ItemRarity.EPIC,
    description: 'Try Ultimate tier for 24 hours',
    price: 9.99,
    duration: 1,
    benefits: ['Full Ultimate access', '24 hours', 'All features'],
  },
];

// Filter & Search
export const getItemsByCategory = (category: ItemCategory): ShopItem[] => {
  return SHOP_ITEMS.filter(item => item.category === category);
};

export const getItemsByRarity = (rarity: ItemRarity): ShopItem[] => {
  return SHOP_ITEMS.filter(item => item.rarity === rarity);
};

export const getFeaturedItems = (): ShopItem[] => {
  return SHOP_ITEMS.filter(item => 
    item.rarity === ItemRarity.LEGENDARY || 
    item.rarity === ItemRarity.EPIC
  ).slice(0, 6);
};

export const getNewItems = (): ShopItem[] => {
  // In production, filter by creation date
  return SHOP_ITEMS.slice(0, 4);
};

// Pricing helpers
export const getRarityColor = (rarity: ItemRarity): string => {
  const colors = {
    [ItemRarity.COMMON]: '#9E9E9E',
    [ItemRarity.RARE]: '#2196F3',
    [ItemRarity.EPIC]: '#9C27B0',
    [ItemRarity.LEGENDARY]: '#FF9800',
  };
  return colors[rarity];
};

export const canPurchase = (item: ShopItem, userTier: string): boolean => {
  if (!item.requiredTier) return true;
  
  const tiers = ['free', 'plus', 'pro', 'ultimate'];
  const userIndex = tiers.indexOf(userTier);
  const requiredIndex = tiers.indexOf(item.requiredTier);
  
  return userIndex >= requiredIndex;
};
