# TypeScript Type Definitions for MediMate Voice System

This directory contains comprehensive TypeScript type definitions for the MediMate voice conversation system, providing proper typing for Web Audio API, Speech Recognition API, and custom voice system interfaces.

## 📁 File Structure

- **`global.d.ts`** - Global type declarations for Web APIs and browser compatibility
- **`voice-system.d.ts`** - Custom interfaces for voice conversation system
- **`web-audio.d.ts`** - Extended Web Audio API and Speech API type definitions
- **`index.ts`** - Main export file for easy imports
- **`test-types.ts`** - Validation file for testing type definitions

## 🔧 Installation Complete

The following TypeScript packages have been installed:

```json
{
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0", 
  "typescript": "^4.9.0"
}
```

## 🌐 Global Type Extensions

### Web Audio API Support
- **`webkitAudioContext`** - Webkit-prefixed AudioContext for Safari compatibility
- **`AudioContext`** - Extended with proper method signatures
- **`OscillatorNode`**, **`GainNode`** - Properly typed audio nodes

### Speech Recognition API
- **`webkitSpeechRecognition`** - Webkit-prefixed SpeechRecognition
- **`SpeechRecognition`** - Complete interface with all properties and events
- **`SpeechRecognitionEvent`** - Event handling with proper result types

### Speech Synthesis API
- **`SpeechSynthesis`** - Global speechSynthesis object typing
- **`SpeechSynthesisUtterance`** - Complete utterance interface
- **`SpeechSynthesisVoice`** - Voice selection and properties

## 🎯 Custom Voice System Types

### Core Interfaces

```typescript
// Voice configuration settings
interface VoiceSettings {
  language: string;
  speechRate: number;    // 0.5 - 2.0
  pitch: number;         // 0.5 - 2.0  
  volume: number;        // 0.1 - 1.0
  enableInterruption: boolean;
  voiceName?: string;
}

// Language configuration
interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  speechLang: string;
  voiceFilter: string;
  sampleText: string;
}

// Voice system state
interface VoiceState {
  isVoiceMode: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  speechSupported: boolean;
  canInterrupt: boolean;
}
```

## 📝 Usage Examples

### Importing Types

```typescript
// Import specific types
import { VoiceSettings, LanguageConfig } from './types/voice-system';

// Import all types
import * as VoiceTypes from './types';

// Global types are automatically available
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
```

### Using Web Audio API with Types

```typescript
function createAmbientSound(): void {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (AudioContextConstructor) {
    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
  }
}
```

### Using Speech Recognition with Types

```typescript
function setupSpeechRecognition(): void {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      console.log(`Transcript: ${transcript}, Confidence: ${confidence}`);
    };
    
    recognition.start();
  }
}
```

### Using Speech Synthesis with Types

```typescript
function speakText(text: string, settings: VoiceSettings): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.speechRate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = settings.language;
    
    utterance.onstart = () => console.log('Speech started');
    utterance.onend = () => console.log('Speech ended');
    utterance.onerror = (event) => console.error('Speech error:', event.error);
    
    window.speechSynthesis.speak(utterance);
  }
}
```

## 🔍 Type Validation

The `test-types.ts` file contains comprehensive examples and validation for all type definitions. It ensures:

- ✅ All interfaces compile without errors
- ✅ Web Audio API types work correctly
- ✅ Speech Recognition API types are properly defined
- ✅ Speech Synthesis API types function as expected
- ✅ Custom voice system interfaces are valid

## 🛠️ Development Benefits

With these TypeScript definitions, you get:

1. **IntelliSense Support** - Auto-completion for all voice system APIs
2. **Type Safety** - Compile-time error checking for voice-related code
3. **Better Documentation** - Self-documenting interfaces and types
4. **Refactoring Safety** - Confident code changes with type checking
5. **Browser Compatibility** - Proper handling of webkit-prefixed APIs

## 🔧 Configuration

The TypeScript configuration (`tsconfig.json`) has been updated to:

- Include `webworker` library for Web Audio API support
- Add custom `typeRoots` for our voice system types
- Enable strict mode for better type safety
- Support React JSX with `react-jsx` transform

## 🚀 Next Steps

1. Convert existing JavaScript voice components to TypeScript (optional)
2. Use the type definitions in new voice-related features
3. Extend the types as needed for additional voice functionality
4. Run type checking with `npx tsc --noEmit` to validate code

The TypeScript type definitions are now fully installed and configured for the MediMate voice conversation system!