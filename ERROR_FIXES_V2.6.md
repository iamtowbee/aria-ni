# 🔧 Aria Nova v2.6 - Error Fixes & Troubleshooting

## 🚨 Common Errors & Solutions

### **Error 1: Cannot find module '@react-navigation/...'**

**Cause:** Navigation dependencies not installed

**Fix:**
```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context --legacy-peer-deps
```

---

### **Error 2: Cannot find module '../hooks/useConversation'**

**Cause:** Hooks directory or files missing

**Fix:**
```bash
# Verify hooks exist
ls src/hooks/

# Should see:
# - useConversation.ts
# - useVoiceRecording.ts  
# - useConversationHistory.ts
# - index.ts

# If missing, extract complete package:
tar -xzf aria-nova-v2.6-INTEGRATED-CLEAN.tar.gz
```

---

### **Error 3: Cannot find module './adapters/AgentAdapter'**

**Cause:** Agent adapter missing

**Fix:**
```bash
# Check if adapter exists
ls src/hooks/adapters/AgentAdapter.ts

# If missing, it should be in the v2.6 package
# Extract complete package to get all files
```

---

### **Error 4: Module parse failed: Unexpected token**

**Cause:** Babel/Metro bundler issue

**Fix:**
```bash
# Clear Metro cache
npx expo start -c

# Or clear all caches
rm -rf node_modules .expo
npm install --legacy-peer-deps
npx expo start -c
```

---

### **Error 5: Unable to resolve "expo-speech"**

**Cause:** Expo module not installed properly

**Fix:**
```bash
# Reinstall expo modules
expo install expo-speech

# Or reinstall all
npm install --legacy-peer-deps
```

---

### **Error 6: Element type is invalid**

**Cause:** Component import error or wrong export

**Fix:**
```bash
# Check component exports in src/components/ui/index.ts
cat src/components/ui/index.ts

# Should export all 5 components:
# AvatarCard, ChatBubble, VoiceInputButton, AgentSelector, SuggestionChips
```

---

### **Error 7: undefined is not an object (evaluating 'agent.processMessage')**

**Cause:** Agent not properly initialized

**Fix:**
Check src/hooks/adapters/AgentAdapter.ts exists and contains:
- CoreAgentAdapter
- VisionAgentAdapter  
- OCRAgentAdapter
- CreativityAgentAdapter
- AgentFactory

---

### **Error 8: Can't find variable: AsyncStorage**

**Cause:** AsyncStorage not imported

**Fix:**
```bash
# Install AsyncStorage
npm install @react-native-async-storage/async-storage@^1.23.0 --legacy-peer-deps
```

---

### **Error 9: useApp must be used within AppProvider**

**Cause:** Components not wrapped in AppProvider

**Fix:**
Make sure App.tsx has:
```tsx
<ThemeProvider>
  <AppProvider>
    <YourApp />
  </AppProvider>
</ThemeProvider>
```

Use App.complete.tsx:
```bash
cp App.complete.tsx App.tsx
```

---

### **Error 10: Cannot read property 'colors' of undefined**

**Cause:** useTheme called outside ThemeProvider

**Fix:**
Ensure App is wrapped in ThemeProvider (check App.complete.tsx)

---

## 🛠️ **Automated Fix**

Run the automated fix script:

```bash
chmod +x install-and-fix.sh
./install-and-fix.sh
```

This script will:
1. ✅ Check prerequisites (Node, npm)
2. ✅ Clean old installations
3. ✅ Install all dependencies
4. ✅ Fix import paths
5. ✅ Setup App.tsx
6. ✅ Verify critical files
7. ✅ Run TypeScript check

---

## 📋 **Manual Verification Checklist**

### **1. Check File Structure**
```bash
# Hooks
ls src/hooks/
# Should have: useConversation.ts, useVoiceRecording.ts, 
#              useConversationHistory.ts, index.ts, adapters/

# Context  
ls src/context/
# Should have: AppContext.tsx

# Components
ls src/components/ui/
# Should have: AvatarCard.tsx, ChatBubble.tsx, VoiceInputButton.tsx,
#              AgentSelector.tsx, SuggestionChips.tsx, index.ts

# Screens
ls src/screens/
# Should have: IntegratedModernChatScreen.tsx, ModernSettingsScreen.tsx,
#              OnboardingScreen.tsx, ConversationHistoryScreen.tsx
```

