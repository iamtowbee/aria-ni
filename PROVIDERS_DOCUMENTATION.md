# Providers in Aria-Nova

## Context Providers Available

### 1. VoiceOrbProvider

**Location:** `src/components/voice-orb/VoiceOrbProvider.tsx`

**Purpose:** Shares a single Voice Orb audio pipeline across your entire app

**What it provides:**
```typescript
{
  state: 'idle' | 'listening' | 'thinking' | 'speaking',
  audioStream: MediaStream | null,
  audioData: Float32Array | null,
  amplitude: number,
  isRecording: boolean,
  startListening: () => Promise<void>,
  stopListening: () => void,
  setThinking: () => void,
  setSpeaking: (stream?: MediaStream) => void,
  connectStream: (stream: MediaStream) => void,
  error: string | null,
}
```

**Usage:**

**Option 1: Wrap entire app**
```typescript
import { VoiceOrbProvider } from './src/components/voice-orb/VoiceOrbProvider';

function App() {
  return (
    <VoiceOrbProvider options={{ fftSize: 512, smoothing: 0.85 }}>
      <YourAppContent />
    </VoiceOrbProvider>
  );
}
```

**Option 2: Access anywhere in app**
```typescript
import { useVoiceOrbContext } from './src/components/voice-orb/VoiceOrbProvider';

function AnyComponent() {
  const voiceOrb = useVoiceOrbContext();
  
  return (
    <VoiceOrb
      audioData={voiceOrb.audioData}
      amplitude={voiceOrb.amplitude}
      state={voiceOrb.state}
    />
  );
}
```

**Option 3: Without provider (direct hook)**
```typescript
import { useVoiceOrb } from './src/components/voice-orb/useVoiceOrb';

function Component() {
  const voiceOrb = useVoiceOrb({ fftSize: 512 });
  // Use directly
}
```

---

## Why Use the Provider?

### Without Provider
- Each component creates its own audio pipeline
- Multiple microphone requests
- Can't share state between components
- More resource intensive

### With Provider
- ✅ Single audio pipeline shared across app
- ✅ One microphone request
- ✅ All components see same state
- ✅ More efficient
- ✅ Centralized audio management

---

## Example: App with Provider

```typescript
import React from 'react';
import { VoiceOrbProvider } from './src/components/voice-orb/VoiceOrbProvider';
import { ChatScreenEnhanced } from './src/screens/ChatScreen-Enhanced';

export default function App() {
  return (
    <VoiceOrbProvider 
      options={{
        fftSize: 512,
        smoothing: 0.85,
        silenceThreshold: 0.02,
        silenceTimeout: 1500,
      }}
    >
      <ChatScreenEnhanced ecosystem={ai} />
    </VoiceOrbProvider>
  );
}
```

---

## Future Providers (Could Add)

### AIProvider
Share AI ecosystem across app:
```typescript
<AIProvider ecosystem={ai}>
  <App />
</AIProvider>
```

### SubscriptionProvider
Share subscription state:
```typescript
<SubscriptionProvider tier="pro">
  <App />
</SubscriptionProvider>
```

### ThemeProvider
Share theme/styling:
```typescript
<ThemeProvider theme={customTheme}>
  <App />
</ThemeProvider>
```

---

## Current Provider Structure

```
src/components/voice-orb/
├── useVoiceOrb.ts          # Hook (can use standalone)
├── VoiceOrb.tsx            # Visual component
└── VoiceOrbProvider.tsx    # Context provider
    ├── VoiceOrbProvider    # Wrapper component
    └── useVoiceOrbContext  # Hook to access context
```

---

## Provider vs Hook

| Scenario | Use Provider | Use Hook Directly |
|----------|-------------|-------------------|
| Multiple components need access | ✅ Yes | ❌ No |
| Single component use | ⚠️ Optional | ✅ Yes |
| Need centralized control | ✅ Yes | ❌ No |
| Simple, isolated feature | ❌ No | ✅ Yes |

---

## Complete Example

```typescript
// App.tsx
import { VoiceOrbProvider } from './src/components/voice-orb/VoiceOrbProvider';

export default function App() {
  return (
    <VoiceOrbProvider>
      <Header />
      <ChatScreen />
      <Footer />
    </VoiceOrbProvider>
  );
}

// Header.tsx
import { useVoiceOrbContext } from './src/components/voice-orb/VoiceOrbProvider';

function Header() {
  const { state, startListening, stopListening } = useVoiceOrbContext();
  
  return (
    <div>
      <button onClick={state === 'listening' ? stopListening : startListening}>
        {state === 'listening' ? 'Stop' : 'Start'} Listening
      </button>
    </div>
  );
}

// ChatScreen.tsx
import { useVoiceOrbContext } from './src/components/voice-orb/VoiceOrbProvider';
import { VoiceOrb } from './src/components/voice-orb/VoiceOrb';

function ChatScreen() {
  const voiceOrb = useVoiceOrbContext();
  
  return (
    <div>
      {voiceOrb.state !== 'idle' && (
        <VoiceOrb
          audioData={voiceOrb.audioData}
          amplitude={voiceOrb.amplitude}
          state={voiceOrb.state}
          size={120}
        />
      )}
      {/* Chat messages */}
    </div>
  );
}

// Footer.tsx
import { useVoiceOrbContext } from './src/components/voice-orb/VoiceOrbProvider';

function Footer() {
  const { state, amplitude } = useVoiceOrbContext();
  
  return (
    <div>
      Status: {state} | Amplitude: {amplitude.toFixed(2)}
    </div>
  );
}
```

All three components share the same Voice Orb state! ✨

---

## Summary

**VoiceOrbProvider** is already included and working:
- ✅ Shares audio pipeline across app
- ✅ Single microphone request
- ✅ Efficient resource usage
- ✅ Centralized state management
- ✅ Easy to use anywhere in app

**Usage is optional:**
- Use provider for multi-component access
- Use hook directly for single-component use
- Both approaches work perfectly!
