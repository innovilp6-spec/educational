# Voice Modality Implementation Plan

## 📋 Architecture Overview

### Core Modules to Create

```
services/├── voiceService.js          # Core STT/TTS engine├── voiceCommandParser.js    # Intent recognition & command mapping└── voiceConfig.js           # Keywords & configurationshooks/├── useVoiceModality.js      # Main voice hook for screens├── useSimpleSTT.js          # Simple speech-to-text (chat screens)└── useVoiceCommands.js      # Voice commands with actionscontext/└── VoiceContext.js          # Global voice state & permissions
```

---

## 🎯 Module Architecture

### 1. **voiceService.js** (Core Voice `Engine)`

**Responsibility:** Raw STT/TTS operations

```javascript
Features:- Initialize React Native Voice (STT)- Initialize React Native TTS- Start/Stop listening- Speak text with callbacks- Handle permissions- Error handling & cleanup
```

**Key Methods:**

```
- initializeVoice()- startListening()- stopListening()- speak(text, options)- setLanguage(lang)- destroy()
```

---

### 2. **voiceCommandParser.js** (Intent Recognition)

**Responsibility:** Convert voice text → actionable intents

```javascript
Features:- Define screen-specific command maps- Parse spoken text for keywords- Calculate confidence scores- Return intent + parameters- Handle similar commands (fuzzy matching)
```

**Structure:**

```javascript
{  screen: 'AgenticCoach',  intent: 'next_question',  confidence: 0.95,  parameters: {},  matchedCommand: 'next',  rawText: 'go to next question'}
```

**Command Categories:**

```
UNIVERSAL:  - "go home" → navigate('Home')  - "go back" → navigation.goBack()  - "open settings" → navigate('Settings')CONTEXT_SPECIFIC:  Coach Screen:    - "next question" → nextQuestion()    - "repeat question" → repeatQuestion()    - "submit answer" → submitAnswer()    Notes Screen:    - "save note" → saveNote()    - "new note" → createNewNote()    - "clear text" → clearInput()    Chat Screens:    - "send message" → sendMessage()    - "clear" → clearInput()
```

---

### 3. **VoiceContext.js** (Global State)

**Responsibility:** Manage global voice state & permissions

```javascript
Features:- Permission management (iOS/Android)- Global voice state (listening, speaking)- Language preferences- TTS/STT settings- Error state
```

---

### 4. **useVoiceModality.js** (Main Hook)

**Responsibility:** Screen-specific voice integration

```javascript
Usage in screens:const {  isListening,  isSpeaking,  transcript,  startListening,  stopListening,  speak,  handleVoiceCommand} = useVoiceModality({  screenName: 'AgenticCoach',  commands: coachCommandMap,  onCommand: (intent) => handleCommand(intent),  autoSpeak: true  // Auto-explain actions});
```

---

### 5. **useSimpleSTT.js** (Chat Input Hook)

**Responsibility:** Simple speech-to-text for input fields

```javascript
Usage in chat screens:const {   transcript,   isListening,   toggleListening } = useSimpleSTT({  onTranscript: (text) => setInputText(text),  clearOnSubmit: true});// Just use: transcript → input.value
```

---

## ⚠️ Conflict Resolution Strategy

### Problem

Voice commands might conflict across screens:

-   "next" on Coach = next question
-   "next" on Notes = next note
-   "next" on Books = next page

### Solution: Layered Approach

```
LEVEL 1: SCREEN CONTEXT├─ Only match commands for current screen└─ Pass screenName to parserLEVEL 2: KEYWORD PREFIXING (Optional)├─ "coach: next" specifically for Coach├─ "notes: next" specifically for Notes└─ Fallback to unprefixed command if availableLEVEL 3: CONFIDENCE THRESHOLD├─ Only execute if confidence > 0.85├─ Show disambiguation UI if 0.7 < confidence < 0.85└─ Ignore if confidence < 0.7LEVEL 4: USER CONFIRMATION (For Destructive Actions)├─ "Save note" → TTS asks "Confirm save?" → user says "yes"/"no"└─ "Delete" → Always require confirmation
```

### Implementation:

```javascript
// In parserconst parseVoiceCommand = (text, screenName, strictMode = false) => {  // Get commands for this screen only  const screenCommands = commandMap[screenName];    // Extract keywords  const matches = findMatches(text, screenCommands);    // Calculate confidence  const results = matches.map(m => ({    ...m,    confidence: calculateConfidence(m)  }));    // Sort by confidence  results.sort((a, b) => b.confidence - a.confidence);    // Return best match or ask for clarification  if (results[0].confidence > 0.85) {    return results[0];  } else if (results[0].confidence > 0.7) {    return { intent: 'ASK_CLARIFICATION', options: results };  } else {    return { intent: 'NO_MATCH', confidence: 0 };  }};
```

