// src/ui/base/Avatar.tsx
/**
 * Avatar Component
 * 
 * User/Agent avatar with multiple variants and sizes
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'circular' | 'rounded' | 'square';

export interface AvatarProps {
  size?: AvatarSize;
  variant?: AvatarVariant;
  source?: ImageSourcePropType;
  name?: string;
  color?: string;
  icon?: React.ReactNode;
  badge?: number;
  online?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  variant = 'circular',
  source,
  name,
  color,
  icon,
  badge,
  online,
  style,
}) => {
  const { colors, tokens } = useTheme();

  const getSizeValue = (): number => {
    const sizes = {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 56,
      xl: 80,
    };
    return sizes[size];
  };

  const getBorderRadius = (): number => {
    const sizeValue = getSizeValue();
    switch (variant) {
      case 'circular':
        return sizeValue / 2;
      case 'rounded':
        return tokens.radius.md;
      case 'square':
        return 0;
      default:
        return sizeValue / 2;
    }
  };

  const getInitials = (): string => {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getBackgroundColor = (): string => {
    if (color) return color;
    
    // Generate color from name
    if (name) {
      const hash = name.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 60%, 50%)`;
    }
    
    return colors.primary;
  };

  const sizeValue = getSizeValue();
  const fontSize = sizeValue * 0.4;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: sizeValue,
            height: sizeValue,
            borderRadius: getBorderRadius(),
            backgroundColor: source ? colors.surfaceVariant : getBackgroundColor(),
          },
        ]}
      >
        {source ? (
          <Image
            source={source}
            style={{
              width: sizeValue,
              height: sizeValue,
              borderRadius: getBorderRadius(),
            }}
          />
        ) : icon ? (
          icon
        ) : (
          <Text
            style={[
              styles.initials,
              {
                fontSize,
                color: colors.neutral[0],
              },
            ]}
          >
            {getInitials()}
          </Text>
        )}
      </View>

      {/* Online Indicator */}
      {online !== undefined && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: sizeValue * 0.25,
              height: sizeValue * 0.25,
              backgroundColor: online ? colors.success.main : colors.neutral[300],
              borderWidth: 2,
              borderColor: colors.background,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}

      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.error.main,
              minWidth: sizeValue * 0.4,
              height: sizeValue * 0.4,
              top: -4,
              right: -4,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                fontSize: sizeValue * 0.25,
                color: colors.neutral[0],
              },
            ]}
          >
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  
  initials: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  onlineIndicator: {
    position: 'absolute',
    borderRadius: 999,
  },
  
  badge: {
    position: 'absolute',
    borderRadius: 999,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  badgeText: {
    fontWeight: '600',
  },
});
