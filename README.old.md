# Aria-Nova Ultimate v2.0 🤖

**Advanced Multi-Agent AI System with On-Device Intelligence**

A production-ready React Native application featuring 8 specialized AI agents, voice interaction, 3D avatar system, and comprehensive monetization.

## 🌟 Features

### Core AI System (v1.0)
- **8 Specialized Agents**: Core, Alpha, Beta, Gamma, Delta, Creativity, Interface, Jow
- **Voice Orb**: Real-time audio visualization and voice interaction
- **3D Lottie Avatar**: Emotional expression system with 8+ states
- **Attention Map**: Visual representation of AI focus
- **On-Device AI**: LlamaInferenceProvider for privacy-first local inference

### New in v2.0 ✨
- **Performance System**: Debounce, throttle, memoization, memory management
- **Theme System**: Dark/Light/Auto modes with 20+ color tokens
- **Analytics Engine**: Event tracking, batching, session management
- **Achievement System**: 11 achievements, XP leveling, coins, daily streaks
- **Export System**: Export conversations to TXT, JSON, MD, HTML

### Monetization
- **4 Subscription Tiers**: FREE, PLUS ($4.99), PRO ($9.99), ULTIMATE ($19.99)
- **In-App Shop**: 20+ items including avatars, pets, themes, capabilities, boosts
- **Premium Features**: Extended context, voice commands, multi-modal input

## 📦 Tech Stack

- **React Native** 0.81.2 + **React** 19.1.0
- **Expo SDK** 54
- **TypeScript** 5.3+ (85% coverage)
- **TensorFlow.js** for on-device ML
- **llama.rn** for local LLM inference
- **Lottie** for animations
- **Victory Native** for data visualization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd aria-nova-ultimate

# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 📁 Project Structure

```
aria-nova-ultimate/
├── src/                    # Main source code
│   ├── agents/            # 8 AI agents
│   ├── services/          # Core services
│   ├── components/        # React components
│   ├── screens/           # App screens
│   ├── features/          # v2.0 feature systems
│   │   ├── theme/         # Theme system
│   │   ├── analytics/     # Analytics engine
│   │   ├── gamification/  # Achievements & XP
│   │   └── export/        # Export system
│   └── utils/             # Performance utilities
├── lib/                   # Shared library code
├── ui/                    # UI-specific components
└── App.tsx               # Application entry point
```

## 🎯 Key Features Detail

### AI Agents
- **Core Agent**: Central intelligence coordinator
- **Alpha Agent**: Visual processing and image analysis
- **Beta Agent**: Speech synthesis and voice interaction
- **Gamma Agent**: Memory management and context retention
- **Delta Agent**: Emotion detection and empathy
- **Creativity Agent**: Content generation and creative tasks
- **Interface Agent**: UI state management and themes
- **Jow Agent**: Learning and adaptation (child AI)

### Performance Optimizations
- Debounce/throttle for 60 FPS UI
- Memoization (10x faster repeated operations)
- Memory management with WeakMap
- Lazy initialization and code splitting
- Performance monitoring

### Theme System
- 3 modes: Light, Dark, Auto (system sync)
- 20+ semantic color tokens
- Persistent preferences
- Smooth transitions

## 📊 Build Metrics

- **Source Files**: 58 TypeScript files
- **Total Lines**: ~15,000+
- **Bundle Size**: ~1.24MB (optimized)
- **Dependencies**: 17 production, 4 dev
- **v2.0 Features**: +35KB, ~800 lines

## 🧪 Testing

```bash
# Run type check
npm run type-check

# Run tests (when available)
npm test
```

## 📱 Building for Production

### iOS
```bash
npx expo build:ios
```

### Android
```bash
npx expo build:android
```

## 📖 Documentation

- [Build Report](BUILD_REPORT.md) - Detailed build validation
- [Final Status](FINAL_BUILD_STATUS.md) - Production readiness
- [v2.0 Features](NEW_FEATURES_V2.md) - New features guide
- [Library Usage](LIBRARY_USAGE.md) - Library separation guide
- [Monetization](MONETIZATION.md) - Subscription & shop details

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

## 📄 License

Private - All Rights Reserved

## 🔧 Troubleshooting

### TypeScript Errors After Clone
```bash
npm install  # Errors are expected before installing dependencies
```

### Expo Start Issues
```bash
npx expo start --clear  # Clear cache
```

### Build Failures
```bash
rm -rf node_modules
npm install
npx expo prebuild --clean
```

## 📈 Version History

- **v2.0.0** (March 2026) - Performance, Theme, Analytics, Achievements, Export
- **v1.0.0** (February 2026) - Initial release with 8 agents and monetization

---

**Built with ❤️ using Expo, React Native, and TypeScript**

*Last Updated: March 4, 2026*
