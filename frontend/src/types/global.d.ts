// Global type declarations for MediMate Voice System

import { VoiceSettings, LanguageConfig } from './voice-system';

declare global {
  // Extend Window interface for webkit prefixed APIs
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    webkitSpeechRecognition?: typeof SpeechRecognition;
    SpeechRecognition?: typeof SpeechRecognition;
    speechSynthesis: SpeechSynthesis;
  }

  // Extend AudioContext for webkit compatibility
  interface AudioContext {
    createOscillator(): OscillatorNode;
    createGain(): GainNode;
    destination: AudioDestinationNode;
    currentTime: number;
    resume(): Promise<void>;
    suspend(): Promise<void>;
    close(): Promise<void>;
  }

  // Ensure SpeechSynthesis is properly typed
  interface SpeechSynthesis {
    pending: boolean;
    speaking: boolean;
    paused: boolean;
    onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null;
    cancel(): void;
    getVoices(): SpeechSynthesisVoice[];
    pause(): void;
    resume(): void;
    speak(utterance: SpeechSynthesisUtterance): void;
  }

  // Ensure SpeechSynthesisVoice is properly typed
  interface SpeechSynthesisVoice {
    readonly default: boolean;
    readonly lang: string;
    readonly localService: boolean;
    readonly name: string;
    readonly voiceURI: string;
  }

  // Ensure SpeechSynthesisUtterance is properly typed
  interface SpeechSynthesisUtterance extends EventTarget {
    lang: string;
    pitch: number;
    rate: number;
    text: string;
    voice: SpeechSynthesisVoice | null;
    volume: number;
    onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null;
    onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  }

  // Constructor for SpeechSynthesisUtterance
  var SpeechSynthesisUtterance: {
    prototype: SpeechSynthesisUtterance;
    new(text?: string): SpeechSynthesisUtterance;
  };

  // Events for Speech Synthesis
  interface SpeechSynthesisEvent extends Event {
    readonly charIndex: number;
    readonly charLength: number;
    readonly elapsedTime: number;
    readonly name: string;
    readonly utterance: SpeechSynthesisUtterance;
  }

  interface SpeechSynthesisErrorEvent extends SpeechSynthesisEvent {
    readonly error: string;
  }
}

// Module augmentation for React components
declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Add any custom attributes if needed
  }
}

export {};