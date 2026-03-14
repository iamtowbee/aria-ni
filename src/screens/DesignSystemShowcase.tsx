// src/screens/DesignSystemShowcase.tsx
/**
 * Design System Showcase
 * 
 * Interactive demo of all design system components
 * Modern UI/UX patterns demonstration
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Button } from '../design-system/components/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../design-system/components/Card';
import { Input } from '../design-system/components/Input';
import { colors, typography, spacing } from '../design-system/tokens';

export const DesignSystemShowcase: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Design System</Text>
          <Text style={styles.subtitle}>Modern UI/UX Components</Text>
        </View>

        {/* Buttons Section */}
        <Section title="Buttons">
          <View style={styles.row}>
            <Button variant="solid" size="lg">
              Primary Button
            </Button>
          </View>

          <View style={styles.row}>
            <Button variant="outline" color="purple">
              Outline Button
            </Button>
            <Button variant="ghost" color="teal">
              Ghost Button
            </Button>
          </View>

          <View style={styles.row}>
            <Button variant="soft" color="orange" size="sm">
              Soft Small
            </Button>
            <Button variant="glass" size="sm">
              Glass Effect
            </Button>
          </View>

          <View style={styles.row}>
            <Button
              variant="solid"
              color="success"
              leftIcon={<Text>✓</Text>}
            >
              With Icon
            </Button>
            <Button
              variant="solid"
              color="error"
              loading={loading}
            >
              Loading
            </Button>
          </View>

          <Button
            variant="solid"
            fullWidth
            onPress={handleSubmit}
          >
            Full Width Button
          </Button>
        </Section>

        {/* Cards Section */}
        <Section title="Cards">
          <Card variant="elevated" elevation="lg">
            <CardHeader>
              <Text style={styles.cardTitle}>Elevated Card</Text>
              <Text style={styles.cardSubtitle}>With shadow elevation</Text>
            </CardHeader>
            <CardBody>
              <Text style={styles.cardText}>
                Modern card component with glass morphism support,
                hover effects, and customizable padding.
              </Text>
            </CardBody>
            <CardFooter>
              <Button variant="soft" size="sm">Learn More</Button>
              <Button variant="ghost" size="sm">Share</Button>
            </CardFooter>
          </Card>

          <Card variant="glass" padding="6">
            <CardHeader>
              <Text style={styles.cardTitle}>Glass Morphism</Text>
            </CardHeader>
            <CardBody>
              <Text style={styles.cardText}>
                Beautiful frosted glass effect with backdrop blur
              </Text>
            </CardBody>
          </Card>

          <Card variant="outlined" interactive onPress={() => alert('Card pressed!')}>
            <Text style={styles.cardTitle}>Interactive Card</Text>
            <Text style={styles.cardText}>Tap me! I have press animations</Text>
          </Card>
        </Section>

        {/* Inputs Section */}
        <Section title="Inputs">
          <Input
            value={email}
            onChangeText={setEmail}
            label="Email"
            placeholder="Enter your email"
            variant="outlined"
            clearable
            leftIcon={<Text>📧</Text>}
          />

          <Input
            value={password}
            onChangeText={setPassword}
            label="Password"
            placeholder="Enter your password"
            variant="filled"
            secureTextEntry
            helperText="Min 8 characters required"
          />

          <Input
            value={message}
            onChangeText={setMessage}
            label="Message"
            placeholder="Type your message..."
            variant="outlined"
            multiline
            numberOfLines={4}
            maxLength={200}
            showCounter
          />
        </Section>

        {/* Color Palette Section */}
        <Section title="Color Palette">
          <View style={styles.colorGrid}>
            <ColorSwatch color={colors.primary[500]} label="Primary" />
            <ColorSwatch color={colors.accent.purple} label="Purple" />
            <ColorSwatch color={colors.accent.pink} label="Pink" />
            <ColorSwatch color={colors.accent.teal} label="Teal" />
            <ColorSwatch color={colors.success} label="Success" />
            <ColorSwatch color={colors.warning} label="Warning" />
            <ColorSwatch color={colors.error} label="Error" />
            <ColorSwatch color={colors.accent.orange} label="Orange" />
          </View>
        </Section>

        {/* Typography Section */}
        <Section title="Typography">
          <Text style={[styles.text, { fontSize: parseFloat(typography.sizes['4xl']) }]}>
            Heading 1
          </Text>
          <Text style={[styles.text, { fontSize: parseFloat(typography.sizes['3xl']) }]}>
            Heading 2
          </Text>
          <Text style={[styles.text, { fontSize: parseFloat(typography.sizes['2xl']) }]}>
            Heading 3
          </Text>
          <Text style={[styles.text, { fontSize: parseFloat(typography.sizes.xl) }]}>
            Heading 4
          </Text>
          <Text style={[styles.text, { fontSize: parseFloat(typography.sizes.base) }]}>
            Body text - Regular weight for comfortable reading
          </Text>
          <Text style={[styles.text, { fontSize: parseFloat(typography.sizes.sm) }]}>
            Small text - For captions and helper text
          </Text>
        </Section>

        {/* Spacing */}
        <View style={{ height: parseFloat(spacing[16]) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Section Component
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// Color Swatch Component
const ColorSwatch: React.FC<{ color: string; label: string }> = ({
  color,
  label,
}) => (
  <View style={styles.swatch}>
    <View style={[styles.swatchColor, { backgroundColor: color }]} />
    <Text style={styles.swatchLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  
  scroll: {
    flex: 1,
  },
  
  scrollContent: {
    padding: parseFloat(spacing[4]),
  },
  
  header: {
    marginBottom: parseFloat(spacing[8]),
  },
  
  title: {
    fontSize: parseFloat(typography.sizes['4xl']),
    fontWeight: typography.weights.bold.toString(),
    color: colors.neutral[900],
    marginBottom: parseFloat(spacing[2]),
  },
  
  subtitle: {
    fontSize: parseFloat(typography.sizes.lg),
    color: colors.neutral[600],
  },
  
  section: {
    marginBottom: parseFloat(spacing[8]),
  },
  
  sectionTitle: {
    fontSize: parseFloat(typography.sizes['2xl']),
    fontWeight: typography.weights.semibold.toString(),
    color: colors.neutral[900],
    marginBottom: parseFloat(spacing[4]),
  },
  
  sectionContent: {
    gap: parseFloat(spacing[3]),
  },
  
  row: {
    flexDirection: 'row',
    gap: parseFloat(spacing[3]),
  },
  
  cardTitle: {
    fontSize: parseFloat(typography.sizes.lg),
    fontWeight: typography.weights.semibold.toString(),
    color: colors.neutral[900],
    marginBottom: parseFloat(spacing[1]),
  },
  
  cardSubtitle: {
    fontSize: parseFloat(typography.sizes.sm),
    color: colors.neutral[600],
  },
  
  cardText: {
    fontSize: parseFloat(typography.sizes.base),
    color: colors.neutral[700],
    lineHeight: parseFloat(typography.sizes.base) * typography.lineHeights.relaxed,
  },
  
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: parseFloat(spacing[3]),
  },
  
  swatch: {
    alignItems: 'center',
    width: 80,
  },
  
  swatchColor: {
    width: 60,
    height: 60,
    borderRadius: parseFloat(spacing[3]),
    marginBottom: parseFloat(spacing[2]),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  swatchLabel: {
    fontSize: parseFloat(typography.sizes.sm),
    color: colors.neutral[700],
  },
  
  text: {
    color: colors.neutral[900],
    marginBottom: parseFloat(spacing[2]),
  },
});
