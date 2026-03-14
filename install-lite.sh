#!/bin/bash
# install-lite.sh - Data-efficient installation script

echo "🌐 Aria Nova - Data-Efficient Installation"
echo "=========================================="
echo ""

# Check if package.lite.json exists
if [ ! -f "package.lite.json" ]; then
    echo "❌ Error: package.lite.json not found"
    echo "Make sure you're in the aria-nova-ultimate directory"
    exit 1
fi

echo "📦 Installation Options:"
echo ""
echo "1. Lite Install (165MB) - Core features only"
echo "2. Expo Go (165MB) - No native build, use Expo Go app"
echo "3. Full Install (400MB) - All features"
echo "4. Cached Install (0MB) - Use existing cache"
echo ""

read -p "Choose option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "✅ Installing LITE version..."
        cp package.lite.json package.json
        npm install --prefer-offline --no-optional
        echo ""
        echo "✅ Lite installation complete!"
        echo "📊 Saved ~240MB of data"
        echo ""
        echo "Start app: npx expo start"
        ;;
    2)
        echo ""
        echo "✅ Installing for Expo Go..."
        cp package.lite.json package.json
        npm install --no-optional
        echo ""
        echo "✅ Installation complete!"
        echo "📱 Download Expo Go app from App Store"
        echo "🚀 Start with: npx expo start"
        echo "📷 Scan QR code with Expo Go"
        ;;
    3)
        echo ""
        echo "⚠️  This will download ~400MB"
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            npm install
            echo ""
            echo "✅ Full installation complete!"
            echo "🚀 Start with: npx expo start"
        else
            echo "Installation cancelled"
        fi
        ;;
    4)
        echo ""
        if [ -d "node_modules" ]; then
            echo "✅ Using cached node_modules"
            npm install --offline
            echo ""
            echo "✅ Cached installation complete (0MB downloaded)!"
        else
            echo "❌ No cache found. Run full install first."
        fi
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "📝 Next steps:"
echo "  npx expo start        - Start development server"
echo "  npm run ios           - Run on iOS"
echo "  npm run android       - Run on Android"
echo ""
echo "💡 Tip: Use Expo Go app to avoid pod install entirely!"
