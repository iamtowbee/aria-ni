# Smart UI Component System

## 🎨 Overview

A comprehensive, intelligent UI component library designed specifically for AI interactions. Each component adapts to context, user behavior, and agent capabilities.

---

## 📦 Components

### 1. SmartMessageInput

**Context-aware message input with intelligent features**

```tsx
import { SmartMessageInput } from '@/components/smart';

<SmartMessageInput
  onSend={(message) => sendToAgent(message)}
  activeAgent="Vision"
  suggestions={[
    { text: 'Analyze this image', icon: '👁' },
    { text: 'What do you see?', icon: '🔍' },
  ]}
  onVoicePress={() => startVoiceInput()}
  onAttachPress={() => openMediaPicker()}
  showAgentPicker={true}
/>
```

**Features:**
- ✅ Auto-complete suggestions
- ✅ Context-aware placeholder text
- ✅ Voice input button
- ✅ Multi-line support
- ✅ Agent switcher
- ✅ Attachment options
- ✅ Character counter
- ✅ Smart keyboard handling

**Adapts to:**
- Active agent (different placeholders)
- Message length (shows counter at 80%)
- Input mode (voice vs text)

---

### 2. AdaptiveMessageCard

**Smart message display that adapts to content type**

```tsx
import { AdaptiveMessageCard } from '@/components/smart';

<AdaptiveMessageCard
  role="assistant"
  agentName="Vision"
  content={{
    type: 'text',
    text: 'I can see a beautiful sunset...',
  }}
  timestamp={Date.now()}
  onCopy={(text) => copyToClipboard(text)}
  onRegenerate={() => regenerateResponse()}
/>
```

**Supported Content Types:**
- 📝 Text (with formatting)
- 🖼️ Images (with captions)
- 💻 Code (with syntax highlighting)
- 🔗 Links (with previews)
- 🎨 Mixed content

**Features:**
- ✅ Swipe for actions (assistant messages)
- ✅ Agent-specific colors
- ✅ Typing indicator
- ✅ Timestamp
- ✅ Copy/regenerate actions
- ✅ Long-press menu

**Example Content Types:**

```tsx
// Text message
{ type: 'text', text: 'Hello!' }

// Image with caption
{
  type: 'image',
  imageUri: 'file://...',
  text: 'Sunset at the beach',
}

// Code block
{
  type: 'code',
  code: 'const x = 42;',
  language: 'javascript',
}

// Link
{
  type: 'link',
  text: 'Check this out',
  url: 'https://example.com',
}
```

---

### 3. ContextActionSheet

**Adaptive action sheet based on context**

```tsx
import { ContextActionSheet } from '@/components/smart';

<ContextActionSheet
  visible={showActions}
  onClose={() => setShowActions(false)}
  title="Message Actions"
  context="message"
  sections={[
    {
      title: 'Quick Actions',
      actions: [
        {
          id: 'copy',
          title: 'Copy',
          icon: '📋',
          onPress: () => copyMessage(),
        },
        {
          id: 'share',
          title: 'Share',
          icon: '↗️',
          subtitle: 'Share via...',
          onPress: () => shareMessage(),
        },
      ],
    },
    {
      title: 'Advanced',
      actions: [
        {
          id: 'delete',
          title: 'Delete',
          icon: '🗑️',
          destructive: true,
          onPress: () => deleteMessage(),
        },
      ],
    },
  ]}
/>
```

**Features:**
- ✅ Context-aware suggestions
- ✅ Sections for grouping
- ✅ Badges for notifications
- ✅ Destructive actions
- ✅ Disabled states
- ✅ Smooth animations
- ✅ Subtitles for clarity

**Contexts:**
- `message` - Message-specific actions
- `agent` - Agent management
- `media` - Media handling
- `settings` - Configuration

---

### 4. SmartLoadingState

**Context-aware loading indicators**

```tsx
import { SmartLoadingState } from '@/components/smart';

// Spinner style
<SmartLoadingState
  visible={isLoading}
  style="spinner"
  message="Analyzing image..."
  context="vision"
  estimatedTime={5}
  onCancel={() => cancelOperation()}
/>

// Progress bar
<SmartLoadingState
  visible={isUploading}
  style="progress"
  progress={uploadProgress}
  message="Uploading..."
  onCancel={() => cancelUpload()}
/>

// Skeleton screen
<SmartLoadingState
  visible={isLoading}
  style="skeleton"
/>
```

**Loading Styles:**
- `spinner` - Circular indicator
- `skeleton` - Content placeholder
- `progress` - Progress bar (0-100%)
- `dots` - Animated dots
- `pulse` - Pulsing animation

**Features:**
- ✅ Estimated time remaining
- ✅ Cancellable operations
- ✅ Progress tracking
- ✅ Context-specific messages
- ✅ Multiple visual styles

**Context Messages:**
- `agent` → "Thinking..."
- `vision` → "Analyzing image..."
- `network` → "Syncing..."
- `file` → "Processing..."

---

### 5. SmartTabBar

**Intelligent navigation with badges**

```tsx
import { SmartTabBar } from '@/components/smart';

<SmartTabBar
  tabs={[
    {
      id: 'chat',
      title: 'Chat',
      icon: '💬',
      activeIcon: '💬',
      badge: 3, // Unread messages
    },
    {
      id: 'agents',
      title: 'Agents',
      icon: '🤖',
      badge: 1,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: '⚙️',
    },
  ]}
  activeTab={currentTab}
  onTabChange={(tabId) => setCurrentTab(tabId)}
  hapticFeedback={true}
  showLabels={true}
/>
```

