// Test file to validate TypeScript type definitions for voice system
import { VoiceSettings, LanguageConfig, VoiceState } from './voice-system';

// Test VoiceSettings interface
const testVoiceSettings: VoiceSettings = {
  language: 'en-US',
  speechRate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  enableInterruption: true,
  voiceName: 'Samantha'
};

// Test LanguageConfig interface
const testLanguageConfig: LanguageConfig = {
  code: 'en-US',
  name: 'English (US)',
  flag: '🇺🇸',
  speechLang: 'en-US',
  voiceFilter: 'en',
  sampleText: 'Hello, how can I help you today?'
};

// Test VoiceState interface
const testVoiceState: VoiceState = {
  isVoiceMode: false,
  isListening: false,
  isSpeaking: false,
  speechSupported: true,
  canInterrupt: true
};

// Test Web Audio API types
function testWebAudioTypes(): void {
  // Test webkitAudioContext type
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
  }

  // Test Speech Recognition types
  const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognitionConstructor) {
    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      console.log(`Transcript: ${transcript}, Confidence: ${confidence}`);
    };
  }

  // Test Speech Synthesis types
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance('Hello world');
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    utterance.lang = 'en-US';
    
    utterance.onstart = () => console.log('Speech started');
    utterance.onend = () => console.log('Speech ended');
    utterance.onerror = (event) => console.error('Speech error:', event.error);
    
    window.speechSynthesis.speak(utterance);
  }
}

// Export test function for potential use
export { testWebAudioTypes };

// This file validates that all our TypeScript definitions are working correctly
console.log('TypeScript type definitions loaded successfully');