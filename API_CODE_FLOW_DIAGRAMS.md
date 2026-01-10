# Code Flow Diagrams - Data Structure through Complete Request/Response Cycle

## Flow 1: Ask Coach First Question

```
AgenticCoachScreen.jsx
├─ User types: "What is the main concept?"
├─ User taps send button
└─ handleSendMessage() called with userMessage = "What is the main concept?"
   │
   ├─ Add user message to chat immediately
   │  setMessages([..., { type: 'user', text: "What is the main concept?" }])
   │
   ├─ currentInteractionId is null (first message)
   │
   ├─ Call askCoach() from hook:
   │  askCoach(
   │    "What is the main concept?",
   │    simplificationLevel = 3,
   │    contextType = 'recording',    // ← IMPORTANT: From route params
   │    transcriptId                  // ← IMPORTANT: contextId
   │  )
   │
   └─ useTranscriptAPI.js - askCoach()
      │
      ├─ Create request body:
      │  {
      │    question: "What is the main concept?",
      │    simplificationLevel: 3,
      │    context: contextType,           // ← 'recording'
      │    contextId: transcriptId
      │  }
      │
      ├─ Make request: POST /api/coach/agentic/ask
      │
      ├─ Server responds:
      │  {
      │    success: true,
      │    message: "Coach response generated",
      │    coach: {
      │      question: "What is the main concept?",
      │      response: "The main concept is...",
      │      simplificationLevel: 3,
      │      processingTimeMs: 2500,
      │      respondedAt: "2024-01-09T10:30:00Z",
      │      interactionId: "64a3e5f9d8c1b2a3f4e5g6h7"
      │    }
      │  }
      │
      ├─ Hook logs:
      │  console.log("Coach RAW response received:", response)
      │
      ├─ Check if response.coach exists: YES ✓
      │
      ├─ Create normalized response:
      │  {
      │    _id: response.coach.interactionId,              // "64a3e5f9..."
      │    userQuestion: response.coach.question,          // "What is the main concept?"
      │    coachResponse: response.coach.response,         // "The main concept is..."
      │    simplificationLevel: response.coach.simplificationLevel,  // 3
      │    createdAt: response.coach.respondedAt           // "2024-01-09T10:30:00Z"
      │  }
      │
      ├─ Hook logs:
      │  console.log("Coach NORMALIZED response being returned:", normalizedResponse)
      │
      ├─ Return normalized response
      │  return { _id, userQuestion, coachResponse, simplificationLevel, createdAt }
      │
      └─ Return to AgenticCoachScreen

   ├─ In AgenticCoachScreen, receive response from hook:
   │  response = {
   │    _id: "64a3e5f9...",
   │    userQuestion: "What is the main concept?",
   │    coachResponse: "The main concept is...",
   │    simplificationLevel: 3,
   │    createdAt: "2024-01-09T10:30:00Z"
   │  }
   │
   ├─ Log the response:
   │  console.log('Coach response object:', JSON.stringify(response, null, 2))
   │
   ├─ Validation check:
   │  if (response && response.coachResponse && response._id) {
   │    ✓ YES - All fields exist
   │
   ├─ Add coach response to messages:
   │  setMessages(prev => [...prev, {
   │    id: response._id,                    // "64a3e5f9..."
   │    type: 'coach',
   │    text: response.coachResponse,        // "The main concept is..."
   │    timestamp: response.createdAt
   │  }])
   │
   ├─ Update interaction ID for follow-ups:
   │  setCurrentInteractionId(response._id)  // Store for next message
   │
   └─ UI renders:
      [User bubble] "What is the main concept?"
      [Coach bubble] "The main concept is..."
```

---

## Flow 2: Ask Coach Follow-up Question

