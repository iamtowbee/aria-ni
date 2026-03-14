#!/bin/bash
# fix-and-install.sh
# Fixes all import errors and installs dependencies

echo "🔧 Aria Nova v2.6 - Fix & Install Script"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Dependencies installed${NC}"
else
  echo -e "${RED}✗ Failed to install dependencies${NC}"
  exit 1
fi

echo ""

# Step 2: Install navigation packages
echo -e "${YELLOW}Step 2: Installing navigation packages...${NC}"
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Navigation packages installed${NC}"
else
  echo -e "${RED}✗ Failed to install navigation packages${NC}"
  exit 1
fi

echo ""

# Step 3: Check required files
echo -e "${YELLOW}Step 3: Checking required files...${NC}"

FILES_TO_CHECK=(
  "src/hooks/useConversation.ts"
  "src/hooks/useVoiceRecording.ts"
  "src/hooks/useConversationHistory.ts"
  "src/hooks/adapters/AgentAdapter.ts"
  "src/context/AppContext.tsx"
  "src/screens/IntegratedModernChatScreen.tsx"
  "App.complete.tsx"
)

ALL_EXIST=true
for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
  else
    echo -e "${RED}✗${NC} $file ${RED}(MISSING)${NC}"
    ALL_EXIST=false
  fi
done

if [ "$ALL_EXIST" = false ]; then
  echo -e "${RED}Some files are missing. Please extract the complete package.${NC}"
  exit 1
fi

echo ""

# Step 4: Backup and replace App.tsx
echo -e "${YELLOW}Step 4: Setting up main App file...${NC}"

if [ -f "App.tsx" ]; then
  if [ ! -f "App.tsx.backup" ]; then
    cp App.tsx App.tsx.backup
    echo -e "${GREEN}✓ Backed up App.tsx to App.tsx.backup${NC}"
  fi
fi

cp App.complete.tsx App.tsx
echo -e "${GREEN}✓ Using App.complete.tsx as App.tsx${NC}"

echo ""

# Step 5: Verify agent files
echo -e "${YELLOW}Step 5: Verifying agent files...${NC}"

AGENT_FILES=(
  "src/agents/CoreAgent.ts"
  "src/agents/VisionAgent.ts"
  "src/agents/OCRAgent.ts"
  "src/agents/CreativityAgent.ts"
)

for agent in "${AGENT_FILES[@]}"; do
  if [ -f "$agent" ]; then
    echo -e "${GREEN}✓${NC} $agent"
  else
    echo -e "${RED}✗${NC} $agent ${RED}(MISSING)${NC}"
  fi
done

echo ""

# Step 6: Create expo config if missing
echo -e "${YELLOW}Step 6: Checking Expo configuration...${NC}"

if [ ! -f "app.json" ]; then
  cat > app.json << 'EOF'
{
  "expo": {
    "name": "Aria Nova Ultimate",
    "slug": "aria-nova-ultimate",
    "version": "2.6.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.arianovo.ultimate"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.arianovo.ultimate"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": []
  }
}
EOF
  echo -e "${GREEN}✓ Created app.json${NC}"
else
  echo -e "${GREEN}✓ app.json exists${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Run: npx expo start"
echo "  2. Press 'i' for iOS or 'a' for Android"
echo "  3. Complete the onboarding flow"
echo "  4. Start chatting with AI agents!"
echo ""
echo "To restore original App.tsx:"
echo "  cp App.tsx.backup App.tsx"
echo ""
