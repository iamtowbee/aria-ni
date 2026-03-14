# LlamaInferenceProvider Integration

## Overview

The `LlamaInferenceProvider` has been integrated into the AI Ecosystem to provide on-device inference using the TinyLlama model.

---

## Location

```
src/providers/inference/LlamaInferenceProvider.ts
lib/providers/inference/LlamaInferenceProvider.ts (library export)
```

---

## What It Does

**On-device AI inference** using llama.rn:
- Runs TinyLlama-1.1B model locally
- No internet required
- Privacy-first (all processing on-device)
- Streaming support
- Optimized for mobile

---

## Integration in AIEcosystem

### Before
```typescript
// Only had LlamaModel service wrapper
const modelAdapter = new LlamaModel({...});
```

### After
```typescript
// Now has dedicated inference provider
this.inferenceProvider = new LlamaInferenceProvider({
  modelPath: config.modelPath,
  nPredict: 512,
  temperature: 0.7,
  nCtx: 2048,
  nThreads: 4,
});

// Initialize
await this.inferenceProvider.initialize();

// Use in agents
const response = await this.inferenceProvider.generate(prompt, {
  systemPrompt: 'You are Aria-Nova...',
  maxTokens: 512,
  temperature: 0.7,
});
```

---

## Usage Examples

### 1. Direct Provider Usage

```typescript
import { LlamaInferenceProvider } from './lib';

const provider = new LlamaInferenceProvider({
  modelPath: '/path/to/model.gguf',
  temperature: 0.7,
  nCtx: 2048,
});

await provider.initialize();

const result = await provider.generate('Hello, how are you?', {
  systemPrompt: 'You are a helpful assistant.',
  maxTokens: 100,
});

console.log(result.text);
console.log(`Latency: ${result.latency}ms`);
console.log(`Tokens: ${result.usage.outputTokens}`);
```

### 2. Streaming

```typescript
const result = await provider.generateStream(
  'Write a short story',
  {
    systemPrompt: 'You are a creative writer.',
    maxTokens: 500,
  },
  (token, fullText) => {
    // Called for each token
    console.log('Token:', token);
    updateUI(fullText);
  }
);
```

### 3. In AI Ecosystem

```typescript
import { createAIEcosystem } from './src/AIEcosystem';

const ai = createAIEcosystem({
  modelPath: '/path/to/model.gguf',
  temperature: 0.7,
  nCtx: 2048,
});

await ai.initialize();

// Provider is used internally by all agents
const response = await ai.processText('Hello!');

// Get model info
const info = ai.interface.getInfo();
console.log(info.name); // "TinyLlama-1.1B-Chat"
console.log(info.size); // "637 MB"
```

### 4. As Library Export

```typescript
import {
  LlamaInferenceProvider,
  type LlamaConfig,
  type GenerateOptions,
} from '@aria-nova/core';

const config: LlamaConfig = {
  modelPath: '/path/to/model.gguf',
  nPredict: 512,
  temperature: 0.7,
  nCtx: 2048,
  nThreads: 4,
};

const provider = new LlamaInferenceProvider(config);
```

---

## API Reference

### Constructor

```typescript
new LlamaInferenceProvider(config?: LlamaConfig)
```

**Config Options:**
- `modelPath?: string` - Path to GGUF model file
- `nPredict?: number` - Max tokens to generate (default: 512)
- `temperature?: number` - Sampling temperature (default: 0.7)
- `nCtx?: number` - Context window size (default: 2048)
- `nThreads?: number` - Number of threads (default: 4)

### Methods

**initialize(): Promise<void>**
Loads the model into memory. Must be called before generation.

**generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>**
Generate text completion.

Options:
- `systemPrompt?: string` - System instructions
- `maxTokens?: number` - Override nPredict
- `temperature?: number` - Override temperature
- `topP?: number` - Top-p sampling (default: 0.9)

Returns:
```typescript
{
  text: string;
  usage: { outputTokens: number };
  latency: number;
  tier: 'device';
}
```

**generateStream(prompt, options?, onToken?): Promise<GenerateResult>**
Streaming generation with token-by-token callback.

**dispose(): Promise<void>**
Cleanup and release model from memory.

**getInfo(): ModelInfo**
Get model information.

Returns:
```typescript
{
  name: string;
  size: string;
  quantization: string;
  loaded: boolean;
  path: string;
}
```

### Properties

**isAvailable: boolean** (readonly)
Whether the provider is initialized and ready.

**name: string**
Provider name ('llama-local').

**tier: string**
Inference tier ('device').

---

## Model File

### Required Model
- **TinyLlama-1.1B-Chat-v1.0** (Q4_0 quantization)
- **Size:** 637 MB
- **Format:** GGUF
- **Location:** `FileSystem.documentDirectory + 'tinyllama-1.1b-chat-v1.0-q4_0.gguf'`

### Download
You'll need to download the model separately and place it in the app's document directory.

---

## Dependencies

Added to package.json:
```json
{
  "dependencies": {
    "@mybigday/llama.rn": "^0.3.0",
    "expo-file-system": "~19.0.0"
  }
}
```

---

## Prompt Format

The provider uses ChatML format:
```
<|system|>
{system_prompt}</s>
<|user|>
{user_prompt}</s>
<|assistant|>
```

---

## Performance

### Device Tier
- **Platform:** On-device (no server)
- **Latency:** 50-200ms per token (device dependent)
- **Throughput:** 5-20 tokens/second
- **Memory:** ~800 MB when loaded

### Optimization
- Uses memory-mapped files (mmap)
- Memory locking (mlock) for performance
- Multi-threaded inference
- Quantized model (Q4_0) for size/speed

---

## Integration Points

### In AIEcosystem.ts
```typescript
// Line ~4: Import
import { LlamaInferenceProvider } from './providers/inference/LlamaInferenceProvider';

// Line ~15: Initialize
this.inferenceProvider = new LlamaInferenceProvider({...});

// Line ~87: Load
await this.inferenceProvider.initialize();

// Used by: CoreAgent, AlphaAgent, CreativityAgent
```

### In Library (lib/index.ts)
```typescript
export { LlamaInferenceProvider } from './providers/inference/LlamaInferenceProvider';
export type { LlamaConfig, GenerateOptions, GenerateResult, ModelInfo };
```

---

## Benefits

### Privacy
✅ All inference on-device
✅ No data sent to servers
✅ Works offline

### Performance
✅ Low latency (no network)
✅ Streaming support
✅ Optimized for mobile

### Cost
✅ No API costs
✅ No usage limits
✅ Free inference

### Integration
✅ Drop-in replacement for LlamaModel
✅ Backward compatible
✅ Clean interface

---

## Testing

```typescript
// Test provider directly
const provider = new LlamaInferenceProvider();

console.log('Available:', provider.isAvailable); // false

await provider.initialize();

console.log('Available:', provider.isAvailable); // true

const info = provider.getInfo();
console.log('Model:', info.name);

const result = await provider.generate('Hello!');
console.log('Response:', result.text);
console.log('Latency:', result.latency, 'ms');

await provider.dispose();
```

---

## Summary

✅ **Integrated** - LlamaInferenceProvider added to AIEcosystem
✅ **Exported** - Available in library (lib/index.ts)
✅ **Typed** - Full TypeScript support
✅ **Documented** - Complete API reference
✅ **Tested** - Works with all agents
✅ **Backward Compatible** - Doesn't break existing code

**Ready to use!** 🚀
