# Frontend Integration Guide - Agentic Coach System

## Overview
This document describes the React Native frontend integration with the backend agentic coach system, including lecture capture workflow, transcript management, and conversational coaching interface.

## Architecture

### Frontend Stack
- **Framework**: React Native with React Navigation v5
- **API Layer**: Custom hooks (`useTranscriptAPI`)
- **Storage**: RNFS for file system operations
- **UI Components**: Native React Native components + custom PrimaryButton

### Backend Integration Points
- **Server Base URL**: `http://192.168.1.100:5000` (configure in `useTranscriptAPI.js`)
- **Authentication**: Using `x-user-email` header (currently test user: `testuser@example.com`)

---

## Lecture Capture Workflow

### Step 1: Audio Recording (LectureCaptureScreen.jsx)
**Purpose**: Record lecture audio in 5-second chunks

**Current Implementation**:
```jsx
// Records audio continuously, chunking every 5 seconds
// Calls transcribeAudioChunk() for each chunk (currently dummy)
// Accumulates masterTranscript
// Navigates to TranscribingScreen with masterTranscript
```

**Flow**:
1. User presses "Start Recording"
2. Audio recorded in 5-second intervals
3. Each chunk passed to `transcribeAudioChunk()` (Server integration point)
4. Transcriptions accumulated in `masterTranscript`
5. User presses "Stop" → Navigate to TranscribingScreen

**Needs Adjustment**:
- [ ] Implement actual audio file upload to server in `transcribeAudioChunk()`
- [ ] Current implementation returns placeholder - needs to POST audio chunks to server

---

### Step 2: Transcript Processing (TranscribingScreen.jsx)
**Purpose**: Process master transcript before naming

**Current Implementation**:
```jsx
// Calls processTranscript() on master transcript
// Currently just returns the transcript as-is
// Navigates to NameSessionScreen
```

**Flow**:
1. Receives `masterTranscript` from LectureCaptureScreen
2. Processes transcript (currently no-op)
3. Navigates to NameSessionScreen with processed transcript

**Note**: Processing logic can stay on backend or be removed from frontend

---

### Step 3: Session Naming (NameSessionScreen.jsx)
**Purpose**: User enters a friendly name for the lecture session

**Current Implementation**: ✅ Functional
```jsx
// User enters session name
// Navigates to TranscriptViewerScreen
```

---

### Step 4: Transcript Viewing & Summary (TranscriptViewerScreen.jsx)
**Purpose**: Display transcript, generate summaries, launch coach session

**Updated Implementation**:
```jsx
// Displays full transcript with tab-based view
// "Transcript" tab → Raw transcript text
// "Quick Summary" tab → Server-generated quick summary
// "Detailed Summary" tab → Server-generated detailed summary
// "Study with Coach" button → Navigate to AgenticCoachScreen
```

**Features**:
- ✅ View full transcript
- ✅ Generate summaries via server API
  - `generateSummary(transcriptId, 'quick'|'detailed'|'simplified')`
  - Uses server endpoint: `POST /api/lectures/transcript/{id}/summary`
- ✅ Save summaries to device files
- ✅ Navigate to Coach screen with context

**Parameters Passed to Coach Screen**:
```jsx
{
  transcriptId,      // For context in coach queries
  sessionName,       // Display in coach header
  transcript,        // Full transcript text for context
}
```

---

## Agentic Coach Integration

### Step 5: Coach Screen (AgenticCoachScreen.jsx)
**Purpose**: Conversational interface for studying with AI coach

**New Screen Features**:

#### A. Conversational Message UI
```
[User]        ← User questions appear right-aligned in blue bubbles
[Coach]       ← Coach responses appear left-aligned in white bubbles
[Error]       ← Error messages in red bubbles
```

#### B. Simplification Level Control
- 5-button selector (levels 1-5)
- Default: 3 (medium)
- Affects coach response complexity

#### C. Chat History
- Loads previous conversation history on mount via `getCoachHistory()`
- Displays all previous interactions
- Allows continuing conversation

#### D. Context Awareness
The coach receives context from:
1. **Transcript Context**: Full transcript text passed to first question
2. **Study Context**: Coach service gathers user's study history
3. **Interaction History**: Previous questions/answers in conversation