---

## 📱 Screen-by-Screen Implementation Plan

### Priority 1: Simple STT Screens (Easiest)

1.  **ChatScreen / AgenticCoachScreen**
    -   Simple STT input
    -   Mic button in input area
    -   Text appears in input field
    -   User taps send as usual
    -   TTS: "Listening..." + "Message sent"

### Priority 2: Simple Command Screens

2.  **AgenticNotesScreen**
    -   Mic button for input (same as chat)
    -   Additional: "save note" voice command
    -   TTS: "Listening..." + "Note saved"

### Priority 3: Action Screens

3.  **TranscriptScreen / BookDetailScreen**
    -   Floating mic button
    -   Navigation commands ("next", "previous", "home")
    -   TTS: Explain what action occurred

### Priority 4: Complex Screens

4.  **LectureCaptureScreen**
    -   Record lecture (already exists)
    -   Voice commands: pause, resume, stop
    -   TTS: Real-time status updates

### Priority 5: Settings/Navigation

5.  **FloatingSettingsButton & AppNavigator**
    -   Global voice commands
    -   Screen-wide navigation
    -   "Go home", "Open settings", "Go back"

---

## 🔧 Implementation Details

### Step 1: Install Dependencies

```bash
npm install react-native-voice react-native-ttsnpm install @react-native-voice/voice @react-native-tts/tts
```

### Step 2: Permissions (Android/iOS)

-   Android: `RECORD_AUDIO`, `INTERNET`
-   iOS: `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`

### Step 3: Permission Hook

```javascript
// useVoicePermissions.js- Request permissions- Check permissions- Handle denials gracefully
```

### Step 4: Service Initialization

```javascript
// In App.js or AppNavigator<VoiceProvider>  <AppNavigator /></VoiceProvider>
```

---

## 📊 Data Flow Example

### Chat Screen with Voice Input

```
User taps Mic button  ↓startListening() → React Native Voice  ↓User speaks: "How do photosynthesis work?"  ↓onSpeechResult() → transcript = "How do photosynthesis work?"  ↓Display in input field  ↓TTS: "Message recorded. Say send to submit or continue speaking"  ↓User says "send" OR taps send button  ↓stopListening() → Submit message  ↓TTS: "Message sent"
```

### Coach Screen with Voice Command

```
User taps Mic button  ↓startListening() → React Native Voice  ↓User speaks: "Coach, what's the next question?"  ↓onSpeechResult() → parseVoiceCommand(text, 'AgenticCoach')  ↓Returns: { intent: 'nextQuestion', confidence: 0.92 }  ↓Execute nextQuestion() action  ↓TTS: "Moving to next question..."  ↓Display next question
```

---

## ✅ Advantages of This Architecture

1.  **Modularity**: Each service has single responsibility
2.  **Reusability**: Use voiceService in any screen
3.  **Scalability**: Easy to add new commands
4.  **Testing**: Each module can be tested independently
5.  **Conflict Resolution**: Layered approach handles overlapping commands
6.  **Flexibility**: Can mix STT-only and command-based in same screen

---

## ⚠️ Key Considerations

1.  **Battery Usage**: Voice recognition consumes battery
    
    -   Only listen when screen is active
    -   Auto-stop after timeout
    -   User can manually stop
2.  **Microphone Access**: Need graceful fallback
    
    -   Check permissions first
    -   Show permission request if needed
    -   Hide voice UI if permission denied
3.  **TTS Interruption**: Multiple TTS calls can conflict
    
    -   Queue TTS messages
    -   Implement TTS manager
4.  **Noise Handling**: False positives from background noise
    
    -   Confidence threshold filtering
    -   Silence detection
5.  **Language Support**: Voice recognition per language
    
    -   Set language based on user preference
    -   Handle multilingual commands

---

## 📝 Next Steps

1.  Create voiceService.js with STT/TTS basics
2.  Create voiceCommandParser.js with command maps
3.  Create VoiceContext.js for global state
4.  Create useVoiceModality.js hook
5.  Start with Priority 1 screens (ChatScreen/Coach)
6.  Progress through remaining screens
7.  Test conflict resolution with similar commands
8.  Optimize performance and battery usage