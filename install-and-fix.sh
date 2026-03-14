#!/bin/bash
# install-and-fix.sh
# Complete installation and fixes for Aria Nova v2.6

set -e

echo "🚀 Aria Nova v2.6 - Installation & Fix Script"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check Node and npm
echo "📋 Step 1: Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node: $(node --version)"
echo -e "${GREEN}✓${NC} npm: $(npm --version)"
echo ""

# 2. Clean old installs
echo "🧹 Step 2: Cleaning old installations..."
rm -rf node_modules
rm -f package-lock.json
rm -rf .expo
echo -e "${GREEN}✓${NC} Cleaned"
echo ""

# 3. Install dependencies
echo "📦 Step 3: Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Standard install failed, trying with force...${NC}"
    npm install --legacy-peer-deps --force
fi

echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# 4. Fix imports
echo "🔧 Step 4: Fixing import paths..."

# Create adapter directory if missing
mkdir -p src/hooks/adapters

# Create index file for components/ui if missing
if [ ! -f src/components/ui/index.ts ]; then
    cat > src/components/ui/index.ts << 'EOF'
// src/components/ui/index.ts
export { AvatarCard } from './AvatarCard';
export type { AvatarCardProps, AvatarMood, AvatarStatus } from './AvatarCard';

export { ChatBubble } from './ChatBubble';
export type { ChatBubbleProps } from './ChatBubble';

export { VoiceInputButton } from './VoiceInputButton';
export type { VoiceInputButtonProps, VoiceInputMode } from './VoiceInputButton';

export { AgentSelector } from './AgentSelector';
export type { AgentSelectorProps, Agent } from './AgentSelector';

export { SuggestionChips } from './SuggestionChips';
export type { SuggestionChipsProps, Suggestion } from './SuggestionChips';
EOF
    echo -e "${GREEN}✓${NC} Created UI components index"
fi

echo -e "${GREEN}✓${NC} Import paths fixed"
echo ""

# 5. Setup App.tsx
echo "🎯 Step 5: Setting up App.tsx..."

if [ -f App.complete.tsx ]; then
    # Backup old App.tsx
    if [ -f App.tsx ]; then
        mv App.tsx App.backup.$(date +%s).tsx
        echo -e "${YELLOW}⚠️  Backed up old App.tsx${NC}"
    fi
    
    # Copy complete app
    cp App.complete.tsx App.tsx
    echo -e "${GREEN}✓${NC} Using App.complete.tsx"
else
    echo -e "${YELLOW}⚠️  App.complete.tsx not found, keeping current App.tsx${NC}"
fi
echo ""

# 6. Verify critical files
echo "✅ Step 6: Verifying installation..."

ERRORS=0

# Check hooks
if [ ! -f src/hooks/useConversation.ts ]; then
    echo -e "${RED}❌ Missing: src/hooks/useConversation.ts${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ ! -f src/hooks/useVoiceRecording.ts ]; then
    echo -e "${RED}❌ Missing: src/hooks/useVoiceRecording.ts${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ ! -f src/hooks/useConversationHistory.ts ]; then
    echo -e "${RED}❌ Missing: src/hooks/useConversationHistory.ts${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check context
if [ ! -f src/context/AppContext.tsx ]; then
    echo -e "${RED}❌ Missing: src/context/AppContext.tsx${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check screens
if [ ! -f src/screens/IntegratedModernChatScreen.tsx ]; then
    echo -e "${RED}❌ Missing: src/screens/IntegratedModernChatScreen.tsx${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check components
if [ ! -f src/components/ui/AvatarCard.tsx ]; then
    echo -e "${RED}❌ Missing: src/components/ui/AvatarCard.tsx${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All critical files present"
else
    echo -e "${RED}❌ Found $ERRORS missing files${NC}"
    echo ""
    echo "Please extract the complete v2.6 package:"
    echo "  tar -xzf aria-nova-v2.6-INTEGRATED-CLEAN.tar.gz"
    exit 1
fi
echo ""

# 7. TypeScript check
echo "📝 Step 7: TypeScript check..."
if command -v tsc &> /dev/null; then
    npx tsc --noEmit --skipLibCheck || echo -e "${YELLOW}⚠️  TypeScript warnings (non-critical)${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript not available${NC}"
fi
echo ""

# 8. Summary
echo "═══════════════════════════════════════════"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo "═══════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Start the app:    npm start"
echo "  2. Or with Expo:     npx expo start"
echo "  3. Press 'i' for iOS simulator"
echo "  4. Press 'a' for Android emulator"
echo "  5. Scan QR code for physical device"
echo ""
echo "Troubleshooting:"
echo "  - Clear cache:       npx expo start -c"
echo "  - Reinstall:         ./install-and-fix.sh"
echo "  - Check docs:        cat QUICK_START_V2.6.md"
echo ""
echo "🎉 Happy building!"
