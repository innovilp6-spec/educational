# Voice Modality - Complete Screen Implementation Plan

## 📋 Screen-by-Screen Voice Integration

### ✅ COMPLETED: AgenticCoachScreen
- **Type:** Voice Commands + STT Input
- **Voice Features:**
  - Mic button for voice input
  - Commands: next, previous, submit, repeat, hint, read, goHome, goBack
  - Transcript display bubble
  - Error feedback
- **Status:** COMPLETE

---

### 📝 TO IMPLEMENT

#### 1. **AgenticNotesScreen**
- **Type:** Voice Input + Commands
- **What:** Note-taking screen
- **Hooks:** useSimpleSTT + useVoiceModality
- **Features:**
  - Mic button for note content input
  - Commands: save, new, clear
  - Voice-to-text in note field
- **Priority:** HIGH

#### 2. **NotesScreen**
- **Type:** Voice Input + Commands  
- **What:** Notes management/creation screen
- **Hooks:** useSimpleSTT + useVoiceModality
- **Features:**
  - Mic button for title, content inputs
  - Commands: save, cancel, clear
  - Voice fill for form fields
- **Priority:** HIGH

#### 3. **TranscriptScreen**
- **Type:** Voice Navigation
- **What:** View lecture transcript with pagination
- **Hooks:** useVoiceModality
- **Features:**
  - Commands: next page, previous page, search
  - Voice navigation
- **Priority:** MEDIUM

#### 4. **TranscriptViewerScreen**
- **Type:** Voice Navigation
- **What:** Display full transcript
- **Hooks:** useVoiceModality
- **Features:**
  - Commands: next, previous, bookmark, search
- **Priority:** MEDIUM

#### 5. **LectureCaptureScreen**
- **Type:** Voice Commands
- **What:** Record lecture
- **Hooks:** useVoiceModality
- **Features:**
  - Commands: start record, stop record, pause, resume
  - Status feedback
- **Priority:** MEDIUM

#### 6. **RecordingsListScreen**
- **Type:** Voice Navigation + Selection
- **What:** List of recorded lectures
- **Hooks:** useVoiceModality
- **Features:**
  - Commands: next, previous, play, delete
  - Voice selection support
- **Priority:** LOW

#### 7. **SugamyaLibraryScreen**
- **Type:** Voice Navigation + Search
- **What:** Library/book selection
- **Hooks:** useVoiceModality
- **Features:**
  - Commands: next, previous, search, select
  - Voice book selection
- **Priority:** LOW

#### 8. **NameSessionScreen**
- **Type:** Voice Input
- **What:** Name a recording session
- **Hooks:** useSimpleSTT
- **Features:**
  - Mic button for name input
  - Voice-to-text for session naming
- **Priority:** MEDIUM

#### 9. **LoginScreen & RegisterScreen**
- **Status:** SKIP (Auth screens typically don't use voice)

#### 10. **TranscribingScreen**
- **Status:** SKIP (Progress screen)

#### 11. **ErrorScreen**
- **Status:** SKIP (Error display only)

---

## 🎯 Implementation Strategy

### Phase 1: High Priority (Voice Input)
1. AgenticNotesScreen
2. NotesScreen

### Phase 2: Medium Priority (Navigation)
3. TranscriptScreen
4. TranscriptViewerScreen
5. LectureCaptureScreen
6. NameSessionScreen

### Phase 3: Low Priority (Enhancement)
7. RecordingsListScreen
8. SugamyaLibraryScreen

---

## 📝 Code Templates

### Pattern 1: Voice Input Only (useSimpleSTT)
```javascript
import useSimpleSTT from '../hooks/useSimpleSTT';

export default function Screen() {
  const [inputText, setInputText] = useState('');
  
  const stt = useSimpleSTT({
    onTranscript: (transcript) => setInputText(transcript),
    autoSubmitOnSilence: false,
  });

  return (
    <>
      <TextInput 
        value={inputText}
        onChangeText={setInputText}
      />
      
      <TouchableOpacity onPress={() => {
        stt.isListening ? stt.stopListening() : stt.startListening();
      }}>
        <Text>{stt.isListening ? '🔴' : '🎤'}</Text>
      </TouchableOpacity>

      {stt.transcript && !stt.error && (
        <View style={styles.transcriptBubble}>
          <Text>Heard: {stt.transcript}</Text>
        </View>
      )}

      {stt.error && (
        <View style={styles.errorBubble}>
          <Text>{stt.error}</Text>
        </View>
      )}
    </>
  );
}
```

### Pattern 2: Voice Commands (useVoiceModality)
```javascript
import useVoiceModality from '../hooks/useVoiceModality';

export default function Screen({ navigation }) {
  const commandHandlers = {
    nextPage: async ({ parsed }) => {
      // Your action here
      voice.speakMessage('Moving to next page');
    },
    previousPage: async ({ parsed }) => {
      // Your action here
      voice.speakMessage('Going back');
    },
  };

  const voice = useVoiceModality('ScreenName', commandHandlers, {
    enableAutoTTS: true,
  });

  return (
    <>
      <TouchableOpacity onPress={() => {
        voice.isListening ? voice.stopListening() : voice.startListening();
      }}>
        <Text>{voice.isListening ? '🔴' : '🎤'}</Text>
      </TouchableOpacity>

      {voice.currentTranscript && !voice.error && (
        <View style={styles.transcriptBubble}>
          <Text>Heard: {voice.currentTranscript}</Text>
        </View>
      )}

      {voice.error && (
        <View style={styles.errorBubble}>
          <Text>{voice.error}</Text>
          <TouchableOpacity onPress={voice.clearError}>
            <Text>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
```

---

## ✨ Next Steps

1. Start with AgenticNotesScreen (HIGH priority, pattern available)
2. Follow NotesScreen (HIGH priority)
3. Implement TranscriptScreen, TranscriptViewerScreen (MEDIUM priority)
4. Add to remaining screens (LOW priority)
5. Test on physical Android device with Google Play Services

---

## 📊 Tracking

- [ ] AgenticCoachScreen - DONE ✅
- [ ] AgenticNotesScreen
- [ ] NotesScreen
- [ ] TranscriptScreen
- [ ] TranscriptViewerScreen
- [ ] LectureCaptureScreen
- [ ] RecordingsListScreen
- [ ] SugamyaLibraryScreen
- [ ] NameSessionScreen