```
AgenticCoachScreen.jsx
├─ State now has:
│  currentInteractionId = "64a3e5f9..."
│
├─ User types: "Can you explain that simpler?"
├─ User taps send button
└─ handleSendMessage() called
   │
   ├─ Add user message to chat immediately
   │
   ├─ currentInteractionId is NOT null (we have previous conversation)
   │
   ├─ Call askCoachFollowup() from hook:
   │  askCoachFollowup(
   │    "64a3e5f9...",                  // ← interactionId from state
   │    "Can you explain that simpler?"  // ← followupQuestion
   │  )
   │
   └─ useTranscriptAPI.js - askCoachFollowup()
      │
      ├─ Create request body:
      │  {
      │    followupQuestion: "Can you explain that simpler?"
      │  }
      │
      ├─ Make request: POST /api/coach/agentic/64a3e5f9.../followup
      │
      ├─ Server responds:
      │  {
      │    success: true,
      │    message: "Follow-up response generated",
      │    coach: {
      │      question: "Can you explain that simpler?",
      │      response: "Sure, here's a simpler explanation...",
      │      simplificationLevel: 3,
      │      processingTimeMs: 1800,
      │      respondedAt: "2024-01-09T10:35:00Z",
      │      interactionId: "64a3e5f9d8c1b2a3f4e5g6h8",  // ← NEW ID
      │      parentInteractionId: "64a3e5f9d8c1b2a3f4e5g6h7"  // ← Link to parent
      │    }
      │  }
      │
      ├─ Hook logs:
      │  console.log("Coach follow-up RAW server response:", response)
      │
      ├─ Create normalized response (same as askCoach):
      │  {
      │    _id: "64a3e5f9d8c1b2a3f4e5g6h8",
      │    userQuestion: "Can you explain that simpler?",
      │    coachResponse: "Sure, here's a simpler explanation...",
      │    simplificationLevel: 3,
      │    createdAt: "2024-01-09T10:35:00Z"
      │  }
      │
      ├─ Hook logs:
      │  console.log("Coach follow-up NORMALIZED response being returned:", normalizedResponse)
      │
      └─ Return normalized response

   ├─ In AgenticCoachScreen, receive response:
   │  response = {
   │    _id: "64a3e5f9d8c1b2a3f4e5g6h8",
   │    userQuestion: "Can you explain that simpler?",
   │    coachResponse: "Sure, here's a simpler explanation...",
   │    simplificationLevel: 3,
   │    createdAt: "2024-01-09T10:35:00Z"
   │  }
   │
   ├─ Validation check: PASSES ✓
   │
   ├─ Add coach response to messages
   │
   ├─ Update interaction ID for NEXT follow-up:
   │  setCurrentInteractionId(response._id)  // Now "64a3e5f9d8c1b2a3f4e5g6h8"
   │
   └─ UI renders conversation chain:
      [User] "What is the main concept?"
      [Coach] "The main concept is..."
      [User] "Can you explain that simpler?"
      [Coach] "Sure, here's a simpler explanation..."
```

---

## Flow 3: Load Conversation History

