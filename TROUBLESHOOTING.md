# 🔧 Troubleshooting Guide - Aria Nova v2.6

## Common Import Errors & Fixes

### ❌ Error: "Cannot find module '@react-navigation/native'"

**Solution:**
```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

---

### ❌ Error: "Cannot find module '../agents/CoreAgent'"

**Cause**: Agents use a different interface than expected by hooks.

**Solution**: Use the adapter layer:
```typescript
// hooks/useConversation.ts already uses adapters
import { AgentFactory } from './adapters/AgentAdapter';

// Get agent instance
const agent = AgentFactory.createAgent('core');
await agent.processMessage('Hello');
```

The `AgentAdapter.ts` file bridges the gap between agent implementations.

---

### ❌ Error: "Cannot find module '../ui/theme/ThemeProvider'"

**Fix import path in your file:**
```typescript
// ❌ Wrong
import { useTheme } from '../theme/ThemeProvider';

// ✅ Correct
import { useTheme } from '../ui/theme/ThemeProvider';
```

---

### ❌ Error: "Cannot find module '../components/ui/AvatarCard'"

**Check component exists:**
```bash
ls src/components/ui/AvatarCard.tsx
```

**If missing, extract complete package:**
```bash
tar -xzf aria-nova-v2.6-INTEGRATED-CLEAN.tar.gz
```

---

## Installation Errors

### ❌ "npm ERR! ERESOLVE unable to resolve dependency tree"

**Solution 1: Force install**
```bash
npm install --legacy-peer-deps
```

**Solution 2: Clean install**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Solution 3: Use exact versions**
```bash
npm install react-native-screens@3.31.1
npm install react-native-safe-area-context@4.10.1
```

---

### ❌ "Expo version mismatch"

**Fix Expo version:**
```bash
npm install expo@^54.0.0
npx expo install --fix
```

---

## Runtime Errors

### ❌ "Agent not ready. Call load() first"

**Cause**: Agents need initialization with a model.

**Fix**: The adapters handle this automatically:
```typescript
// AgentAdapter already calls load()
const agent = AgentFactory.createAgent('core');
// Agent is ready to use
```

---

### ❌ "sharedModel is required (dependency injection)"

**Cause**: Agent expects a model instance.

**Fix**: Use the adapter (already done):
```typescript
// src/hooks/adapters/AgentAdapter.ts provides MockModel
class MockModel {
  async load() { return true; }
  async generate(prompt) { /* ... */ }
}

// Adapters automatically inject model
new CoreAgent({ sharedModel: new MockModel() });
```

---

### ❌ "Cannot read property 'processMessage' of undefined"

**Cause**: Agent not created properly.

**Fix**: Use AgentFactory:
```typescript
// ❌ Don't do this
const agent = new CoreAgent(); // Missing config

// ✅ Do this
const agent = AgentFactory.createAgent('core');
await agent.processMessage('test');
```

---

### ❌ "Invariant Violation: requireNativeComponent"

**Cause**: Missing native dependencies.

**Fix for Expo Go:**
```bash
# Make sure all dependencies are expo-compatible
npx expo install --fix
```

**Fix for dev build:**
```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

---

## Navigation Errors

### ❌ "Unable to resolve module '@react-navigation/stack'"

**Fix**: Install correct package:
```bash
# ❌ Wrong
npm install @react-navigation/stack

# ✅ Correct (we use native-stack)
npm install @react-navigation/native-stack
```

---

### ❌ "Couldn't find a navigation object"

**Cause**: Component not inside NavigationContainer.

**Fix**: Use App.complete.tsx which has NavigationContainer:
```typescript
// App.complete.tsx already wraps everything
<NavigationContainer>
  <Stack.Navigator>
    {/* screens */}
  </Stack.Navigator>
</NavigationContainer>
```

---

## State Management Errors

### ❌ "useApp must be used within AppProvider"

**Cause**: Component not wrapped in AppProvider.

**Fix**: Use App.complete.tsx:
```typescript
// App.complete.tsx structure
<ThemeProvider>
  <AppProvider>
    <YourApp />
  </AppProvider>
</ThemeProvider>
```

---

### ❌ "Cannot read property 'messages' of undefined"

**Cause**: useConversation hook not initialized.

**Fix**: Make sure to call the hook:
```typescript
// ❌ Wrong
const messages = useConversation().messages; // called twice

// ✅ Correct
const { messages } = useConversation(); // called once
```

---

