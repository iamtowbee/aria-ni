# Using Aria-Nova as a Library

## Installation

### Option 1: Use Core Library Only (No UI)
```bash
npm install @aria-nova/core
```

### Option 2: Use with React Native UI
```bash
npm install @aria-nova/core @aria-nova/ui
```

---

## Usage Examples

### 1. Core Library (Headless)

Use in any Node.js or React Native project without UI dependencies:

```typescript
import { AriaNovaAI } from '@aria-nova/core';

// Initialize
const ai = new AriaNovaAI({
  cacheSize: 100,
  contextWindow: 4096,
});

await ai.initialize((progress) => {
  console.log(`${progress.stage}: ${progress.percent}%`);
});

// Use
const response = await ai.think("Hello, how are you?");
console.log(response.text);
console.log(response.confidence);
console.log(response.jow); // Jow's learning progress
```

### 2. Individual Agents

Import and use specific agents:

```typescript
import { CoreAgent, CreativityAgent } from '@aria-nova/core';

const coreAgent = new CoreAgent({ persona: 'helpful' });
const creativityAgent = new CreativityAgent({ style: 'vivid' });

// Use agents independently
const response = await creativityAgent.generate(
  "Write a story about a robot",
  "STORY"
);
```

### 3. Monetization Features

```typescript
import {
  SUBSCRIPTION_TIERS,
  SubscriptionTier,
  SHOP_ITEMS,
  ItemCategory
} from '@aria-nova/core';

// Check subscription features
const proFeatures = SUBSCRIPTION_TIERS[SubscriptionTier.PRO];
console.log(proFeatures.dailyMessages); // 1000

// Get shop items
const avatars = SHOP_ITEMS.filter(
  item => item.category === ItemCategory.AVATAR
);
```

### 4. With React Native UI

```typescript
import { AriaNovaAI } from '@aria-nova/core';
import { ChatScreenEnhanced } from '@aria-nova/ui';

function App() {
  const [ai] = useState(() => new AriaNovaAI());
  
  useEffect(() => {
    ai.initialize();
  }, []);
  
  return <ChatScreenEnhanced ecosystem={ai} />;
}
```

### 5. Custom UI with Core Library

```typescript
import { AriaNovaAI } from '@aria-nova/core';
import { useState } from 'react';

function MyCustomChat() {
  const [ai] = useState(() => new AriaNovaAI());
  const [messages, setMessages] = useState([]);
  
  const send = async (text: string) => {
    const response = await ai.think(text, {
      stream: true,
      onStream: (token, current) => {
        // Update UI with streaming text
      }
    });
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      text: response.text,
      confidence: response.confidence
    }]);
  };
  
  return (
    <YourCustomUI 
      messages={messages}
      onSend={send}
    />
  );
}
```

### 6. Voice Orb (UI Component)

```typescript
import { useVoiceOrb, VoiceOrb } from '@aria-nova/ui';

function MyVoiceInterface() {
  const voiceOrb = useVoiceOrb({
    fftSize: 512,
    smoothing: 0.85,
  });
  
  return (
    <VoiceOrb
      audioData={voiceOrb.audioData}
      amplitude={voiceOrb.amplitude}
      state={voiceOrb.state}
      size={120}
    />
  );
}
```

### 7. Attention Visualization

```typescript
import { AriaNovaAI } from '@aria-nova/core';
import { AttentionMap } from '@aria-nova/ui';

const ai = new AriaNovaAI();
const response = await ai.think("Explain quantum computing", {
  returnAttention: true
});

// In your component
<AttentionMap attention={response.attention} />
```

---

## API Reference

### AriaNovaAI

#### Constructor
```typescript
new AriaNovaAI(config?: AIConfig)
```

#### Methods

**initialize(onProgress?)**
```typescript
await ai.initialize((progress) => {
  console.log(progress.stage, progress.percent);
});
```

**think(input, options?)**
```typescript
const response = await ai.think("Hello", {
  stream: true,
  onStream: (token, current) => { },
  returnAttention: true,
  skipCache: false
});
```

**getAttention()**
```typescript
const { attention, confidence } = ai.getAttention();
```

**getJowProgress()**
```typescript
const jow = ai.getJowProgress();
console.log(jow.age, jow.skills, jow.personality);
```

**getStatus()**
```typescript
const status = ai.getStatus();
console.log(status.initialized, status.agents, status.cache);
```

**clearAll()**
```typescript
await ai.clearAll();
```

**exportData()**
```typescript
const data = await ai.exportData();
```

---

## Type Definitions

All types are exported from `@aria-nova/core/types`:

```typescript
import type {
  ThinkResponse,
  AttentionWeight,
  JowState,
  EmotionResult,
  SubscriptionTier,
  ShopItem,
} from '@aria-nova/core/types';
```

---

## File Structure

```
your-project/
├── node_modules/
│   ├── @aria-nova/
│   │   ├── core/          # Core AI logic
│   │   │   ├── index.ts
│   │   │   ├── agents/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   └── types/
│   │   └── ui/            # React Native UI (optional)
│   │       ├── index.ts
│   │       ├── screens/
│   │       └── components/
```

---

## Benefits

### Core Library (`@aria-nova/core`)
- ✅ No UI dependencies
- ✅ Works in Node.js
- ✅ Works in React Native
- ✅ Works in React
- ✅ Fully typed TypeScript
- ✅ Tree-shakeable

### UI Library (`@aria-nova/ui`)
- ✅ Pre-built React Native components
- ✅ Optional - use your own UI
- ✅ Fully typed props
- ✅ Customizable styling

---

## Advanced Usage

### Custom Agent Configuration

```typescript
import { CoreAgent, GammaAgent } from '@aria-nova/core';

const myCore = new CoreAgent({
  persona: 'technical expert',
  temperature: 0.7,
  maxTokens: 1000,
});

const myMemory = new GammaAgent({
  maxMemories: 500,
});
```

### Event Bus

```typescript
import { AgentBus } from '@aria-nova/core';

const bus = new AgentBus();

bus.on('emotion:changed', (payload) => {
  console.log('Emotion changed to:', payload.emotion);
});

bus.emit('custom:event', { data: 'value' });
```

### Subscription Management

```typescript
import {
  SUBSCRIPTION_TIERS,
  canAccess,
  getUpgradeDiscount
} from '@aria-nova/core';

// Check access
const hasAccess = canAccess('plus', 'pro'); // false

// Get discount
const discount = getUpgradeDiscount('plus', 'ultimate'); // 25%
```

---

## Notes

- Core library is **framework-agnostic**
- UI library requires **React Native**
- All exports are **fully typed**
- **Tree-shakeable** - only import what you need
