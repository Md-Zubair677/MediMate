// Type definitions for Voice Conversation System

export interface VoiceSettings {
  language: string;
  speechRate: number;    // 0.5 - 2.0
  pitch: number;         // 0.5 - 2.0
  volume: number;        // 0.1 - 1.0
  enableInterruption: boolean;
  voiceName?: string;
}

export interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  speechLang: string;
  voiceFilter: string;
  sampleText: string;
}

export interface VoiceState {
  isVoiceMode: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  speechSupported: boolean;
  canInterrupt: boolean;
}

export interface AudioContextExtended extends AudioContext {
  createOscillator(): OscillatorNode;
  createGain(): GainNode;
  destination: AudioDestinationNode;
  currentTime: number;
}

export interface SpeechSynthesisUtteranceExtended extends SpeechSynthesisUtterance {
  voice: SpeechSynthesisVoice | null;
  volume: number;
  rate: number;
  pitch: number;
  text: string;
  lang: string;
  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null;
  onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
}

export interface TranslationMap {
  [key: string]: string;
}

export interface VoiceConversationHooks {
  voiceMode: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  speechSupported: boolean;
  selectedLanguage: string;
  voiceSettings: VoiceSettings;
  toggleVoiceMode: () => void;
  startListening: () => void;
  stopListening: () => void;
  speakText: (text: string, forceVoiceMode?: boolean | null) => void;
  interruptSpeech: () => void;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  changeLanguage: (language: string) => void;
}

export interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp?: Date;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceError {
  type: 'recognition' | 'synthesis' | 'permission' | 'network';
  message: string;
  code?: string;
}