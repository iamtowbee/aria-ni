# Modern Design System Documentation

## 🎨 Overview

A production-ready design system built with modern UI/UX principles:

- **Material Design 3** (Material You)
- **iOS Human Interface Guidelines**
- **Fluent Design System**
- **Glass Morphism**
- **Micro-interactions**
- **Accessibility-first**

---

## 📦 What's Included

### Design Tokens (`src/design-system/tokens.ts`)

**Color System**
- Primary palette (50-900)
- Accent colors (purple, pink, teal, orange, green)
- Semantic colors (success, warning, error, info)
- Neutral palette (0-1000)
- Glass morphism colors
- Gradient presets

**Typography**
- Font families (Sans, Mono, Display)
- Type scale (xs → 6xl)
- Font weights (300-900)
- Line heights
- Letter spacing

**Spacing**
- Consistent scale (0-64)
- Based on 4px grid
- Predictable relationships

**Border Radius**
- From sharp to fully rounded
- 8 size options

**Shadows**
- 6 elevation levels
- Colored glow effects
- Inner shadows

**Animations**
- Duration presets
- Easing functions
- Spring animations
- Transition presets

**Breakpoints**
- Mobile to desktop
- Responsive design support

---

## 🧱 Components

### Button

**Variants**
- `solid` - Filled button (default)
- `outline` - Outlined button
- `ghost` - Transparent button
- `soft` - Subtle background
- `glass` - Glass morphism effect

**Sizes**
- `sm` - 36px height
- `md` - 44px height (default)
- `lg` - 52px height

**Colors**
- `primary` (default)
- `success`, `error`, `warning`
- `purple`, `pink`, `teal`, `orange`, `green`

**Features**
- ✅ Loading states
- ✅ Icons (left & right)
- ✅ Haptic feedback
- ✅ Full width option
- ✅ Disabled state
- ✅ Accessibility

**Usage**
```tsx
import { Button } from './design-system';

<Button
  variant="solid"
  size="lg"
  color="primary"
  leftIcon={<Icon />}
  loading={isLoading}
  onPress={handlePress}
>
  Click Me
</Button>
```

---

### Card

**Variants**
- `elevated` - With shadow (default)
- `outlined` - With border
- `filled` - Filled background
- `glass` - Glass morphism

**Elevation Levels**
- `none`, `sm`, `md`, `lg`, `xl`

**Features**
- ✅ Press animations
- ✅ Interactive mode
- ✅ Sub-components (Header, Body, Footer)
- ✅ Customizable padding
- ✅ Border radius control

**Usage**
```tsx
import { Card, CardHeader, CardBody, CardFooter } from './design-system';

<Card variant="glass" elevation="lg" interactive>
  <CardHeader>
    <Title>Card Title</Title>
  </CardHeader>
  <CardBody>
    <Text>Card content goes here</Text>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

### Input

**Variants**
- `outlined` - Bordered input (default)
- `filled` - Filled background
- `underlined` - Bottom border only

**Sizes**
- `sm` - 36px
- `md` - 44px (default)
- `lg` - 52px

**Features**
- ✅ Floating labels
- ✅ Icons (left & right)
- ✅ Clear button
- ✅ Password toggle
- ✅ Character counter
- ✅ Error states
- ✅ Helper text
- ✅ Multiline support

**Usage**
```tsx
import { Input } from './design-system';

<Input
  value={email}
  onChangeText={setEmail}
  label="Email Address"
  placeholder="Enter email"
  variant="outlined"
  leftIcon={<EmailIcon />}
  clearable
  error={emailError}
  helperText="We'll never share your email"
/>
```

---

## 🎨 Design Principles

### 1. Consistency
- Unified spacing system
- Consistent color palette
- Predictable component behavior

### 2. Accessibility
- WCAG 2.1 AA compliant
- Proper contrast ratios
- Screen reader support
- Haptic feedback

### 3. Performance
- Optimized animations
- Minimal re-renders
- Native driver animations

### 4. Flexibility
- Multiple variants
- Extensive customization
- Style overrides supported

### 5. Modern
- Glass morphism
- Micro-interactions
- Spring animations
- Blur effects

---

## 🎯 Usage Examples

### Login Screen
```tsx
import { Button, Input, Card } from './design-system';

