# Complete UI Library - v2.4

## 🎨 12 Production-Ready Components + Animation Library

---

## 📦 Component Overview

### Base Components (3)

#### 1. **Avatar** ⭐ NEW
User/Agent avatars with status indicators

```tsx
import { Avatar } from './src/ui';

// Basic
<Avatar name="John Doe" size="md" />

// With Image
<Avatar source={{ uri: imageUrl }} size="lg" />

// With Badge
<Avatar name="Alice" badge={3} />

// Online Status
<Avatar name="Bob" online={true} />

// Variants
<Avatar variant="circular" />  // Default
<Avatar variant="rounded" />   // Rounded corners
<Avatar variant="square" />    // Square

// Sizes
<Avatar size="xs" />  // 24px
<Avatar size="sm" />  // 32px
<Avatar size="md" />  // 40px
<Avatar size="lg" />  // 56px
<Avatar size="xl" />  // 80px
```

**Features:**
- Auto-generated colors from name
- Initials extraction
- Badge notifications
- Online/offline indicator
- Custom icons support

---

#### 2. **Badge** ⭐ NEW
Status and count indicators

```tsx
import { Badge } from './src/ui';

// Count Badge
<Badge count={5} />
<Badge count={150} maxCount={99} />  // Shows "99+"

// Variants
<Badge variant="primary">New</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="warning">Beta</Badge>
<Badge variant="info">Info</Badge>

// Dot Badge
<Badge dot variant="success" />

// Sizes
<Badge size="sm" count={3} />
<Badge size="md" count={10} />
<Badge size="lg" count={25} />
```

**Features:**
- 6 semantic variants
- 3 sizes
- Dot mode for status
- Max count with "+"
- Custom content

---

#### 3. **Button** ✅ Updated
Standard button component

```tsx
import { Button } from './src/ui';

// All 5 Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>

// With Icons
<Button 
  icon={<Icon />}
  iconPosition="left"
>
  With Icon
</Button>
```

---

### Form Components (3)

#### 4. **Input** ✅ Updated
Text input with validation

```tsx
import { Input } from './src/ui';

<Input 
  label="Email"
  placeholder="Enter email"
  error="Invalid email"
  helperText="We'll never share your email"
  leftIcon={<Icon />}
  rightIcon={<Icon />}
/>
```

---

#### 5. **Switch** ⭐ NEW
Animated toggle switch

```tsx
import { Switch } from './src/ui';

const [enabled, setEnabled] = useState(false);

<Switch
  value={enabled}
  onValueChange={setEnabled}
  size="md"
  color="#007AFF"
  hapticFeedback={true}
/>
```

**Features:**
- Smooth spring animation
- Haptic feedback
- 3 sizes (sm, md, lg)
- Custom colors
- Disabled state

---

#### 6. **Slider** ⭐ NEW
Range slider with haptic feedback

```tsx
import { Slider } from './src/ui';

const [value, setValue] = useState(50);

<Slider
  value={value}
  onValueChange={setValue}
  minimumValue={0}
  maximumValue={100}
  step={5}
  showValue={true}
  hapticFeedback={true}
/>
```

**Features:**
- Smooth pan gestures
- Haptic feedback on change
- Step snapping
- Min/max labels
- Value display
- Custom colors

---

### Layout Components (1)

#### 7. **Card** ✅ Updated
Container with elevation

```tsx
import { Card } from './src/ui';

<Card variant="elevated" shadow="lg">
  Content
</Card>
```

---

### Smart Components (5)

#### 8-12. **AI-Specific Components**

All smart components from v2.2:
- SmartMessageInput
- AdaptiveMessageCard
- ContextActionSheet
- SmartLoadingState
- SmartTabBar

See **SMART_UI_COMPONENTS.md** for details.

---

## 🎬 Animation Library ⭐ NEW

### 15+ Animation Utilities

```tsx
import {
  fadeIn,
  fadeOut,
  slideInBottom,
  scaleIn,
  bounce,
  shake,
  pulse,
  rotate,
  stagger,
} from './src/ui';
```

### Usage Examples

#### Fade Animations
```tsx
const opacity = useRef(new Animated.Value(0)).current;

// Fade in
fadeIn(opacity, 300).start();

// Fade out
fadeOut(opacity, 300).start();
```

#### Slide Animations
```tsx
const translateY = useRef(new Animated.Value(100)).current;

slideInBottom(translateY, 100, 300).start();
```

