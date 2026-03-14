# Agent Architecture - Aria-Nova Ultimate v2.0

## 🎯 Separation of Concerns Principle

Each agent has a **clear, focused responsibility** with well-defined boundaries. No overlapping concerns.

---

## 📋 Agent Roster

### 1. **CoreAgent** - Central Intelligence Coordinator
**Role**: System orchestration and conversation management  
**Responsibilities**:
- Route requests to appropriate specialized agents
- Manage conversation context and memory
- Coordinate multi-agent responses
- Handle text-based queries directly
- System-level decision making

**Does NOT handle**:
- Media capture
- Vision processing
- Voice synthesis
- UI state
- Emotions

---

### 2. **AlphaAgent** - Media Capture & Input Specialist
**Role**: Image/video input and preparation  
**Responsibilities**:
- Camera capture
- Gallery selection
- Media format conversions
- Image quality optimization
- Base64 encoding/caching
- Delegate to VisionAgent for AI processing

**Does NOT handle**:
- Computer vision inference
- Image understanding
- Object detection
- Visual question answering

**Key Methods**:
- `pickImage()` - Select from gallery
- `takePhoto()` - Capture with camera
- `imageToBase64()` - Format conversion
- `analyzeImage()` - **Delegates** to VisionAgent

---

### 3. **VisionAgent** - Visual Intelligence & Scene Understanding ⭐ NEW
**Role**: Real-time computer vision with Moondream  
**Responsibilities**:
- Image description and captioning
- Object detection and classification
- Visual question answering
- Scene understanding
- Object counting
- Image comparison
- Visual context management

