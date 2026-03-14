// src/screens/SubscriptionScreen.tsx
/**
 * Subscription Screen - Freemium Model
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  SubscriptionTier,
  SUBSCRIPTION_TIERS,
  getUpgradeDiscount,
} from '../store/subscription/SubscriptionTiers';

interface Props {
  currentTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier, isYearly: boolean) => Promise<void>;
}

export default function SubscriptionScreen({ currentTier, onUpgrade }: Props) {
  const [isYearly, setIsYearly] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === currentTier) return;
    
    setLoading(true);
    try {
      await onUpgrade(tier, isYearly);
      Alert.alert('Success!', `Upgraded to ${tier.toUpperCase()}!`);
    } catch (err) {
      Alert.alert('Error', 'Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          Unlock the full potential of Aria-Nova
        </Text>
      </View>

      {/* Billing Toggle */}
      <View style={styles.billingToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, !isYearly && styles.toggleActive]}
          onPress={() => setIsYearly(false)}
        >
          <Text style={[styles.toggleText, !isYearly && styles.toggleTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, isYearly && styles.toggleActive]}
          onPress={() => setIsYearly(true)}
        >
          <Text style={[styles.toggleText, isYearly && styles.toggleTextActive]}>
            Yearly
          </Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveText}>Save 17%</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Subscription Tiers */}
      <View style={styles.tiers}>
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, features]) => {
          const tier = key as SubscriptionTier;
          const isCurrent = tier === currentTier;
          const discount = getUpgradeDiscount(currentTier, tier);
          const price = isYearly ? features.price.yearly : features.price.monthly;

          return (
            <View
              key={tier}
              style={[
                styles.tierCard,
                isCurrent && styles.tierCardCurrent,
                tier === SubscriptionTier.PRO && styles.tierCardPopular,
              ]}
            >
              {tier === SubscriptionTier.PRO && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}

              <Text style={styles.tierName}>{tier.toUpperCase()}</Text>
              
              <View style={styles.priceContainer}>
                <Text style={styles.priceSymbol}>$</Text>
                <Text style={styles.price}>
                  {price === 0 ? '0' : isYearly ? price / 12 : price}
                </Text>
                <Text style={styles.pricePeriod}>
                  {price === 0 ? 'Free' : `/mo`}
                </Text>
              </View>

              {isYearly && price > 0 && (
                <Text style={styles.yearlyNote}>
                  ${price}/year (billed yearly)
                </Text>
              )}

              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
              )}

              {/* Features */}
              <View style={styles.features}>
                <Feature
                  text={
                    features.dailyMessages === -1
                      ? 'Unlimited messages'
                      : `${features.dailyMessages} messages/day`
                  }
                />
                <Feature text={`${features.contextWindow} token context`} />
                <Feature text={`${features.messageHistory} days history`} />
                <Feature text={`${features.responseSpeed} speed`} />
                <Feature
                  text={features.voiceCommands ? '✓ Voice commands' : '✗ Voice commands'}
                  enabled={features.voiceCommands}
                />
                <Feature
                  text={features.multiModal ? '✓ Multi-modal' : '✗ Multi-modal'}
                  enabled={features.multiModal}
                />
                <Feature
                  text={features.reflectiveMode ? '✓ Reflective mode' : '✗ Reflective mode'}
                  enabled={features.reflectiveMode}
                />
                <Feature
                  text={features.advancedReasoning ? '✓ Advanced reasoning' : '✗ Advanced reasoning'}
                  enabled={features.advancedReasoning}
                />
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  isCurrent && styles.ctaButtonCurrent,
                  loading && styles.ctaButtonDisabled,
                ]}
                onPress={() => handleUpgrade(tier)}
                disabled={isCurrent || loading}
              >
                <Text style={styles.ctaText}>
                  {isCurrent ? 'Current Plan' : tier === SubscriptionTier.FREE ? 'Downgrade' : 'Upgrade'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All plans include core AI features, avatar, and Jow companion
        </Text>
        <Text style={styles.footerNote}>
          Cancel anytime • Secure payment • 7-day money-back guarantee
        </Text>
      </View>
    </ScrollView>
  );
}

const Feature = ({ text, enabled = true }: { text: string; enabled?: boolean }) => (
  <View style={styles.feature}>
    <Text style={[styles.featureText, !enabled && styles.featureDisabled]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213E',
  },
  header: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EAEAEA',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  billingToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  toggleButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#1A1A2E',
    marginHorizontal: 5,
  },
  toggleActive: {
    backgroundColor: '#6C63FF',
  },
  toggleText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#EAEAEA',
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  saveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tiers: {
    paddingHorizontal: 20,
  },
  tierCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#1A1A2E',
  },
  tierCardCurrent: {
    borderColor: '#4CAF50',
  },
  tierCardPopular: {
    borderColor: '#6C63FF',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EAEAEA',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  priceSymbol: {
    fontSize: 24,
    color: '#6C63FF',
    marginRight: 2,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EAEAEA',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#888',
    marginLeft: 5,
  },
  yearlyNote: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF5722',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 15,
  },
  discountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  features: {
    marginVertical: 15,
  },
  feature: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#EAEAEA',
  },
  featureDisabled: {
    color: '#666',
  },
  ctaButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
  },
  ctaButtonCurrent: {
    backgroundColor: '#4CAF50',
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 10,
  },
  footerNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
