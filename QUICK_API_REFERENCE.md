# Quick API Reference Card (One-Page Cheat Sheet)

## Field Name Mappings

| What Server Returns | What Hook Returns | What Screen Uses |
|---------------------|-------------------|------------------|
| coach.interactionId | _id | setCurrentInteractionId(_id) |
| coach.question | userQuestion | messages.text (user bubble) |
| coach.response | coachResponse | messages.text (coach bubble) |
| coach.respondedAt | createdAt | messages.timestamp |
| coach.simplificationLevel | simplificationLevel | Display complexity level |
| N/A | - | Extract from response.coach |

## Enum Values

**Context Type** (for coach):
```javascript
'recording'   // ✓ Use this for transcript-based questions
'note'        // ✓ Use for note-based questions
'book'        // ✓ Use for book reference questions
'general'     // ✓ Use for general questions
```

NOT: 'transcript', 'lecture', 'chapter' ❌

## API Endpoints at a Glance

| Operation | Method | URL | Hook |
|-----------|--------|-----|------|
| Ask coach | POST | /api/coach/agentic/ask | askCoach() |
| Follow-up | POST | /api/coach/agentic/{id}/followup | askCoachFollowup() |
| History | GET | /api/coach/agentic/history | getCoachHistory() |
| Create transcript | POST | /api/lectures/transcript | createTranscript() |
| Summarize | POST | /api/lectures/transcript/{id}/summary | generateSummary() |

## askCoach() Usage

```javascript
// Call the hook
const response = await askCoach(
  "What is the main concept?",  // question
  3,                             // simplificationLevel (1-5)
  "recording",                   // context (NOT contextType!)
  transcriptId                   // contextId
);

// Response structure (after normalization)
{
  _id: "...",                    // Store for follow-ups
  userQuestion: "What is the main concept?",
  coachResponse: "The main concept is...",  // Display this
  simplificationLevel: 3,
  createdAt: "2024-01-09T10:30:00Z"
}

// Use it
setMessages(prev => [...prev, {
  id: response._id,
  type: 'coach',
  text: response.coachResponse,  // ← This field
  timestamp: response.createdAt
}]);

setCurrentInteractionId(response._id);  // For next follow-up
```

## askCoachFollowup() Usage

```javascript
// Must have interaction ID from previous response
const response = await askCoachFollowup(
  currentInteractionId,          // From previous response._id
  "Can you explain simpler?"
);

// Response has same structure as askCoach()
// BUT includes parentInteractionId (don't use, just for reference)

// Store the NEW interaction ID for next follow-up
setCurrentInteractionId(response._id);
```

## getCoachHistory() Usage

```javascript
const history = await getCoachHistory();

// Returns array of interactions
history.forEach(interaction => {
  // Each interaction has:
  // - _id
  // - userQuestion
  // - coachResponse
  // - simplificationLevel
  // - createdAt
  
  // Add to messages in pairs (user then coach)
});
```

## generateSummary() Usage

```javascript
const summaryText = await generateSummary(
  transcriptId,
  'quick'  // or 'detailed' or 'simplified'
);

// Returns string directly (not nested)
// Display it immediately
setDisplayedSummary(summaryText);
```

## createTranscript() Usage

```javascript
const response = await createTranscript(
  transcriptText,
  '10',        // standard
  'Chapter 2', // chapter
  'Algebra',   // topic
  'Math',      // subject
  'Math Lecture 1'  // sessionName
);

// Extract transcriptId from nested location
const transcriptId = response.transcript?.transcriptId;

// Use for all subsequent operations
navigation.navigate('TranscriptViewer', { transcriptId });
```

## Console Log Patterns

**In any hook, you should see**:
```
// When making API call
Asking coach: What is the main concept?

// When response comes back
Coach RAW response received: { success: true, coach: { ... } }

// After normalization
Coach NORMALIZED response being returned: { _id: "...", coachResponse: "...", ... }
```