function LoginScreen() {
  return (
    <Card variant="glass" padding="8">
      <Input
        label="Email"
        variant="outlined"
        leftIcon={<EmailIcon />}
      />
      <Input
        label="Password"
        variant="outlined"
        secureTextEntry
      />
      <Button
        variant="solid"
        fullWidth
        size="lg"
      >
        Sign In
      </Button>
      <Button variant="ghost">
        Forgot Password?
      </Button>
    </Card>
  );
}
```

### Profile Card
```tsx
function ProfileCard() {
  return (
    <Card variant="elevated" elevation="xl" interactive>
      <CardHeader>
        <Avatar />
        <Title>John Doe</Title>
        <Subtitle>@johndoe</Subtitle>
      </CardHeader>
      <CardBody>
        <Stats />
      </CardBody>
      <CardFooter>
        <Button variant="soft">Follow</Button>
        <Button variant="ghost">Message</Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 🎨 Color Usage

### Primary Actions
Use `primary` for main actions:
```tsx
<Button color="primary">Submit</Button>
```

### Success States
Use `success` for positive actions:
```tsx
<Button color="success">Confirm</Button>
```

### Destructive Actions
Use `error` for dangerous actions:
```tsx
<Button color="error">Delete</Button>
```

### Accents
Use accent colors for secondary actions:
```tsx
<Button color="purple">Upgrade</Button>
<Button color="teal">Share</Button>
```

---

## 📱 Responsive Design

The design system includes breakpoint tokens:

```tsx
import { breakpoints } from './design-system/tokens';

// Use in media queries or layout logic
if (width >= breakpoints.md) {
  // Tablet layout
} else {
  // Mobile layout
}
```

---

## ⚡ Performance Tips

1. **Use Native Driver**
   - All animations use native driver
   - Runs at 60fps

2. **Memoization**
   - Components are optimized
   - Minimal re-renders

3. **Lazy Loading**
   - Import components as needed
   - Tree-shaking friendly

---

## 🎯 Customization

### Override Styles
```tsx
<Button
  variant="solid"
  style={{ 
    backgroundColor: 'custom color',
    borderRadius: 20,
  }}
  textStyle={{
    fontSize: 18,
  }}
>
  Custom
</Button>
```

### Extend Components
```tsx
const PrimaryButton: React.FC = (props) => (
  <Button variant="solid" color="primary" {...props} />
);
```

---

## 🔧 Integration

### Add to Existing App
```tsx
// Import design system
import { Button, Card, Input } from './src/design-system';

// Use in your components
function MyScreen() {
  return (
    <Card>
      <Input label="Name" />
      <Button>Submit</Button>
    </Card>
  );
}
```

### Global Theme
```tsx
import { colors, typography } from './src/design-system/tokens';

// Set global styles
const theme = {
  colors: colors.primary,
  fonts: typography.fonts,
};
```

---

## 📊 Component Stats

| Component | Lines | Features | Variants |
|-----------|-------|----------|----------|
| Button | 250+ | 10+ | 5 |
| Card | 200+ | 8+ | 4 |
| Input | 300+ | 12+ | 3 |
| Tokens | 400+ | 100+ | N/A |

**Total**: 1,150+ lines of production-ready code

---

## ✨ What Makes It Modern

1. **Glass Morphism** - Frosted glass effects
2. **Micro-interactions** - Spring animations
3. **Floating Labels** - Material Design 3 style
4. **Haptic Feedback** - Native feel
5. **Multiple Variants** - Design flexibility
6. **Accessibility** - WCAG compliant
7. **Type Safety** - Full TypeScript support
8. **Performance** - Native driver animations

---

## 🚀 Next Steps

1. **Try the showcase**: `src/screens/DesignSystemShowcase.tsx`
2. **Explore components**: Browse `src/design-system/components/`
3. **Check tokens**: See `src/design-system/tokens.ts`
4. **Build UI**: Import and use in your screens

---

## 📝 Code Example

Complete example combining all components:

```tsx
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Card, Input, CardHeader, CardBody, CardFooter } from './design-system';

function ModernForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <ScrollView>
      <Card variant="glass" elevation="xl">
        <CardHeader>
          <Text style={styles.title}>Create Account</Text>
        </CardHeader>
        
        <CardBody>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            variant="outlined"
            clearable
          />
          
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            variant="outlined"
            leftIcon={<EmailIcon />}
            clearable
          />
        </CardBody>
        
        <CardFooter>
          <Button
            variant="solid"
            size="lg"
            fullWidth
          >
            Sign Up
          </Button>
          <Button variant="ghost">
            Already have an account?
          </Button>
        </CardFooter>
      </Card>
    </ScrollView>
  );
}
```

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Components**: 3 (Button, Card, Input)  
**Design Tokens**: Complete  
**Documentation**: Comprehensive
