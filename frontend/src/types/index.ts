// Main types export file for voice conversation system
export * from './web-audio';
export * from './react-components';

// Additional utility types for the voice conversation system
export type VoiceMode = 'enabled' | 'disabled';
export type SpeechLanguage = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT' | 'pt-BR';
export type AudioQuality = 'low' | 'medium' | 'high';

export interface VoiceConversationConfig {
  voiceMode: VoiceMode;
  language: SpeechLanguage;
  audioQuality: AudioQuality;
  autoSpeak: boolean;
  interruptionEnabled: boolean;
  ambientSoundEnabled: boolean;
}