## Persistence Errors

### ❌ "AsyncStorage is not available"

**Install missing package:**
```bash
npm install @react-native-async-storage/async-storage@^1.23.0
```

---

### ❌ "Cannot stringify circular structure"

**Cause**: Trying to save agent instances to storage.

**Fix**: Already handled in hooks - only save data, not instances:
```typescript
// ✅ Correct (already done in hooks)
await AsyncStorage.setItem('messages', JSON.stringify(messages));

// ❌ Wrong
await AsyncStorage.setItem('agent', JSON.stringify(agentInstance));
```

---

## Voice Errors

### ❌ "expo-speech is not available"

**Install package:**
```bash
npx expo install expo-speech
```

---

### ❌ "Speech recognition not available"

**Note**: The current implementation uses expo-speech for TTS only.
For speech-to-text, you'll need to add:
```bash
# Future: Add speech recognition
npm install @react-native-voice/voice
```

---

## Quick Fixes

### 🔧 Clean Everything
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

---

### 🔧 Reset to Working State
```bash
# Use the complete app
cp App.complete.tsx App.tsx

# Verify files exist
ls src/hooks/adapters/AgentAdapter.ts
ls src/context/AppContext.tsx
ls src/screens/IntegratedModernChatScreen.tsx
```

---

### 🔧 Test Individual Components

**Test hooks:**
```typescript
import { useConversation } from '@/hooks/useConversation';

const { sendMessage } = useConversation();
await sendMessage('test');
```

**Test adapters:**
```typescript
import { AgentFactory } from '@/hooks/adapters/AgentAdapter';

const agent = AgentFactory.createAgent('core');
const response = await agent.processMessage('hello');
console.log(response);
```

**Test context:**
```typescript
import { useApp } from '@/context/AppContext';

const { state } = useApp();
console.log(state.activeAgentId);
```

---

## Automated Fix Script

**Run the automated fix:**
```bash
chmod +x fix-and-install.sh
./fix-and-install.sh
```

This script will:
1. ✅ Install all dependencies
2. ✅ Install navigation packages
3. ✅ Check required files
4. ✅ Backup and setup App.tsx
5. ✅ Verify agent files
6. ✅ Create expo config

---

## File Structure Check

**Verify your structure matches:**
```
/
├── App.complete.tsx         ← Use this as App.tsx
├── package.json             ← Has navigation deps
├── fix-and-install.sh       ← Run this first
│
├── src/
│   ├── context/
│   │   └── AppContext.tsx
│   │
│   ├── hooks/
│   │   ├── adapters/
│   │   │   └── AgentAdapter.ts    ← Bridges agents
│   │   ├── useConversation.ts
│   │   ├── useVoiceRecording.ts
│   │   ├── useConversationHistory.ts
│   │   └── index.ts
│   │
│   ├── screens/
│   │   ├── IntegratedModernChatScreen.tsx    ← Main screen
│   │   ├── ModernSettingsScreen.tsx
│   │   ├── ConversationHistoryScreen.tsx
│   │   └── OnboardingScreen.tsx
│   │
│   ├── components/ui/
│   │   ├── AvatarCard.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── VoiceInputButton.tsx
│   │   ├── AgentSelector.tsx
│   │   └── SuggestionChips.tsx
│   │
│   ├── agents/
│   │   ├── CoreAgent.ts
│   │   ├── VisionAgent.ts
│   │   ├── OCRAgent.ts
│   │   └── CreativityAgent.ts
│   │
│   └── ui/theme/
│       └── ThemeProvider.tsx
```

---

## Still Having Issues?

### 1. Check Node/NPM versions
```bash
node --version  # Should be 18+ or 20+
npm --version   # Should be 9+ or 10+
```

### 2. Clear Expo cache
```bash
npx expo start -c
```

### 3. Check logs
```bash
# In separate terminal while app is running
npx expo start
# Then check console for errors
```

### 4. Verify imports
```bash
# Check if file exists before importing
ls src/hooks/adapters/AgentAdapter.ts
```

---

## Getting Help

**Logs to share:**
```bash
# Package versions
npm list --depth=0

# Expo diagnostics
npx expo-doctor

# Error trace
# Copy full error from terminal
```

**What to include:**
- Node/NPM versions
- Full error message
- Which command failed
- File structure (ls -R src/)

---

**Version**: 2.6.0  
**Last Updated**: 2026-03-12  
**Status**: Troubleshooting Guide Complete
