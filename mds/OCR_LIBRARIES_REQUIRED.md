# OCR Book Reading Feature - Required Libraries

## Overview
This document lists all the libraries required for the OCR book reading feature implementation in educational074 React Native project.

## Currently Installed (in package.json)
- `@react-navigation/native` - Navigation management
- `@react-navigation/native-stack` - Stack navigator
- `react-native-safe-area-context` - Safe area handling
- `react-native-screens` - Native screen optimization
- `react-native-audio-recorder-player` - Audio functionality
- `react-native-fs` - File system access
- `react` & `react-native` - Core framework
- `redux` (if installed) - State management

## REQUIRED - Must Install

### 1. react-native-vision-camera
```bash
npm install react-native-vision-camera react-native-reanimated
npx pod-install  # iOS
```
**Purpose**: Back camera access for capturing book pages
**Used in**: BookCameraScreen.js
**Key APIs**: useCameraDevice('back'), useCameraPermission(), Camera component

### 2. react-native-tts
```bash
npm install react-native-tts
```
**Purpose**: Text-to-speech for reading feedback and announcements
**Used in**: All screens (BookCameraScreen, BookProcessingScreen, BookDetailScreen, CapturedBooksLibraryScreen)
**Key APIs**: Tts.speak(), Tts.stop()

### 3. @react-native-voice/voice
```bash
npm install @react-native-voice/voice
```
**Purpose**: Voice command recognition for hands-free control
**Used in**: BookCameraScreen.js
**Key APIs**: Voice.onSpeechResults(), Voice.onSpeechError(), Voice.start(), Voice.stop()

### 4. react-native-vector-icons
```bash
npm install react-native-vector-icons
npx pod-install  # iOS
```
**Purpose**: Icon support throughout the app (camera, buttons, etc.)
**Used in**: All four OCR screens
**Font**: FontAwesome icons

### 5. axios
```bash
npm install axios
```
**Purpose**: HTTP client for API calls to backend
**Used in**: BookProcessingScreen.js, BookDetailScreen.js, CapturedBooksLibraryScreen.js
**Endpoints**:
- POST `/api/books/captured/scan` - Process images with Azure Vision
- GET `/api/books/captured` - Get user's books
- GET `/api/books/captured/:bookId` - Get specific book
- PUT `/api/books/captured/:bookId/progress` - Update reading progress
- DELETE `/api/books/captured/:bookId` - Delete book

### 6. react-redux
```bash
npm install react-redux redux
```
**Purpose**: State management for auth token and utility settings
**Used in**: All screens
**State Paths**:
- `state.auth.token` - JWT token for API requests
- `state.utilities.voiceCommands` - Toggle for voice commands

## Installation Summary

```bash
# Install all at once
npm install react-native-vision-camera react-native-reanimated react-native-tts @react-native-voice/voice react-native-vector-icons axios react-redux redux

# Then run pod install for iOS
npx pod-install
```

## Backend Requirements (Already Implemented)

The backend (educational_server) has already implemented:
- MongoDB capturedBooks schema with 3D text array
- Azure Vision API v3.2 integration
- All required endpoints for OCR processing
- JWT authentication

**No backend changes needed - only frontend libraries required.**

## Library Summary Table

| Library | Version | Purpose | Type |
|---------|---------|---------|------|
| react-native-vision-camera | latest | Camera access | Native |
| react-native-reanimated | latest | Animation (req by vision-camera) | Native |
| react-native-tts | latest | Text-to-speech | Native |
| @react-native-voice/voice | latest | Voice recognition | Native |
| react-native-vector-icons | latest | Icons | Native |
| axios | latest | HTTP requests | JS |
| react-redux | latest | State management | JS |
| redux | latest | State management | JS |

## Screen-to-Library Mapping

### BookCameraScreen.js
- react-native-vision-camera (Camera, useCameraDevice, useCameraPermission)
- react-native-tts (Tts.speak)
- @react-native-voice/voice (Voice.onSpeechResults, Voice.start)
- react-native-vector-icons (Icon component)
- axios (processImagesForBook utility uses RNFS)

### BookProcessingScreen.js
- axios (API call to `/api/books/captured/scan`)
- react-redux (token, voiceCommands)
- react-native-tts (Tts.speak)
- react-native-vector-icons (Icon component)

### BookDetailScreen.js
- axios (fetch book data)
- react-redux (token, voiceCommands)
- react-native-tts (Tts.speak)
- react-native-vector-icons (Icon component)

### CapturedBooksLibraryScreen.js
- axios (fetch books list, delete book)
- react-redux (token, voiceCommands)
- react-native-tts (Tts.speak)
- react-native-vector-icons (Icon component)

## Notes

1. **LinearGradient has been removed** - All screens now use simple black/white theme with View backgrounds
2. **RNFS** - Already in package.json, used for image file handling in imageProcessing.js
3. **Redux** - Ensure your Redux store has auth and utilities slices configured
4. **Permissions** - iOS and Android require camera & microphone permissions in manifest/plist files
5. **API Base URL** - Update `API_BASE` in screen components (currently set to 'http://your-server:port/api')

## After Installation

1. Run `npx pod-install` for iOS
2. Rebuild app: `npm run ios` or `npm run android`
3. Update API_BASE URL in screens to match your backend
4. Configure Redux store if not already done
5. Add camera/microphone permissions to native configs