### **2. Check Dependencies**
```bash
# Navigation
npm list @react-navigation/native
npm list @react-navigation/bottom-tabs
npm list @react-navigation/native-stack

# Support
npm list react-native-screens
npm list react-native-safe-area-context

# Storage
npm list @react-native-async-storage/async-storage
```

### **3. Check Imports**
```bash
# In IntegratedModernChatScreen.tsx
grep "import.*useConversation" src/screens/IntegratedModernChatScreen.tsx
# Should show: import { useConversation } from '../hooks/useConversation';

grep "import.*useApp" src/screens/IntegratedModernChatScreen.tsx
# Should show: import { useApp } from '../context/AppContext';
```

---

## 🔍 **Debugging Steps**

### **Step 1: Verify Package Extraction**
```bash
# Make sure you extracted the CLEAN package
tar -tzf aria-nova-v2.6-INTEGRATED-CLEAN.tar.gz | grep -E "(hooks|context)" | head -10

# Should show:
# src/hooks/
# src/hooks/useConversation.ts
# src/context/
# src/context/AppContext.tsx
```

### **Step 2: Check Node/npm Versions**
```bash
node --version   # Should be v16+ 
npm --version    # Should be v8+
```

### **Step 3: Test Import Paths**
```bash
# From project root
node -e "console.log(require.resolve('./src/hooks/useConversation'))"
# Should print: /path/to/project/src/hooks/useConversation.ts
```

### **Step 4: Metro Bundler**
```bash
# Start with clear cache
npx expo start -c

# Watch for errors in terminal
# Common issues show here immediately
```

### **Step 5: Check Agent Files**
```bash
# Verify agents exist
ls src/agents/

# Should have:
# CoreAgent.ts, VisionAgent.ts, OCRAgent.ts, CreativityAgent.ts
```

---

## 💡 **Pro Tips**

### **Fresh Start**
If nothing works:
```bash
# 1. Completely remove
rm -rf node_modules package-lock.json .expo

# 2. Extract clean package
tar -xzf aria-nova-v2.6-INTEGRATED-CLEAN.tar.gz

# 3. Install
npm install --legacy-peer-deps

# 4. Use complete app
cp App.complete.tsx App.tsx

# 5. Start clean
npx expo start -c
```

### **Dependency Issues**
```bash
# Use legacy peer deps (recommended)
npm install --legacy-peer-deps

# Or force (if legacy fails)
npm install --force

# Check for conflicts
npm ls
```

### **Import Aliases**
If using import aliases like `@/`, update tsconfig.json:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 📱 **Platform-Specific Issues**

### **iOS**
```bash
# If pods fail
cd ios && pod install && cd ..

# Or use Expo Go (no pods needed)
npx expo start
# Scan QR with Expo Go app
```

### **Android**
```bash
# Clear gradle cache
cd android && ./gradlew clean && cd ..

# Restart bundler
npx expo start -c
```

### **Expo Go**
```bash
# Best for development - no native builds
npm start
# Scan QR with Expo Go app

# No pod install or gradle needed!
```

---

## 🚑 **Emergency Recovery**

### **Nuclear Option**
If completely broken:

```bash
# 1. Save your work (if any)
git add -A
git commit -m "backup before reset"

# 2. Complete clean
rm -rf node_modules package-lock.json .expo .git

# 3. Re-extract package
tar -xzf aria-nova-v2.6-INTEGRATED-CLEAN.tar.gz

# 4. Fresh install
npm install --legacy-peer-deps

# 5. Setup app
cp App.complete.tsx App.tsx

# 6. Start fresh
npx expo start -c
```

---

## 📞 **Still Having Issues?**

### **Check These:**
1. ✅ Extracted correct package (v2.6-INTEGRATED-CLEAN)
2. ✅ Node v16+ and npm v8+
3. ✅ All files present (see checklist)
4. ✅ Dependencies installed (`npm ls`)
5. ✅ Using App.complete.tsx
6. ✅ Metro cache cleared (`-c` flag)

### **Common Mistakes:**
- ❌ Using old v2.5 package (missing integration)
- ❌ Missing hooks/context files
- ❌ Not using App.complete.tsx
- ❌ Old node_modules from previous version
- ❌ Import path typos

---

## ✅ **Success Checklist**

After fixing, you should see:
- ✅ App starts without errors
- ✅ Onboarding appears (first time)
- ✅ Can send messages
- ✅ Agent responds
- ✅ Can switch agents
- ✅ Voice button works
- ✅ Settings opens
- ✅ History shows conversations

---

**Version:** 2.6.0  
**Last Updated:** March 2026  
**Status:** Production Ready