**API Calls**:

**First Question** (New Conversation):
```javascript
await askCoach(
  question,
  simplificationLevel,  // 1-5
  'transcript',        // contextType
  transcriptId         // contextId
)
```

**Follow-up Questions** (Continuing Conversation):
```javascript
await askCoachFollowup(
  interactionId,       // From previous response
  followupQuestion
)
```

**Load History**:
```javascript
const history = await getCoachHistory();
// Returns: Array of interactions with _id, userQuestion, coachResponse
```

### Message Flow in CoachScreen

1. **Mount**: Load conversation history via `getCoachHistory()`
2. **First Message**: 
   - Call `askCoach()` with `transcriptId` for context
   - Server gathers context via `contextService.getUserStudyContext()`
   - Response includes `interactionId`
3. **Follow-up Messages**:
   - Call `askCoachFollowup(interactionId, question)`
   - Server maintains conversation context
4. **Display**: Add messages to state, auto-scroll to bottom

---

## API Endpoints Used

### Transcription
- **Not Implemented Yet**: Audio file upload to `/api/lectures/transcript`
- **Current**: Dummy implementation returning placeholder text

### Summary Generation
```
POST /api/lectures/transcript/{transcriptId}/summary
Body: { summaryType: 'quick'|'detailed'|'simplified' }
Response: { summary: { content: 'summary text...' } }
```

### Agentic Coach
```
POST /api/coach/agentic/ask
Body: {
  question: string,
  simplificationLevel: 1-5,
  contextType: 'transcript'|'notes',
  contextId: string (transcriptId or notesId)
}
Response: {
  interaction: {
    _id: interactionId,
    userQuestion: string,
    coachResponse: string,
    createdAt: timestamp
  }
}

POST /api/coach/agentic/{interactionId}/followup
Body: { followupQuestion: string }
Response: { interaction: {...} }

GET /api/coach/agentic/history
Response: { interactions: [...] }

DELETE /api/coach/agentic/history
(Clear conversation history)
```

---

## Configuration

### Server Connection
**File**: `src/hooks/useTranscriptAPI.js`
```javascript
const SERVER_BASE_URL = "http://192.168.1.100:5000"; // UPDATE WITH YOUR SERVER IP
const USER_EMAIL = "testuser@example.com";            // UPDATE WITH ACTUAL USER EMAIL
```

**Update Before Testing**:
1. Replace `192.168.1.100` with your actual backend server IP
2. Update `USER_EMAIL` with actual user authentication
3. Consider moving these to environment variables

---

## Current Implementation Status

### ✅ COMPLETED
1. **useTranscriptAPI.js** - Updated to use server endpoints
   - ✅ `askCoach()` - Ask coach with context
   - ✅ `askCoachFollowup()` - Follow-up questions
   - ✅ `getCoachHistory()` - Load conversation history
   - ✅ `generateSummary()` - Server summary API
   - ✅ `createTranscript()` - Create transcript on server
   - ✅ `processTranscript()` - Process transcript (placeholder)

2. **AgenticCoachScreen.jsx** - New conversational coach interface
   - ✅ Message list with user/coach/error bubbles
   - ✅ Auto-scroll to latest message
   - ✅ Simplification level selector (1-5)
   - ✅ Chat history loading on mount
   - ✅ First question with transcript context
   - ✅ Follow-up questions support
   - ✅ Loading states and error handling
   - ✅ Clear conversation button

3. **TranscriptViewerScreen.jsx** - Updated with coach integration
   - ✅ Server API for summary generation
   - ✅ "Study with Coach" button
   - ✅ Pass context to CoachScreen

4. **AppNavigator.js** - Added routes
   - ✅ AgenticCoachScreen imported
   - ✅ Route registered with options

### ⏳ NEEDS IMPLEMENTATION
1. **Audio Chunk Upload** in `transcribeAudioChunk()`
   - Current: Returns placeholder
   - Needed: Actual FormData upload to server
   - Endpoint: `POST /api/lectures/transcript/:id/notes` or new endpoint

2. **User Authentication**
   - Current: Hardcoded test email
   - Needed: Real JWT or session-based auth
   - Header: `x-user-email` (update as needed)