```
AgenticCoachScreen.jsx - useEffect on mount
├─ componentDidMount or on initial load
└─ loadCoachHistory() called
   │
   ├─ Call getCoachHistory() from hook:
   │  const history = await getCoachHistory()
   │
   └─ useTranscriptAPI.js - getCoachHistory()
      │
      ├─ Make request: GET /api/coach/agentic/history
      │
      ├─ Server responds:
      │  {
      │    success: true,
      │    count: 2,
      │    interactions: [
      │      {
      │        _id: "64a3e5f9d8c1b2a3f4e5g6h7",
      │        userQuestion: "What is the main concept?",
      │        coachResponse: "The main concept is...",
      │        context: "recording",
      │        contextId: "64a3e5f9...",
      │        simplificationLevel: 3,
      │        createdAt: "2024-01-09T10:30:00Z",
      │        processingTime: 2500
      │      },
      │      {
      │        _id: "64a3e5f9d8c1b2a3f4e5g6h8",
      │        userQuestion: "Can you explain that simpler?",
      │        coachResponse: "Sure, here's a simpler explanation...",
      │        context: "recording",
      │        contextId: "64a3e5f9...",
      │        simplificationLevel: 3,
      │        createdAt: "2024-01-09T10:35:00Z",
      │        processingTime: 1800
      │      }
      │    ]
      │  }
      │
      ├─ Hook logs:
      │  console.log("Coach history retrieved:", response)
      │
      ├─ Extract and return:
      │  return response.interactions || []
      │
      └─ Return to AgenticCoachScreen

   ├─ In AgenticCoachScreen:
   │  const history = [
   │    { _id: "...h7", userQuestion: "What is the main concept?", coachResponse: "The main concept is...", ... },
   │    { _id: "...h8", userQuestion: "Can you explain that simpler?", coachResponse: "Sure, here's a simpler explanation...", ... }
   │  ]
   │
   ├─ Convert history to message format using flatMap:
   │  history.flatMap(interaction => {
   │    const msgs = [];
   │
   │    // Add user message
   │    msgs.push({
   │      id: "64a3e5f9d8c1b2a3f4e5g6h7-user",
   │      type: 'user',
   │      text: interaction.userQuestion,      // "What is the main concept?"
   │      timestamp: interaction.createdAt
   │    });
   │
   │    // Add coach message
   │    msgs.push({
   │      id: "64a3e5f9d8c1b2a3f4e5g6h7-coach",
   │      type: 'coach',
   │      text: interaction.coachResponse,     // "The main concept is..."
   │      timestamp: interaction.createdAt
   │    });
   │
   │    return msgs;
   │  })
   │
   ├─ Result after flatMap:
   │  [
   │    { id: "...h7-user", type: 'user', text: "What is the main concept?", ... },
   │    { id: "...h7-coach", type: 'coach', text: "The main concept is...", ... },
   │    { id: "...h8-user", type: 'user', text: "Can you explain that simpler?", ... },
   │    { id: "...h8-coach", type: 'coach', text: "Sure, here's a simpler explanation...", ... }
   │  ]
   │
   ├─ Set messages:
   │  setMessages(formattedMessages)
   │
   ├─ Update current interaction ID:
   │  setCurrentInteractionId(history[history.length - 1]._id)  // "...h8"
   │
   └─ UI renders:
      [User] "What is the main concept?"
      [Coach] "The main concept is..."
      [User] "Can you explain that simpler?"
      [Coach] "Sure, here's a simpler explanation..."
```

---

## Flow 4: Generate Summary

```
TranscriptViewerScreen.jsx
├─ User taps "Quick Summary" button
└─ handleGenerateSummary("quick") called
   │
   ├─ Call generateSummary() from hook:
   │  const summary = await generateSummary(transcriptId, "quick")
   │
   └─ useTranscriptAPI.js - generateSummary()
      │
      ├─ Create request body:
      │  {
      │    summaryType: "quick"
      │  }
      │
      ├─ Make request: POST /api/lectures/transcript/64a3e5f9.../summary
      │
      ├─ Server responds:
      │  {
      │    success: true,
      │    message: "quick summary generated and stored",
      │    summary: {
      │      transcriptId: "64a3e5f9...",
      │      type: "quick",
      │      content: "This lecture covered the main concept which is...",
      │      createdAt: "2024-01-09T10:40:00Z"
      │    }
      │  }
      │
      ├─ Hook logs:
      │  console.log("Summary generated:", response)
      │
      ├─ Extract and return:
      │  return response.summary?.content || ""
      │
      └─ Returns: "This lecture covered the main concept which is..."

   ├─ In TranscriptViewerScreen:
   │  const summary = "This lecture covered the main concept which is..."
   │
   └─ Display in UI:
      Summary Text:
      "This lecture covered the main concept which is..."
```

---

## Flow 5: Create Transcript