#### Scale Animations
```tsx
const scale = useRef(new Animated.Value(0)).current;

scaleIn(scale, 300).start();
scaleOut(scale, 200).start();
```

#### Bounce Effect
```tsx
const scale = useRef(new Animated.Value(1)).current;

bounce(scale, 2).start();  // Bounce twice
```

#### Shake Effect
```tsx
const translateX = useRef(new Animated.Value(0)).current;

shake(translateX, 10).start();  // Shake with 10px intensity
```

#### Continuous Animations
```tsx
const scale = useRef(new Animated.Value(1)).current;
const rotation = useRef(new Animated.Value(0)).current;

// Pulse forever
pulse(scale, 0.95, 1.05, 1000).start();

// Rotate forever
const spin = rotate(rotation, 2000);
spin.start();

// Interpolate rotation
const spinValue = interpolateRotation(rotation);
<Animated.View style={{ transform: [{ rotate: spinValue }] }} />
```

#### Advanced: Stagger
```tsx
const anims = [
  fadeIn(opacity1, 300),
  fadeIn(opacity2, 300),
  fadeIn(opacity3, 300),
];

// Stagger with 100ms delay between each
stagger(anims, 100).start();
```

---

## 🎨 Example: Complete Form

```tsx
import {
  Card,
  Input,
  Switch,
  Slider,
  Button,
  Avatar,
  Badge,
  useTheme,
} from './src/ui';

function SettingsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [volume, setVolume] = useState(50);

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      {/* Profile Card */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar
            name="John Doe"
            source={{ uri: avatarUrl }}
            size="lg"
            online={true}
            badge={3}
          />
          <View style={{ marginLeft: 16 }}>
            <Text>John Doe</Text>
            <Badge variant="success">Pro</Badge>
          </View>
        </View>
      </Card>

      {/* Settings Card */}
      <Card style={{ marginTop: 16 }}>
        <Input 
          label="Email"
          placeholder="john@example.com"
        />

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <Text>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        <Slider
          value={volume}
          onValueChange={setVolume}
          minimumValue={0}
          maximumValue={100}
          showValue={true}
        />

        <Button variant="primary" fullWidth>
          Save Changes
        </Button>
      </Card>
    </ScrollView>
  );
}
```

---

## 🎨 Example: Animated List

```tsx
import {
  Card,
  Avatar,
  Badge,
  fadeIn,
  stagger,
} from './src/ui';

function AnimatedList() {
  const opacities = useRef(
    items.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = opacities.map(opacity => fadeIn(opacity, 300));
    stagger(animations, 100).start();
  }, []);

  return items.map((item, index) => (
    <Animated.View key={item.id} style={{ opacity: opacities[index] }}>
      <Card>
        <Avatar name={item.name} badge={item.unread} />
        <Text>{item.message}</Text>
      </Card>
    </Animated.View>
  ));
}
```

---

## 📊 Complete Component Matrix

| Component | Variants | Sizes | States | Animation | Haptic |
|-----------|----------|-------|--------|-----------|--------|
| **Button** | 5 | 3 | ✅ | ✅ | - |
| **Avatar** | 3 | 5 | ✅ | - | - |
| **Badge** | 6 | 3 | - | - | - |
| **Input** | - | 1 | ✅ | ✅ | - |
| **Switch** | - | 3 | ✅ | ✅ | ✅ |
| **Slider** | - | 1 | ✅ | ✅ | ✅ |
| **Card** | 3 | - | - | - | - |

---

## 🚀 Installation

```bash
# All components already included!
import {
  Button,
  Avatar,
  Badge,
  Input,
  Switch,
  Slider,
  Card,
  fadeIn,
  bounce,
  stagger,
} from './src/ui';
```

---

## ✨ What's New in v2.4

**New Components:**
- ✅ Avatar (with badges & status)
- ✅ Badge (6 variants)
- ✅ Switch (animated)
- ✅ Slider (haptic)

**New Library:**
- ✅ 15+ animation utilities
- ✅ Fade, slide, scale
- ✅ Bounce, shake, wiggle
- ✅ Pulse, rotate (continuous)
- ✅ Stagger, sequence helpers

**Total:**
- 12 components
- 15+ animations
- ~4,500 lines of code
- 100% TypeScript
- Full theming support

---

*Version: 2.4.0*  
*Status: Production Ready*  
*Components: 12 + Animation Library*
