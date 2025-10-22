# ChatPage Component - MediMate Health Assistant

## Overview
The ChatPage component is a comprehensive healthcare chat interface with advanced voice interaction capabilities, multi-language support, and medical consultation features.

## Features

### ✅ Core Functionality
- **AI Health Assistant**: MediMate provides health advice and answers medical questions
- **Real-time Chat**: Interactive messaging with typing indicators
- **Error Handling**: Comprehensive error management with recovery suggestions

### ✅ Voice Features
- **Speech Recognition**: Voice input in multiple languages
- **Text-to-Speech**: Natural voice responses with configurable settings
- **Voice Interruption**: Users can interrupt AI speech (Space bar)
- **Ambient Audio**: Medical atmosphere background sounds
- **Bell Notifications**: Audio cues for conversation flow

### ✅ Multi-language Support
- English (US/UK)
- Telugu (తెలుగు)
- Hindi (हिंदी) with medical translations
- Tamil (தமிழ்)
- Kannada (ಕನ್ನಡ)
- Spanish, French, German

### ✅ Medical Features
- Pre-translated medical advice in Hindi
- Symptom support (fever, headache, cough, cold)
- Professional voice selection for medical consultation
- Healthcare-focused UI design

## Usage

### Basic Chat
1. Type your health question in the input field
2. Press Enter or click Send
3. MediMate will respond with helpful health advice

### Voice Mode
1. Click "🔇 Voice OFF" to activate voice mode
2. Click "🎤 Speak" to start voice input
3. Speak your question clearly
4. MediMate will respond with voice and text

### Language Selection
1. Use the language dropdown in the header
2. Select your preferred language
3. Both speech recognition and responses will use the selected language

## Technical Details

### Dependencies
- React 18+
- Web Speech API (for voice features)
- Web Audio API (for ambient sounds)
- Axios (for API calls)

### API Integration
- Connects to backend at `http://localhost:8001/chat`
- Sends message and language parameters
- Handles error responses gracefully

### Browser Support
- Chrome/Edge: Full voice support
- Firefox: Limited voice support
- Safari: Basic voice support
- Mobile: Text chat only

## File Structure
```
ChatPage.js          # Main component
chat.css            # Styling
ChatPage.test.js    # Unit tests
ChatPage.README.md  # This documentation
```

## Configuration

### Voice Settings
- Rate: 0.85 (speech speed)
- Pitch: 1.1 (voice pitch)
- Volume: 0.9 (speech volume)

### Supported Languages
All major languages with medical terminology support for Hindi.

## Troubleshooting

### Voice Not Working
1. Check browser permissions for microphone
2. Ensure HTTPS connection (required for speech API)
3. Try refreshing the page

### API Errors
1. Verify backend is running on port 8001
2. Check network connectivity
3. Review browser console for detailed errors

## Development

### Running Tests
```bash
npm test ChatPage.test.js
```

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Future Enhancements
- Video consultation integration
- Medical image analysis
- Prescription management
- Appointment scheduling
- Health record integration