```
NameSessionScreen.jsx
├─ User enters session name: "Math Lecture 1"
├─ User taps "Save & Continue"
└─ handleSave() called
   │
   ├─ Call createTranscript() from hook:
   │  const response = await createTranscript(
   │    transcriptText,  // Concatenated from all chunks
   │    standard,        // "10"
   │    chapter,         // "Chapter 2"
   │    topic,           // "Algebra"
   │    subject,         // "Mathematics"
   │    sessionName      // "Math Lecture 1"
   │  )
   │
   └─ useTranscriptAPI.js - createTranscript()
      │
      ├─ Create request body:
      │  {
      │    transcriptText: "...",
      │    standard: "10",
      │    chapter: "Chapter 2",
      │    topic: "Algebra",
      │    subject: "Mathematics",
      │    sessionName: "Math Lecture 1"
      │  }
      │
      ├─ Make request: POST /api/lectures/transcript
      │
      ├─ Server responds:
      │  {
      │    success: true,
      │    message: "Transcript created and saved",
      │    transcript: {
      │      transcriptId: "64a3e5f9d8c1b2a3f4e5g6h9",  // ← THE ID WE NEED
      │      sessionName: "Math Lecture 1",
      │      standard: "10",
      │      chapter: "Chapter 2",
      │      topic: "Algebra",
      │      subject: "Mathematics",
      │      rawLength: 5432,
      │      processedLength: 4821,
      │      createdAt: "2024-01-09T10:20:00Z"
      │    }
      │  }
      │
      ├─ Hook logs:
      │  console.log("Transcript created:", response)
      │
      ├─ Extract and return:
      │  return response.transcript.transcriptId
      │
      └─ Returns: "64a3e5f9d8c1b2a3f4e5g6h9"

   ├─ In NameSessionScreen:
   │  const transcriptId = response  // "64a3e5f9d8c1b2a3f4e5g6h9"
   │
   ├─ Navigate to TranscriptViewerScreen with params:
   │  navigation.navigate('TranscriptViewer', {
   │    transcriptId: "64a3e5f9d8c1b2a3f4e5g6h9",
   │    sessionName: "Math Lecture 1",
   │    transcript: transcriptText
   │  })
   │
   └─ TranscriptViewerScreen receives params and can use transcriptId
      for summary generation and coach interaction
```

---

## Data Structure Reference

### Coach API Interaction Object

**What server stores** (Coach model in MongoDB):
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  context: 'recording' | 'note' | 'book' | 'general',
  contextId: ObjectId,
  userQuestion: 'string',
  coachResponse: 'string',
  simplificationLevel: 1-5,
  createdAt: Date,
  processingTime: number
}
```

**What server returns for new interaction** (askCoach response):
```javascript
{
  success: true,
  message: 'Coach response generated',
  coach: {
    question: 'string',
    response: 'string',                  // ← becomes coachResponse in hook
    simplificationLevel: 1-5,
    processingTimeMs: number,
    respondedAt: Date,                   // ← becomes createdAt in hook
    interactionId: ObjectId,             // ← becomes _id in hook
    contextType: 'general'
  }
}
```

**What hook returns** (normalized):
```javascript
{
  _id: ObjectId,
  userQuestion: 'string',
  coachResponse: 'string',
  simplificationLevel: 1-5,
  createdAt: Date
}
```

**Key naming mappings**:
| Server | Hook Returns |
|--------|--------------|
| coach.interactionId | _id |
| coach.question | userQuestion |
| coach.response | coachResponse |
| coach.respondedAt | createdAt |
| - | simplificationLevel (passthrough) |

---

## Important Notes

1. **contextType vs context**: Server API uses `context` in request, NOT `contextType`
2. **Nested responses**: Server returns data nested under keys like `coach`, `transcript`, `summary`
3. **Hook normalization**: Hooks transform nested structures into flat objects for easier screen usage
4. **Interaction ID tracking**: Must store the response's `_id` to send follow-ups with correct parent ID
5. **History replay**: getCoachHistory returns array of stored interactions, screens must reconstruct messages from them

