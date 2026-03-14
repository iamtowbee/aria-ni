# UI Library Documentation

## 🎨 Complete Design System

A comprehensive, production-ready UI library built for Aria Nova with:
- **Design Tokens** - Consistent spacing, colors, typography
- **Theme System** - Dark/Light/Auto mode support
- **Base Components** - Button, Input, Card, and more
- **Smart Components** - AI-specific interactive components
- **TypeScript** - Full type safety

---

## 📦 Installation & Setup

### 1. Wrap App with ThemeProvider

```tsx
// App.tsx
import { ThemeProvider } from './src/ui';

export default function App() {
  return (
    <ThemeProvider defaultTheme="auto">
      <YourApp />
    </ThemeProvider>
  );
}
```

### 2. Use Components

```tsx
import { Button, Input, Card, useTheme } from './src/ui';

function MyScreen() {
  const { colors, tokens } = useTheme();
  
  return (
    <Card>
      <Input label="Email" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

---

## 🎨 Design Tokens

### Colors

```tsx
tokens.colors.primary[500]    // #2196F3
tokens.colors.neutral[900]    // #111827
tokens.colors.success.main    // #22C55E
tokens.colors.error.main      // #EF4444
```

### Spacing

```tsx
tokens.spacing[1]  // 4px
tokens.spacing[2]  // 8px
tokens.spacing[4]  // 16px
tokens.spacing[6]  // 24px
```

### Typography

```tsx
tokens.typography.fontSize.sm    // 14
tokens.typography.fontSize.base  // 16
tokens.typography.fontSize.lg    // 18
```

### Border Radius

```tsx
tokens.radius.sm    // 4
tokens.radius.base  // 8
tokens.radius.md    // 12
tokens.radius.full  // 9999
```

---

## 🔧 Components

### Button

Standard button with multiple variants and sizes.

```tsx
import { Button } from './src/ui';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>

// With Icon
<Button 
  icon={<Icon name="star" />}
  iconPosition="left"
>
  Star
</Button>

// Full Width
<Button fullWidth>Full Width</Button>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' | 'primary' | Button style |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Button size |
| disabled | boolean | false | Disable button |
| loading | boolean | false | Show loading state |
| fullWidth | boolean | false | Full width button |
| icon | ReactNode | - | Icon element |
| iconPosition | 'left' \| 'right' | 'left' | Icon position |

---

### Input

Text input with label, helper text, and error states.

```tsx
import { Input } from './src/ui';

// Basic
<Input 
  label="Email"
  placeholder="Enter your email"
/>

// With Helper Text
<Input 
  label="Password"
  helperText="Must be at least 8 characters"
  secureTextEntry
/>

// With Error
<Input 
  label="Email"
  error="Invalid email address"
/>

// With Icons
<Input 
  label="Search"
  leftIcon={<SearchIcon />}
  rightIcon={<ClearIcon />}
/>

// Disabled
<Input 
  label="Username"
  value="johndoe"
  disabled
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| label | string | Input label |
| error | string | Error message |
| helperText | string | Helper text below input |
| leftIcon | ReactNode | Icon on left side |
| rightIcon | ReactNode | Icon on right side |
| disabled | boolean | Disable input |

---

### Card

Container component with elevation and variants.

```tsx
import { Card } from './src/ui';

// Variants
<Card variant="elevated">Elevated Card</Card>
<Card variant="outlined">Outlined Card</Card>
<Card variant="filled">Filled Card</Card>

// With Custom Shadow
<Card shadow="lg">Large Shadow</Card>

// With Custom Padding
<Card padding={20}>Custom Padding</Card>

// Pressable
<Card onPress={() => console.log('Pressed')}>
  Tap me!
</Card>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'elevated' \| 'outlined' \| 'filled' | 'elevated' | Card style |
| shadow | 'none' \| 'sm' \| 'base' \| 'md' \| 'lg' | 'base' | Shadow size |
| padding | number | 16 | Card padding |
| onPress | () => void | - | Make card pressable |

---

## 🎨 Theme System

### Using Theme

```tsx
import { useTheme } from './src/ui';

function MyComponent() {
  const { colors, tokens, isDark, theme, setTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text.primary }}>
        Current theme: {theme}
      </Text>
      
      <Button onPress={() => setTheme('dark')}>
        Go Dark
      </Button>
    </View>
  );
}
```

### Theme Values

