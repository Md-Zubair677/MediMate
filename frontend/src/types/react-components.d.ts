// Type definitions for React components used in voice conversation system
import { ReactNode } from 'react';

export interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  voiceMode: boolean;
  speechSupported: boolean;
  onToggleListening: () => void;
  onToggleVoiceMode: () => void;
  onInterruptSpeech: () => void;
}

export interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp?: Date;
}

export interface ChatPageProps {
  className?: string;
  children?: ReactNode;
}

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
  language: string;
}

export interface AudioContextState {
  context: AudioContext | null;
  oscillators: OscillatorNode[];
  gainNode: GainNode | null;
  isPlaying: boolean;
}

export interface SpeechRecognitionState {
  isSupported: boolean;
  isListening: boolean;
  recognition: SpeechRecognition | null;
  transcript: string;
  confidence: number;
}

export interface SpeechSynthesisState {
  isSpeaking: boolean;
  isPaused: boolean;
  voices: SpeechSynthesisVoice[];
  currentUtterance: SpeechSynthesisUtterance | null;
}