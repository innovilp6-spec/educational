# API Response Schemas - Complete Reference

This document provides the exact response structure for all backend API endpoints used in the frontend.

---

## 1. Lecture/Transcript APIs

### 1.1 POST `/api/lectures/transcribe-audio`
**Purpose**: Transcribe audio chunks during recording  
**Frontend Hook**: `transcribeAudioChunk()`

**Response**:
```javascript
{
  success: true,
  message: 'Audio transcribed',
  transcription: {
    text: 'string',        // Transcribed text
    confidence: number,    // Optional: confidence score
    duration: number,      // Optional: duration in seconds
  }
}
```

**Hook Handling**: Returns `response.transcription.text` directly

---

### 1.2 POST `/api/lectures/transcript`
**Purpose**: Create and save final transcript with metadata  
**Frontend Hook**: `createTranscript()`  
**Parameters**: transcriptText, standard, chapter, topic, subject, sessionName

**Response**:
```javascript
{
  success: true,
  message: 'Transcript created and saved',
  transcript: {
    transcriptId: 'MongoDB ObjectId',  // THE ID TO EXTRACT
    sessionName: 'string',
    standard: 'string',
    chapter: 'string',
    topic: 'string',
    subject: 'string',
    rawLength: number,
    processedLength: number,
    createdAt: 'ISO datetime'
  }
}
```

**Hook Handling**: Extract `response.transcript.transcriptId`  
**Screen Handling (NameSessionScreen)**:
```javascript
const transcriptId = response.transcript?.transcriptId;
// Then pass to TranscriptViewerScreen
```

---

### 1.3 POST `/api/lectures/transcript/:transcriptId/summary`
**Purpose**: Generate summary for transcript  
**Frontend Hook**: `generateSummary(transcriptId, summaryType)`  
**Parameters**: summaryType ('quick' | 'detailed' | 'simplified')

**Response**:
```javascript
{
  success: true,
  message: 'quick summary generated and stored',
  summary: {
    transcriptId: 'MongoDB ObjectId',
    type: 'quick',                    // or 'detailed', 'simplified'
    content: 'string',                // THE TEXT TO DISPLAY
    createdAt: 'ISO datetime'
  }
}
```

**Hook Handling**: Extract `response.summary.content`  
**Screen Handling (TranscriptViewerScreen)**:
```javascript
const summaryContent = response.summary?.content;
// Display in UI
```

---

### 1.4 GET `/api/lectures/transcript/:transcriptId/summaries`
**Purpose**: Get all summaries for a transcript  
**Frontend Hook**: `getSummaries(transcriptId)`

**Response**:
```javascript
{
  success: true,
  transcriptId: 'MongoDB ObjectId',
  summaries: [
    {
      type: 'quick',
      content: 'string',
      createdAt: 'ISO datetime'
    },
    // ... more summaries
  ],
  count: number
}
```

---

## 2. Coach APIs (Agentic)

### 2.1 POST `/api/coach/agentic/ask`
**Purpose**: Ask coach a new question  
**Frontend Hook**: `askCoach(question, simplificationLevel, context, contextId)`

**Request Body**:
```javascript
{
  question: 'string',
  simplificationLevel: 1-5,
  context: 'recording' | 'note' | 'book' | 'general',  // NOT 'transcript' or 'lecture'
  contextId: 'MongoDB ObjectId' | null
}
```

**Response**:
```javascript
{
  success: true,
  message: 'Coach response generated',
  coach: {
    question: 'string',                    // Echo of user question
    response: 'string',                    // THE COACH ANSWER TEXT
    simplificationLevel: 1-5,
    processingTimeMs: number,
    respondedAt: 'ISO datetime',
    interactionId: 'MongoDB ObjectId',     // The ID to use for follow-ups
    contextType: 'general'                 // (may be included)
  }
}
```

**Hook Normalization** (useTranscriptAPI.js):
```javascript
return {
  _id: response.coach.interactionId,     // For tracking
  userQuestion: response.coach.question,  // What user asked
  coachResponse: response.coach.response, // What coach said (DISPLAY THIS)
  simplificationLevel: response.coach.simplificationLevel,
  createdAt: response.coach.respondedAt
};
```