```tsx
// Light Theme
colors.background       // #FFFFFF
colors.text.primary     // #111827
colors.primary          // #1E88E5

// Dark Theme
colors.background       // #111827
colors.text.primary     // #F9FAFB
colors.primary          // #42A5F5
```

### Change Theme

```tsx
const { setTheme } = useTheme();

// Set theme
setTheme('light');   // Light mode
setTheme('dark');    // Dark mode
setTheme('auto');    // Follow system
```

---

## 🧩 Smart Components

All smart components from the previous system are integrated:

```tsx
import {
  SmartMessageInput,
  AdaptiveMessageCard,
  ContextActionSheet,
  SmartLoadingState,
  SmartTabBar,
} from './src/ui';
```

See **SMART_UI_COMPONENTS.md** for detailed documentation.

---

## 📝 Example: Complete Screen

```tsx
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  useTheme,
  Card,
  Button,
  Input,
  SmartMessageInput,
  AdaptiveMessageCard,
} from './src/ui';

export function ExampleScreen() {
  const { colors, tokens } = useTheme();
  const [messages, setMessages] = useState([]);
  
  const handleSend = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: { type: 'text', text },
      timestamp: Date.now(),
    }]);
  };
  
  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      {/* Form Card */}
      <Card style={{ margin: tokens.spacing[4] }}>
        <Input 
          label="Name" 
          placeholder="Enter your name"
        />
        
        <Button 
          variant="primary"
          fullWidth
          style={{ marginTop: tokens.spacing[3] }}
        >
          Submit
        </Button>
      </Card>
      
      {/* Messages */}
      {messages.map(msg => (
        <AdaptiveMessageCard key={msg.id} {...msg} />
      ))}
      
      {/* Input */}
      <SmartMessageInput onSend={handleSend} />
    </ScrollView>
  );
}
```

---

## 🎯 Best Practices

### 1. Always Use Theme Colors

```tsx
// ✅ Good
const { colors } = useTheme();
<View style={{ backgroundColor: colors.surface }} />

// ❌ Bad
<View style={{ backgroundColor: '#F0F0F0' }} />
```

### 2. Use Design Tokens

```tsx
// ✅ Good
const { tokens } = useTheme();
<View style={{ padding: tokens.spacing[4] }} />

// ❌ Bad
<View style={{ padding: 16 }} />
```

### 3. Leverage Variants

```tsx
// ✅ Good
<Button variant="primary" />
<Card variant="elevated" />

// ❌ Bad
<TouchableOpacity style={{ backgroundColor: '#2196F3' }}>
  <Text style={{ color: '#FFF' }}>Button</Text>
</TouchableOpacity>
```

---

## 🚀 Migration Guide

### From Old Code to UI Library

**Before:**
```tsx
<TouchableOpacity style={styles.button}>
  <Text style={styles.buttonText}>Click</Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
  },
});
```

**After:**
```tsx
<Button variant="primary">Click</Button>
```

---

## 📊 Component Coverage

| Category | Components | Status |
|----------|-----------|--------|
| **Base** | Button | ✅ |
| **Forms** | Input | ✅ |
| **Layout** | Card | ✅ |
| **Theme** | ThemeProvider, useTheme | ✅ |
| **Smart** | 5 components | ✅ |
| **Total** | 8 components | ✅ |

---

## 🎨 Design Principles

1. **Consistency** - All components use the same design tokens
2. **Accessibility** - WCAG AA compliant
3. **Performance** - Optimized rendering
4. **Type Safety** - Full TypeScript support
5. **Themeable** - Dark/Light mode built-in
6. **Composable** - Components work together

---

## 📦 File Structure

```
src/ui/
├── theme/
│   ├── tokens.ts           # Design tokens
│   └── ThemeProvider.tsx   # Theme context
├── base/
│   └── Button.tsx          # Button component
├── forms/
│   └── Input.tsx           # Input component
├── layout/
│   └── Card.tsx            # Card component
└── index.ts                # Main export
```

---

## ✨ Summary

**UI Library Stats:**
- 8 Components
- 1 Theme System
- Full TypeScript
- Dark/Light Mode
- 100% Themeable

**Integration:**
- ✅ Drop-in replacement
- ✅ Backward compatible
- ✅ Smart components included
- ✅ Production ready

---

*Version: 2.3.0*  
*Updated: March 9, 2026*  
*Status: Production Ready*