**Features:**
- ✅ Notification badges
- ✅ Haptic feedback
- ✅ Active indicators
- ✅ Disabled states
- ✅ Different icons for active/inactive
- ✅ Top or bottom positioning
- ✅ Optional labels

---

## 🎯 Usage Examples

### Complete Chat Interface

```tsx
import {
  SmartMessageInput,
  AdaptiveMessageCard,
  SmartLoadingState,
} from '@/components/smart';

function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeAgent, setActiveAgent] = useState('Core');

  return (
    <View>
      <ScrollView>
        {messages.map(msg => (
          <AdaptiveMessageCard
            key={msg.id}
            role={msg.role}
            content={msg.content}
            agentName={msg.agent}
            timestamp={msg.timestamp}
          />
        ))}
        
        <SmartLoadingState
          visible={isThinking}
          style="pulse"
          context="agent"
        />
      </ScrollView>

      <SmartMessageInput
        onSend={handleSend}
        activeAgent={activeAgent}
        onAgentChange={setActiveAgent}
        suggestions={getSuggestions()}
      />
    </View>
  );
}
```

### Image Analysis Flow

```tsx
function ImageAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async (imageUri) => {
    setAnalyzing(true);
    const analysis = await visionAgent.analyzeImage(imageUri);
    setResult(analysis);
    setAnalyzing(false);
  };

  return (
    <View>
      {analyzing ? (
        <SmartLoadingState
          visible={true}
          style="progress"
          context="vision"
          message="Analyzing image..."
          estimatedTime={3}
        />
      ) : result ? (
        <AdaptiveMessageCard
          role="assistant"
          agentName="Vision"
          content={{
            type: 'image',
            imageUri: result.imageUri,
            text: result.description,
          }}
        />
      ) : null}
    </View>
  );
}
```

---

## 🎨 Theming

All components support theming through StyleSheet:

```tsx
// Create custom theme
const customTheme = {
  primary: '#FF6B6B',
  background: '#1A1A1A',
  text: '#FFFFFF',
  // ... more colors
};

// Components automatically adapt to system theme (dark/light)
```

---

## ♿ Accessibility

All components include:
- ✅ Screen reader support
- ✅ Haptic feedback
- ✅ High contrast support
- ✅ Keyboard navigation
- ✅ Voice control compatible

---

## 📊 Component Matrix

| Component | Context-Aware | Adaptive | Animated | Accessible |
|-----------|---------------|----------|----------|------------|
| SmartMessageInput | ✅ | ✅ | ✅ | ✅ |
| AdaptiveMessageCard | ✅ | ✅ | ✅ | ✅ |
| ContextActionSheet | ✅ | ✅ | ✅ | ✅ |
| SmartLoadingState | ✅ | ✅ | ✅ | ✅ |
| SmartTabBar | ✅ | ✅ | ✅ | ✅ |

---

## 💡 Smart Features

### Auto-Suggestions
Components learn from user behavior:
- Frequent commands
- Common questions
- Agent preferences
- Time-based patterns

### Context Awareness
Components adapt based on:
- Active agent
- Current task
- User location
- Time of day
- Network status

### Performance
Optimized for:
- 60fps animations
- Low memory usage
- Fast render times
- Smooth transitions

---

## 🔧 Configuration

Global component config:

```tsx
// src/config/components.config.ts
export const componentConfig = {
  messageInput: {
    maxLength: 5000,
    suggestionCount: 3,
    hapticFeedback: true,
  },
  messageCard: {
    swipeThreshold: 100,
    avatarSize: 32,
    maxImageSize: 200,
  },
  loading: {
    defaultStyle: 'pulse',
    showEstimate: true,
    allowCancel: true,
  },
  tabBar: {
    hapticFeedback: true,
    showLabels: true,
    badgeLimit: 99,
  },
};
```

---

## 📝 Best Practices

1. **Always provide context**
   ```tsx
   <SmartLoadingState context="vision" />
   // vs
   <SmartLoadingState /> // Less helpful
   ```

2. **Use appropriate content types**
   ```tsx
   <AdaptiveMessageCard
     content={{ type: 'code', code: '...', language: 'js' }}
     // vs
     content={{ type: 'text', text: 'const x = 1;' }} // Lost formatting
   />
   ```

3. **Enable haptic feedback**
   ```tsx
   <SmartTabBar hapticFeedback={true} />
   // Better UX on mobile
   ```

4. **Provide action callbacks**
   ```tsx
   <AdaptiveMessageCard
     onCopy={...}
     onRegenerate={...}
     onShare={...}
     // Enables full functionality
   />
   ```

---

## 🚀 Performance Tips

- Use `React.memo()` for message cards in long lists
- Implement virtualized lists for many messages
- Lazy load images in message cards
- Debounce input suggestions
- Cache action sheet sections

---

## 📦 Installation

All components are included in the main app. Import from:

```tsx
import { ComponentName } from '@/components/smart';
```

---

**Status**: ✅ Production Ready  
**Components**: 5 core components  
**Lines of Code**: ~1,500  
**Coverage**: Complete AI interaction patterns