**Screen Validation** (AgenticCoachScreen.jsx):
```javascript
if (response && response.coachResponse && response._id) {
  setMessages(prev => [...prev, {
    id: response._id,
    type: 'coach',
    text: response.coachResponse,  // The text to display
    timestamp: response.createdAt
  }]);
  setCurrentInteractionId(response._id);  // Save for follow-ups
}
```

---

### 2.2 POST `/api/coach/agentic/:interactionId/followup`
**Purpose**: Ask follow-up question in same conversation  
**Frontend Hook**: `askCoachFollowup(interactionId, followupQuestion)`

**Request Body**:
```javascript
{
  followupQuestion: 'string'
}
```

**Response**:
```javascript
{
  success: true,
  message: 'Follow-up response generated',
  coach: {
    question: 'string',                       // Echo of follow-up question
    response: 'string',                       // THE COACH ANSWER TEXT
    simplificationLevel: 1-5,
    processingTimeMs: number,
    respondedAt: 'ISO datetime',
    interactionId: 'MongoDB ObjectId',        // NEW interaction ID
    parentInteractionId: 'MongoDB ObjectId'   // Link to parent conversation
  }
}
```

**Hook Normalization** (useTranscriptAPI.js):
Same as `askCoach()` - returns normalized object with coachResponse

**Flow**:
1. User sends first question → `askCoach()` → Get `_id` (interaction ID)
2. Store `_id` in `currentInteractionId`
3. User sends follow-up → `askCoachFollowup(currentInteractionId, question)`
4. Get new `_id` from response
5. Update `currentInteractionId` for next follow-up

---

### 2.3 GET `/api/coach/agentic/history`
**Purpose**: Get all coach interactions for current user  
**Frontend Hook**: `getCoachHistory()`

**Response**:
```javascript
{
  success: true,
  count: number,
  interactions: [
    {
      _id: 'MongoDB ObjectId',
      userQuestion: 'string',
      coachResponse: 'string',              // Coach's answer
      context: 'recording' | 'note' | 'book' | 'general',
      contextId: 'MongoDB ObjectId' | null,
      simplificationLevel: 1-5,
      createdAt: 'ISO datetime',
      processingTime: number                 // milliseconds
    },
    // ... more interactions
  ]
}
```

**Screen Usage** (AgenticCoachScreen.jsx):
```javascript
const history = await getCoachHistory();
// Loop through interactions and add to messages
history.forEach(interaction => {
  // Add user question
  setMessages(prev => [...prev, {
    id: `${interaction._id}-user`,
    type: 'user',
    text: interaction.userQuestion,
    timestamp: interaction.createdAt
  }]);
  
  // Add coach response
  setMessages(prev => [...prev, {
    id: `${interaction._id}-coach`,
    type: 'coach',
    text: interaction.coachResponse,  // Display this
    timestamp: interaction.createdAt
  }]);
});
```

---

## 3. Notes APIs

### 3.1 POST `/api/notes`
**Purpose**: Create a new note  
**Parameters**: title, content, tags[], notebookId

**Response Structure** (to be documented)
```javascript
{
  success: true,
  message: 'Note created',
  note: {
    _id: 'MongoDB ObjectId',
    title: 'string',
    content: 'string',
    tags: ['string'],
    notebookId: 'MongoDB ObjectId',
    createdAt: 'ISO datetime'
  }
}
```

---

## 4. Data Type Reference

### Valid Enums

**Context Type** (for coach):
- `'recording'` ✓ (when context is from transcript)
- `'note'` ✓ (when context is from note)
- `'book'` ✓ (when context is from book)
- `'general'` ✓ (when no specific context)
- `'lecture'` ✗ (INVALID - use 'recording')
- `'transcript'` ✗ (INVALID - use 'recording')

**Summary Type** (for summaries):
- `'quick'` ✓
- `'detailed'` ✓
- `'simplified'` ✓

**Simplification Level** (for coach):
- `1` through `5` (1 = most simplified, 5 = most complex)

---

## 5. Common Patterns

### Pattern 1: Nested Response Object
Some responses nest the actual data under a property:
```javascript
// Response structure
{
  success: true,
  message: 'Description',
  <key>: {                    // <-- Nested under property
    actualData: 'here'
  }
}

// Hook extracts: response.<key>
```

