# Modern UI Components - AI Avatar App Inspired

## 🎨 Design Inspiration

Components inspired by the best AI avatar apps:
- **Replika** - Avatar animations, mood states, floating effects
- **Character.AI** - Agent selection carousel, character cards
- **Pi** - Voice input, waveform visualization
- **ChatGPT** - Chat bubbles, message reactions, typing indicators
- **Google Assistant** - Suggestion chips, quick actions

---

## 📦 Components (1,366 lines)

### 1. AvatarCard (326 lines)

**Animated AI avatar display with status indicators**

```tsx
import { AvatarCard } from '@/components/ui';

<AvatarCard
  agentName="Aria"
  mood="happy"          // neutral, happy, thinking, excited, empathetic
  status="thinking"     // idle, listening, thinking, speaking
  avatarColor="#3B82F6"
  onTap={() => console.log('Avatar tapped')}
/>
```

**Features:**
- ✅ Pulsing animation when thinking/speaking
- ✅ Floating animation (always active)
- ✅ Glow effect when active
- ✅ Orbiting particles for status
- ✅ Mood-based emoji
- ✅ Status dot with color
- ✅ Tap interaction hint

**Moods:**
- `neutral` 😊
- `happy` 😄
- `thinking` 🤔
- `excited` 🤩
- `empathetic` 💙

**Statuses:**
- `idle` - Gray dot, "Tap to start"
- `listening` - Green dot, "Listening..."
- `thinking` - Orange dot, "Thinking..."
- `speaking` - Blue dot, "Speaking..."

---

### 2. ChatBubble (373 lines)

**Modern message bubbles with reactions and typing**

```tsx
import { ChatBubble } from '@/components/ui';

<ChatBubble
  text="Hello! How can I help you?"
  isUser={false}
  agentName="Aria"
  agentColor="#3B82F6"
  timestamp={Date.now()}
  reactions={['❤️', '👍']}
  onReaction={(emoji) => console.log(emoji)}
  onLongPress={() => console.log('Long press')}
/>
```

**Features:**
- ✅ User and assistant messages
- ✅ Avatar for assistant messages
- ✅ Animated entrance
- ✅ Typing indicator (3 bouncing dots)
- ✅ Long-press for reactions
- ✅ Quick reaction picker (❤️👍😂🤔👏)
- ✅ Timestamp
- ✅ Reaction bubbles below message

**Styling:**
- User messages: Right-aligned, blue background
- Assistant messages: Left-aligned, light background
- Different border radius on bottom corners

---

### 3. VoiceInputButton (289 lines)

**Voice recording button with waveform visualization**

```tsx
import { VoiceInputButton } from '@/components/ui';

<VoiceInputButton
  isRecording={recording}
  onStartRecording={() => setRecording(true)}
  onStopRecording={() => setRecording(false)}
  mode="toggle"        // hold or toggle
  size={64}
  showWaveform={true}
/>
```

**Features:**
- ✅ Pulsing animation when recording
- ✅ Ripple effect
- ✅ Waveform visualization (12 animated bars)
- ✅ Two modes: hold-to-speak or tap-to-toggle
- ✅ Color changes (blue → red when recording)
- ✅ Icon changes (🎤 → ⏹)
- ✅ Status text below button

**Modes:**
- `hold` - Hold button to record, release to stop
- `toggle` - Tap to start, tap again to stop

---

### 4. AgentSelector (243 lines)

**Horizontal scrollable carousel for agent selection**

```tsx
import { AgentSelector } from '@/components/ui';

const agents = [
  {
    id: 'core',
    name: 'Core',
    description: 'General AI assistant',
    emoji: '🤖',
    color: '#3B82F6',
    specialty: 'General AI',
  },
  // ... more agents
];

<AgentSelector
  agents={agents}
  activeAgent="core"
  onSelectAgent={(id) => setActiveAgent(id)}
  showDescription={true}
/>
```

**Features:**
- ✅ Horizontal scrolling carousel
- ✅ Auto-center selected agent
- ✅ Active agent highlight with color
- ✅ Specialty badge
- ✅ Avatar with emoji
- ✅ Active indicator dot
- ✅ Description below (for active only)
- ✅ Smooth animations

**Agent Card States:**
- Active: Full color background, white text, scaled up
- Inactive: Light background, normal scale

---

### 5. SuggestionChips (135 lines)

**Quick action suggestions inspired by Google Assistant**

```tsx
import { SuggestionChips } from '@/components/ui';

const suggestions = [
  { id: '1', text: 'Tell me a joke', icon: '😄' },
  { id: '2', text: 'Analyze an image', icon: '🖼️' },
  { id: '3', text: 'Write a story', icon: '📖' },
];

<SuggestionChips
  suggestions={suggestions}
  onSuggestionPress={(s) => sendMessage(s.text)}
  horizontal={true}
/>
```

**Features:**
- ✅ Horizontal or vertical layout
- ✅ Icon + text
- ✅ Smooth scrolling
- ✅ Pill-shaped design
- ✅ Shadow effect
- ✅ Custom actions

---

## 🚀 Complete Chat Screen Example

**ModernChatScreen.tsx** - Full implementation using all components:

```tsx
import { ModernChatScreen } from '@/screens/ModernChatScreen';

// Features included:
// - Animated avatar header
// - Agent selector carousel
// - Chat bubbles with reactions
// - Voice input button
// - Suggestion chips
// - Text input with send button
// - Typing indicators
// - Auto-scroll to latest message
```

**What it includes:**
- ✅ AvatarCard at top (tappable to show agent selector)
- ✅ AgentSelector (shown on avatar tap)
- ✅ ScrollView with ChatBubbles
- ✅ SuggestionChips (shown when conversation is new)
- ✅ Text input with send button
- ✅ VoiceInputButton
- ✅ Message reactions
- ✅ Agent switching
- ✅ Status updates (idle → listening → thinking → speaking)

---

## 🎯 Key Features

### Animations
- **Entrance**: Spring animation for chat bubbles
- **Pulsing**: Avatar and voice button when active
- **Floating**: Avatar gentle up/down movement
- **Glow**: Expanding glow effect around avatar
- **Waveform**: 12 animated bars during voice input
- **Typing**: 3 bouncing dots
- **Ripple**: Expanding circle from voice button

### Interactions
- **Tap**: Avatar, send button, suggestions
- **Long Press**: Chat bubbles for reactions
- **Hold/Toggle**: Voice button modes
- **Scroll**: Agent selector, messages, suggestions
- **Swipe**: Horizontal carousels

### Visual Feedback
- **Status Colors**: 
  - Gray (idle)
  - Green (listening)
  - Orange (thinking)
  - Blue (speaking)
  - Red (recording)
- **Shadows**: All cards and buttons
- **Border Radius**: Consistent 20px for bubbles
- **Spacing**: 16px padding, 12px gaps

---

## 📊 Comparison with Old Components

| Feature | Old Smart Components | New Modern Components |
|---------|---------------------|----------------------|
| **Avatar** | Static | Animated with moods |
| **Chat Bubbles** | Basic | Reactions + typing |
| **Voice Input** | Simple button | Waveform + ripple |
| **Agent Selection** | Dropdown | Scrollable carousel |
| **Suggestions** | Text list | Chip-based UI |
| **Animations** | Minimal | Rich & smooth |
| **Inspiration** | Generic | Top AI apps |

---

## 🎨 Design Tokens Used

All components use the theme system:

```tsx
const { colors, tokens } = useTheme();

// Colors
colors.primary           // Agent colors
colors.surface          // Card backgrounds
colors.text.primary     // Main text
colors.text.secondary   // Subtitles
colors.text.tertiary    // Placeholders

// Spacing
tokens.spacing[4]       // 16px standard padding
tokens.spacing[3]       // 12px gaps

// Shadows
tokens.shadows.base     // Standard elevation
```

---

## 💡 Usage Tips

### 1. Avatar Status Management
```tsx
// Update status based on interaction
setAvatarStatus('listening');  // When voice recording
setAvatarStatus('thinking');   // When processing
setAvatarStatus('speaking');   // When responding
setAvatarStatus('idle');       // When done
```

### 2. Agent Switching
```tsx
// Agents with different colors and specialties
const agents = [
  { id: 'vision', color: '#8B5CF6', ... },
  { id: 'creativity', color: '#EC4899', ... },
];

// Switch agent
<AgentSelector onSelectAgent={setActiveAgent} />
```

### 3. Message Reactions
```tsx
// Handle reactions
const handleReaction = (messageId, emoji) => {
  // Add/remove emoji from message
  setMessages(prev => prev.map(msg =>
    msg.id === messageId
      ? { ...msg, reactions: [...msg.reactions, emoji] }
      : msg
  ));
};
```

---

## 🚀 Installation

All components are in `src/components/ui/`:

```tsx
import {
  AvatarCard,
  ChatBubble,
  VoiceInputButton,
  AgentSelector,
  SuggestionChips,
} from '@/components/ui';
```

Or use the complete screen:

```tsx
import { ModernChatScreen } from '@/screens/ModernChatScreen';
```

---

## 📦 Component Summary

| Component | Lines | Purpose |
|-----------|-------|---------|
| **AvatarCard** | 326 | Animated avatar with status |
| **ChatBubble** | 373 | Messages with reactions |
| **VoiceInputButton** | 289 | Voice recording UI |
| **AgentSelector** | 243 | Agent carousel |
| **SuggestionChips** | 135 | Quick actions |
| **Total** | **1,366** | **Modern chat UI** |

Plus **ModernChatScreen** (260 lines) showing complete integration!

---

## ✨ What Makes These Components Special

1. **Inspired by Best Apps** - Not generic, but modeled after successful AI apps
2. **Rich Animations** - Smooth, professional animations everywhere
3. **Full Theme Support** - Dark/light mode compatible
4. **Production Ready** - Complete with all features
5. **Composable** - Work together seamlessly
6. **TypeScript** - Full type safety
7. **Accessible** - WCAG compliant

---

*Version: 2.4.0*  
*Components: 5 modern UI components*  
*Inspiration: Replika, Character.AI, Pi, ChatGPT*  
*Status: Production ready*