**Does NOT handle**:
- Media capture (that's AlphaAgent)
- Image file operations
- Format conversions

**Key Methods**:
- `describeImage(imageUri, prompt)` - Generate description
- `detectObjects(imageUri)` - Find objects
- `answerQuestion(imageUri, question)` - VQA
- `countObjects(imageUri, objectType)` - Count items
- `compareImages(uri1, uri2)` - Similarity analysis
- `getVisualContext()` - Recent visual history

**Provider**: `MoondreamVisionProvider`  
**Preprocessor**: `ImageProcessor`

---

### 4. **BetaAgent** - Speech Synthesis Specialist
**Role**: Voice output and audio generation  
**Responsibilities**:
- Text-to-speech conversion
- Voice parameter control (pitch, rate, language)
- Speech queue management
- Voice customization

**Does NOT handle**:
- Speech recognition
- Audio input
- Voice commands (that's separate)

---

### 5. **GammaAgent** - Memory & Context Manager
**Role**: Long-term memory and context retention  
**Responsibilities**:
- Store conversation history
- Retrieve relevant context
- Semantic search in memory
- Memory compression
- Context summarization

**Does NOT handle**:
- Immediate processing
- Routing
- Vision memory (that's in VisionAgent)

---

### 6. **DeltaAgent** - Emotion & Empathy Specialist
**Role**: Emotional intelligence and detection  
**Responsibilities**:
- Detect user emotions from text
- Generate empathetic responses
- Emotional state tracking
- Sentiment analysis
- Tone adaptation

**Does NOT handle**:
- Visual emotions (facial expressions)
- Avatar animations
- Voice emotion

---

### 7. **CreativityAgent** - Content Generation Specialist
**Role**: Creative writing and generation  
**Responsibilities**:
- Stories and narratives
- Poetry and creative text
- Code generation
- Brainstorming
- Creative problem solving

**Does NOT handle**:
- Factual queries
- Data analysis
- Vision tasks

---

### 8. **InterfaceAgent** - UI State & Theme Manager
**Role**: User interface coordination  
**Responsibilities**:
- Theme management
- UI state transitions
- Avatar emotion states
- Visual feedback coordination
- Interface preferences

**Does NOT handle**:
- Actual rendering
- Vision processing
- Content generation

---

### 9. **JowAgent** - Child AI & Learning System
**Role**: Learning and adaptation  
**Responsibilities**:
- Learn from interactions
- Personality development
- Adaptive responses
- User preference learning
- Conversational growth

**Does NOT handle**:
- Core decision making
- System coordination
- Media processing

---

## 🔗 Agent Communication Flow

```
User Input
    ↓
CoreAgent (Router)
    ↓
    ├─→ Text Query → CoreAgent (handles directly)
    ├─→ Image Needed → AlphaAgent (capture) → VisionAgent (analyze)
    ├─→ Voice Output → BetaAgent
    ├─→ Memory Needed → GammaAgent
    ├─→ Emotion Detected → DeltaAgent
    ├─→ Creative Task → CreativityAgent
    ├─→ UI Update → InterfaceAgent
    └─→ Learning → JowAgent
```

---

## 🏗️ Supporting Infrastructure

### Providers (Inference Layer)
**Separation**: Model inference separate from agent logic

1. **LlamaInferenceProvider** (`src/providers/inference/`)
   - On-device LLM inference
   - Text generation
   - Used by: CoreAgent, CreativityAgent

2. **MoondreamVisionProvider** (`src/providers/vision/`) ⭐ NEW
   - Vision-language model
   - Image understanding
   - Used by: VisionAgent

### Utilities (Pure Functions)
**Separation**: Reusable logic separate from agents

1. **ImageProcessor** (`src/utils/`) ⭐ NEW
   - Image preprocessing
   - Format conversions
   - Quality optimization
   - Used by: VisionAgent, AlphaAgent

2. **Performance Utils** (`src/utils/performance.ts`)
   - Debounce, throttle, memoization
   - Used by: All agents

---

## 📊 Clear Boundaries Matrix

| Agent | Media Capture | Vision AI | Voice | Memory | Emotion | UI | Creative |
|-------|--------------|-----------|-------|---------|---------|----|---------

|
| Core | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Alpha | ✅ | ❌* | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vision | ❌ | ✅ | ❌ | ✅** | ❌ | ❌ | ❌ |
| Beta | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gamma | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Delta | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Creativity | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Interface | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Jow | ❌ | ❌ | ❌ | ✅** | ❌ | ❌ | ❌ |

*Alpha delegates vision to VisionAgent  
**Visual memory only for Vision, conversation memory for Gamma/Jow

---

## 🎨 Agent Naming Convention

All agents follow clear, descriptive naming:

✅ **Good Names** (Our System):
- `CoreAgent` - Central coordinator (not "MainAgent", "ManagerAgent")
- `AlphaAgent` - Media capture specialist
- `VisionAgent` - Visual intelligence (clear purpose)
- `BetaAgent` - Speech synthesis
- `GammaAgent` - Memory manager
- `DeltaAgent` - Emotion specialist
- `CreativityAgent` - Content generation (not "WriterAgent", "TextAgent")
- `InterfaceAgent` - UI state manager (not "UIAgent", "ThemeAgent")
- `JowAgent` - Child AI (unique personality name)

❌ **Poor Names** (What we avoid):
- `Agent1`, `Agent2` - No meaning
- `HelperAgent` - Too vague
- `ProcessorAgent` - Not specific
- `UtilityAgent` - Unclear role
- `SuperAgent` - Overreaching

---

## 🔧 Integration Example

```typescript
// Initialize agents with proper separation
const visionAgent = new VisionAgent({
  modelPath: './models/moondream2',
  enableCache: true,
});

const alphaAgent = new AlphaAgent({
  visionAgent: visionAgent, // Inject dependency
});

const coreAgent = new CoreAgent({
  alphaAgent,
  visionAgent,
  // ... other agents
});

// Usage: Media capture → Vision analysis
const image = await alphaAgent.takePhoto();
const description = await visionAgent.describeImage(image.uri, 'What is this?');

// Or via delegation
const result = await alphaAgent.analyzeImage(image.uri, 'What is this?');
// AlphaAgent automatically delegates to VisionAgent
```

---

## 🚀 Vision Agent Usage Examples

```typescript
// 1. Describe an image
const result = await visionAgent.describeImage(
  imageUri,
  'Describe this image in detail'
);
// → { description: "A red bicycle...", confidence: 0.92, processingTime: 234 }

// 2. Detect objects
const objects = await visionAgent.detectObjects(imageUri);
// → [{ label: "person", confidence: 0.95, bbox: [...] }, ...]

// 3. Answer questions
const answer = await visionAgent.answerQuestion(
  imageUri,
  'What color is the car?'
);
// → { answer: "The car is blue", confidence: 0.88 }

// 4. Count objects
const count = await visionAgent.countObjects(imageUri, 'people');
// → { count: 3, confidence: 0.90 }

// 5. Compare images
const similarity = await visionAgent.compareImages(uri1, uri2);
// → { similarity: 0.85, differences: [...], processingTime: 456 }

// 6. Get visual context
const context = visionAgent.getVisualContext(5);
// → Last 5 analyzed images with descriptions
```

---

## 📈 Performance Characteristics

### AlphaAgent (Media Capture)
- **Speed**: Instant (native camera/gallery)
- **Memory**: ~2-5MB (base64 cache)
- **Dependencies**: Expo ImagePicker

### VisionAgent (Computer Vision)
- **Speed**: 200-500ms per image (on-device)
- **Memory**: ~100MB (model loaded)
- **Dependencies**: TensorFlow.js, Moondream model
- **Accuracy**: 85-95% depending on task

### ImageProcessor (Utility)
- **Speed**: 50-100ms per image
- **Memory**: ~10MB (processing cache)
- **Dependencies**: Expo ImageManipulator

---

## 🎯 Design Principles Applied

1. **Single Responsibility**: Each agent has ONE clear job
2. **Dependency Injection**: Agents receive dependencies, don't create them
3. **Interface Segregation**: Agents expose only what they do
4. **Separation of Concerns**: Logic, inference, and utilities are separate
5. **Clear Naming**: Names describe purpose, not implementation

---

## 🔮 Future Agent Extensions

**Potential new agents** (following same principles):

- `AudioAgent` - Audio capture & processing (separate from Beta)
- `OCRAgent` - Text extraction from images
- `TranslationAgent` - Language translation
- `SearchAgent` - Web search coordination
- `PlanningAgent` - Multi-step task planning
- `CodeAgent` - Code analysis & generation

Each would have:
- Clear, single responsibility
- Dedicated provider if needed
- Well-defined interfaces
- No overlap with existing agents

---

**Last Updated**: March 5, 2026  
**Version**: 2.0 with Vision capabilities  
**Status**: Production-ready architecture