**In any screen, you should see**:
```
// What screen receives from hook
Coach response object: { _id: "...", coachResponse: "...", ... }
```

If you don't see this pattern, debugging info is missing.

## Validation Checklist

Before showing data in UI:

```javascript
// Coach response validation
if (!response) {
  throw new Error("No response from server");
}

if (!response._id) {
  throw new Error("Missing interaction ID");
}

if (!response.coachResponse) {
  throw new Error("Missing coach response text");
}

// Only then display
setMessages(prev => [...prev, {
  id: response._id,
  type: 'coach',
  text: response.coachResponse,
  timestamp: response.createdAt
}]);
```

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "context" not found | Use `context:` not `contextType:` |
| "invalid enum value" | Use 'recording' not 'transcript' |
| validation failed | Check response has `_id` and `coachResponse` |
| follow-up fails | Verify `currentInteractionId` is set from previous message |
| history empty | Ensure userId is set in auth |
| response undefined | Add logging to see RAW response from server |

## Data Flow Shorthand

```
User sends message
  ↓
Hook calls API: POST /api/coach/agentic/ask
  ↓
Server returns: { success: true, coach: { ... } }
  ↓
Hook normalizes: { _id, userQuestion, coachResponse, ... }
  ↓
Screen receives normalized object
  ↓
Screen validates: response && response.coachResponse && response._id
  ↓
Screen extracts: text = response.coachResponse
  ↓
Screen displays in message bubble
  ↓
Screen stores: setCurrentInteractionId(response._id)
```

## For Follow-ups

```
User sends follow-up
  ↓
currentInteractionId exists (stored from first message)
  ↓
Hook calls API: POST /api/coach/agentic/{currentInteractionId}/followup
  ↓
Server returns: { success: true, coach: { ... } }
  ↓
Hook normalizes same way as first message
  ↓
Screen receives and validates
  ↓
Screen updates currentInteractionId to response._id (for next follow-up)
  ↓
Messages display in order (maintains conversation thread)
```

## Testing Each Endpoint

```javascript
// Test askCoach
✓ Hook logs show RAW response with coach object
✓ Hook logs show NORMALIZED response with coachResponse
✓ Screen receives object with _id, coachResponse fields
✓ Message displays in UI
✓ currentInteractionId set

// Test askCoachFollowup
✓ currentInteractionId passed to hook
✓ Hook calls correct endpoint with ID in URL
✓ Response has parentInteractionId
✓ Screen receives normalized response
✓ currentInteractionId updated to new ID

// Test getCoachHistory
✓ Returns array of interactions
✓ Each interaction has userQuestion and coachResponse
✓ Messages reconstructed from array
✓ Chat displays previous conversation

// Test createTranscript
✓ Returns response.transcript.transcriptId
✓ transcriptId passed to next screen
✓ No "undefined" in navigation params

// Test generateSummary
✓ Returns string of summary content
✓ Displays in UI without errors
✓ No nesting (direct string return)
```

## Debug Command: View Raw Response

Add this to see exact server response:

```javascript
// In any hook
const response = await makeServerRequest(...);
console.log("FULL RESPONSE:", JSON.stringify(response, null, 2));
// Copy the output and paste into JSON viewer
```

Then compare to API_RESPONSE_SCHEMAS.md to see if structure matches.

## In Case of Emergency

1. **Look in API_RESPONSE_SCHEMAS.md** for endpoint structure
2. **Check console logs** for RAW → NORMALIZED pattern
3. **Read API_CODE_FLOW_DIAGRAMS.md** to see data transformation
4. **Follow API_INTEGRATION_TEST_PLAN.md** to validate manually
5. **Ask**: Does the raw server response match what's in the docs?

---

**Version**: 1.0  
**Last Updated**: January 9, 2024  
**Related Docs**: API_RESPONSE_SCHEMAS.md, API_INTEGRATION_TEST_PLAN.md, API_CODE_FLOW_DIAGRAMS.md