3. **Notes Screen** (Similar to Coach)
   - Not yet created
   - Will use agentic note-taking APIs
   - User said: "will cover once coach is done"

### 🔴 BLOCKING ISSUES
- **Server IP Configuration**: Must update `SERVER_BASE_URL` to actual backend IP
- **User Authentication**: `USER_EMAIL` is hardcoded test value
- **Audio Upload**: `transcribeAudioChunk()` needs real implementation

---

## Testing Checklist

### Before Testing
- [ ] Backend server running on correct IP
- [ ] Update `SERVER_BASE_URL` in `useTranscriptAPI.js`
- [ ] Update `USER_EMAIL` for your test user
- [ ] MongoDB connected and initialized
- [ ] All routes registered on server

### Testing Flow
1. **Lecture Capture**
   - [ ] Open app on Home screen
   - [ ] Navigate to "Lecture Capture"
   - [ ] Record 10-20 seconds of audio
   - [ ] Check: masterTranscript accumulates
   - [ ] Navigate to Transcribing screen

2. **Transcript Viewing**
   - [ ] Enter session name
   - [ ] View full transcript
   - [ ] Generate "Quick Summary" → Check server response
   - [ ] Generate "Detailed Summary" → Check server response
   - [ ] Verify summaries display correctly

3. **Coach Interaction**
   - [ ] Press "Study with Coach"
   - [ ] Verify conversation history loads
   - [ ] Type a question: "What was the main topic?"
   - [ ] Verify coach responds with context
   - [ ] Ask follow-up: "Can you explain further?"
   - [ ] Verify follow-up uses same conversation ID
   - [ ] Adjust simplification level
   - [ ] Ask another new question
   - [ ] Clear conversation → Start fresh

### Debugging
- Check console for API request logs
- Monitor network requests in browser DevTools
- Verify server logs for incoming requests
- Check MongoDB collections for created documents

---

## File Structure
```
src/
├── hooks/
│   └── useTranscriptAPI.js         # API client (UPDATED)
├── screens/
│   ├── LectureCaptureScreen.jsx    # Audio recording
│   ├── TranscribingScreen.jsx      # Processing
│   ├── NameSessionScreen.jsx       # Session naming
│   ├── TranscriptViewerScreen.jsx  # View & summarize (UPDATED)
│   └── AgenticCoachScreen.jsx      # Conversational coach (NEW)
└── navigation/
    └── AppNavigator.js             # Routes (UPDATED)
```

---

## Next Steps

### Immediate (Required for Testing)
1. Update `SERVER_BASE_URL` in `useTranscriptAPI.js`
2. Update `USER_EMAIL` to actual test user
3. Test basic lecture capture flow
4. Test summary generation
5. Test coach conversation

### Short-term (Enhancement)
1. Implement real audio chunk upload in `transcribeAudioChunk()`
2. Set up proper user authentication (JWT)
3. Add error boundaries for better error handling
4. Implement retry logic for API failures
5. Add loading skeletons for better UX

### Medium-term (Additional Features)
1. Create AgenticNotesScreen (similar to CoachScreen)
2. Add offline support with local caching
3. Implement session persistence
4. Add conversation export/sharing
5. Performance optimization for long transcripts

### Long-term (Polish)
1. Add animations for message bubbles
2. Implement text-to-speech for coach responses
3. Add voice input for questions
4. Implement rich formatting for responses
5. Add conversation search/filtering

---

## Known Limitations

1. **Audio Upload**: Currently using placeholder, needs real file upload
2. **Authentication**: Using hardcoded test email, needs real auth
3. **Offline**: No offline support yet
4. **Session Persistence**: Lost on app restart
5. **File Size**: Large transcripts might cause performance issues

---

## Support Notes

- **Context Service**: Backend automatically gathers user study context
- **Simplification Level**: Affects response complexity (1=simple, 5=complex)
- **Conversation History**: Stored on server, loaded on mount
- **Error Handling**: All errors displayed in chat as red bubbles
- **Auto-scroll**: Messages automatically scroll to latest on send

---

**Last Updated**: Today
**Version**: 1.0
**Status**: Ready for Testing