Examples:
- `response.transcript.transcriptId` from createTranscript
- `response.summary.content` from generateSummary
- `response.coach.<field>` from askCoach

### Pattern 2: Normalized Hook Returns
Hooks should transform nested responses into consistent objects:

```javascript
const response = await makeServerRequest(...);

// Server returns nested structure
console.log('Raw response:', response.coach);
// → { question, response, interactionId, ... }

// Hook normalizes it
const normalized = {
  _id: response.coach.interactionId,           // Map to _id
  userQuestion: response.coach.question,       // Rename question
  coachResponse: response.coach.response,      // Rename response
  simplificationLevel: response.coach.simplificationLevel,
  createdAt: response.coach.respondedAt       // Rename timestamp
};

// Screen receives consistent object
return normalized;
```

### Pattern 3: Array Responses
For history/list endpoints, response may contain array:
```javascript
{
  success: true,
  interactions: [],  // or summaries, or notes
  count: number
}

// Hook extracts and returns: response.interactions
```

---

## 6. Validation Checklist

When integrating a new API endpoint:

- [ ] Read backend controller to get exact response structure
- [ ] Check if response is nested under a property (e.g., `response.coach`)
- [ ] Determine what data needs to be extracted
- [ ] Write hook to normalize if needed
- [ ] Add console.log statements to debug
- [ ] In screen component, validate expected fields exist
- [ ] Test with actual API call from emulator/device
- [ ] Check network tab in DevTools to see actual response
- [ ] Add error handling for missing or malformed data

---

## 7. Testing Steps for Each Endpoint

### Test transcribeAudioChunk:
1. Record audio in LectureCaptureScreen
2. Check console: Should log transcribed text
3. Should update transcript state in real-time

### Test createTranscript:
1. Complete lecture and hit "Save & Continue"
2. Check console: Should log `response.transcript.transcriptId`
3. Should navigate to TranscriptViewerScreen with ID
4. TranscriptViewerScreen should render properly

### Test generateSummary:
1. In TranscriptViewerScreen, tap "Quick Summary"
2. Check console: Should log `response.summary.content`
3. Summary text should display in UI

### Test askCoach:
1. In AgenticCoachScreen, send first message
2. Check console: 
   - Should log "Coach RAW response"
   - Should log "Coach NORMALIZED response" with object
3. Message should appear in chat
4. `currentInteractionId` should be set

### Test askCoachFollowup:
1. Send follow-up message
2. Check console:
   - Should log "Asking coach follow-up"
   - Should log "Coach follow-up RAW server response"
3. Follow-up message and coach response should appear in chat

### Test getCoachHistory:
1. Close and reopen AgenticCoachScreen
2. Check console: Should log loaded interactions
3. Previous messages should appear in chat on load

---

## 8. Known Issues & Workarounds

### Issue: Response.coach not found
**Cause**: API call failed or response structure changed  
**Debug**: Add console.log before checking response.coach  
**Workaround**: Add fallback to handle empty response

### Issue: contextType 'transcript' rejected
**Cause**: Backend enum expects 'recording'  
**Fix**: Always use `context: 'recording'` when transcriptId is contextId

### Issue: Summary returns empty content
**Cause**: Summary not yet generated or processing failed  
**Debug**: Check if endpoint is /api/lectures/transcript/{id}/summary (POST not GET)

### Issue: Coach history empty on load
**Cause**: /api/coach/agentic/history endpoint not returning user's interactions  
**Debug**: Check userId is set in auth middleware

---

## Summary Table

| Endpoint | Method | Hook | Returns | Key Data |
|----------|--------|------|---------|----------|
| /lectures/transcribe-audio | POST | transcribeAudioChunk | response.transcription.text | string |
| /lectures/transcript | POST | createTranscript | response.transcript.transcriptId | ObjectId |
| /lectures/transcript/{id}/summary | POST | generateSummary | response.summary.content | string |
| /lectures/transcript/{id}/summaries | GET | getSummaries | response.summaries | array |
| /coach/agentic/ask | POST | askCoach | response.coach.{...} | normalized object |
| /coach/agentic/{id}/followup | POST | askCoachFollowup | response.coach.{...} | normalized object |
| /coach/agentic/history | GET | getCoachHistory | response.interactions | array |

