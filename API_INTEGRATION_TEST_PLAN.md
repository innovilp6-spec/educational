# Complete API Integration Test Plan

This document provides step-by-step test cases to validate the entire lecture capture → transcript → coach workflow.

## Prerequisites
- Android emulator running with server accessible at `http://10.0.2.2:5000`
- Test user created: `testuser@example.com`
- React Native app bundled and running in emulator
- Console (logcat) visible for debugging

---

## Test Suite 1: Lecture Capture & Transcript Creation

### Test 1.1: Basic Lecture Capture
**Steps**:
1. Launch app → HomeScreen
2. Tap "Capture Lecture"
3. Record 5-10 seconds of audio (can be silent)
4. Tap "Stop Recording"
5. Verify TranscribingScreen shows
6. Wait for transcription to complete

**Expected Output**:
- Transcript text appears
- Network request successful (check console for logs)
- No errors

**Actual Test**: Need to run and verify

---

### Test 1.2: Create Transcript with Session Name
**Steps**:
1. After transcript appears, tap "Continue"
2. NameSessionScreen shows
3. Enter session name: "Math Lecture 1"
4. Tap "Save & Continue"

**Expected Output**:
```
Console logs:
- "Creating transcript with text: [text]"
- "Creating transcript successfully..."
- "Coach response RAW response received:" (from API call)
- "Coach NORMALIZED response being returned:" (should show object with _id, userQuestion, coachResponse, etc.)

TranscriptViewerScreen loads with transcriptId passed in params
```

**Key Validation Points**:
- ✓ `response.transcript.transcriptId` extracted correctly
- ✓ transcriptId passed to TranscriptViewerScreen
- ✓ Screen renders with transcript text visible

**Actual Test**: Need to run and verify

---

### Test 1.3: Verify Transcript in Database
**Steps**:
1. After TranscriptViewerScreen loads, check logs:
   - Look for "Creating transcript successfully..."
   - Note the transcriptId from params

2. In backend, run:
```bash
curl -X GET "http://localhost:5000/api/lectures/transcript/<transcriptId>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Transcript retrieved",
  "transcript": {
    "transcriptId": "...",
    "transcript": "...",
    "standard": "10",
    "sessionName": "Math Lecture 1"
  }
}
```

**Actual Test**: Need to run and verify

---

## Test Suite 2: Summary Generation

### Test 2.1: Generate Quick Summary
**Steps**:
1. In TranscriptViewerScreen, tap "Quick Summary" button
2. Wait for API response

**Expected Output**:
```
Console logs:
- "Generating quick summary from server..."
- "Summary generated:" followed by response object
- Summary text appears in UI

Response structure (in console):
{
  success: true,
  summary: {
    content: "Summary text here...",
    type: "quick",
    createdAt: "..."
  }
}
```

**Key Validation Points**:
- ✓ Hook extracts `response.summary.content`
- ✓ Text displayed in UI
- ✓ No validation errors

**Actual Test**: Need to run and verify

---

### Test 2.2: Generate Detailed Summary
**Steps**:
1. In TranscriptViewerScreen, tap "Detailed Summary" button
2. Wait for API response

**Expected Output**:
- Same as 2.1 but with longer/more detailed text
- Summary type is 'detailed'

**Actual Test**: Need to run and verify

---

## Test Suite 3: Coach Interaction - New Question

### Test 3.1: Ask Coach First Question
**Steps**:
1. In TranscriptViewerScreen, tap "Study with Coach" button
2. AgenticCoachScreen loads
3. Type message: "What is the main concept here?"
4. Tap send button

**Expected Output**:
```
Console logs in sequence:
1. "Asking coach new question with context..."
2. "Coach RAW response received:" followed by:
{
  success: true,
  coach: {
    question: "What is the main concept here?",
    response: "The main concept is...",
    simplificationLevel: 3,
    interactionId: "...",
    respondedAt: "...",
    processingTimeMs: 1234
  }
}

3. "Coach NORMALIZED response being returned:" followed by:
{
  _id: "...",
  userQuestion: "What is the main concept here?",
  coachResponse: "The main concept is...",
  simplificationLevel: 3,
  createdAt: "..."
}

4. "Coach response object:" (from screen) - should be the normalized object above
5. User message appears in chat
6. Coach response appears below it
```

**Key Validation Points**:
- ✓ Raw response from server is properly structured
- ✓ Hook normalizes response correctly
- ✓ Screen receives normalized object
- ✓ `response.coachResponse` contains the text
- ✓ `response._id` is set (for follow-ups)
- ✓ `currentInteractionId` is updated
- ✓ Messages display in chat bubble UI

**Actual Test**: CRITICAL - This is where the bug was occurring

---

### Test 3.2: Verify contextType is Correct
**Steps**:
1. In test 3.1, when coach is being asked, check logs
2. Look for request body being sent

**Expected Output**:
```
Request body should contain:
{
  question: "What is the main concept here?",
  context: "recording",  // ← CORRECT (not "transcript")
  contextId: "<transcriptId>",
  simplificationLevel: 3
}
```

**Key Validation Points**:
- ✓ `context` field used (not `contextType`)
- ✓ Value is `'recording'` (not 'transcript' or 'lecture')

**Actual Test**: Need to run and verify

---

## Test Suite 4: Coach Interaction - Follow-up Questions

### Test 4.1: Ask Follow-up Question
**Steps**:
1. After first coach response received (from Test 3.1)
2. Type message: "Can you explain that simpler?"
3. Tap send button

**Expected Output**:
```
Console logs in sequence:
1. "Asking coach follow-up question..."
2. "Coach follow-up RAW server response:" followed by:
{
  success: true,
  coach: {
    question: "Can you explain that simpler?",
    response: "Sure, simplified version...",
    simplificationLevel: 3,
    interactionId: "<NEW_ID>",
    parentInteractionId: "<PARENT_ID>",
    respondedAt: "...",
    processingTimeMs: 1234
  }
}

3. "Coach follow-up NORMALIZED response being returned:" followed by normalized object

4. Both new user message and coach response appear in chat
5. They appear AFTER the previous exchange
```

**Key Validation Points**:
- ✓ `askCoachFollowup()` called with correct interaction ID
- ✓ Raw response contains `parentInteractionId` link
- ✓ Normalized response returned correctly
- ✓ Messages maintain conversation order
- ✓ `currentInteractionId` updated to new interaction ID

**Actual Test**: CRITICAL - Tests conversation continuity

---

### Test 4.2: Ask Multiple Follow-ups
**Steps**:
1. Send follow-up: "Even simpler please"
2. Coach responds
3. Send follow-up: "With an example?"
4. Coach responds
5. Verify all messages in correct order

**Expected Output**:
- All 4 messages (2 user + 2 coach) visible in order
- Each coach response is different
- No duplicate messages
- Chat scrolls to latest message

**Actual Test**: Need to run and verify

---

## Test Suite 5: Coach History

### Test 5.1: Load Coach History on Screen Load
**Steps**:
1. While in AgenticCoachScreen with conversation loaded
2. Close screen (navigate back)
3. Navigate back to AgenticCoachScreen
4. Check console logs

**Expected Output**:
```
Console logs:
1. "Loading coach conversation history..."
2. "Coach history retrieved:" followed by:
{
  success: true,
  count: 3,
  interactions: [
    {
      _id: "...",
      userQuestion: "What is the main concept here?",
      coachResponse: "The main concept is...",
      simplificationLevel: 3,
      createdAt: "..."
    },
    // ... more interactions
  ]
}

3. Previous messages reappear in chat
4. currentInteractionId set to last interaction ID
```

**Key Validation Points**:
- ✓ History loaded from server
- ✓ Messages reconstructed from history
- ✓ User and coach messages paired correctly
- ✓ Chat shows previous conversation
- ✓ Can send follow-up to last interaction

**Actual Test**: Need to run and verify

---

### Test 5.2: Simplification Level Effect
**Steps**:
1. In AgenticCoachScreen, adjust simplification level slider
2. Change from 3 to 1 (more simple)
3. Ask new question: "Explain it very simply"

**Expected Output**:
```
Request body:
{
  simplificationLevel: 1,  // ← Changed
  context: "recording",
  contextId: "...",
  question: "Explain it very simply"
}

Response should be simpler language/shorter
```

**Actual Test**: Need to run and verify

---

## Test Suite 6: Error Handling

### Test 6.1: Network Error
**Steps**:
1. Turn off WiFi/Mobile data
2. Try to ask coach a question

**Expected Output**:
```
Error message in chat: "Error: Failed to get response from coach. Please try again."
Alert dialog appears with same message
Screen doesn't crash
```

**Actual Test**: Need to run and verify

---

### Test 6.2: Invalid Transcript ID
**Steps**:
1. Manually modify transcriptId in params (if possible)
2. Try to ask coach a question

**Expected Output**:
```
Error from server about transcript not found
Error message in chat
No crash
```

**Actual Test**: Need to run and verify

---

### Test 6.3: Missing Session Name
**Steps**:
1. In NameSessionScreen, leave name empty
2. Tap save

**Expected Output**:
```
Validation error: "Session name is required" or similar
Dialog appears
User stays on NameSessionScreen
```

**Actual Test**: Need to run and verify (may not be implemented)

---

## Test Suite 7: Data Persistence

### Test 7.1: Reopen App and Load History
**Steps**:
1. Close app completely
2. Reopen app
3. Navigate to Coach screen
4. Check history loads

**Expected Output**:
- Previous conversations visible in history
- Can ask follow-ups to old conversations

**Actual Test**: Need to run and verify

---

## Quick Reference: Response Structures to Check

### When asking coach, verify in console:

**Hook returns this object**:
```javascript
{
  _id: "64a3e5f9d8c1b2a3f4e5g6h7",           // Use for follow-ups
  userQuestion: "What is main concept?",      // What user asked
  coachResponse: "The main concept is...",    // What to display
  simplificationLevel: 3,                      // 1-5
  createdAt: "2024-01-09T10:30:00Z"          // Timestamp
}
```

**NOT this**:
```javascript
"I don't have a name as I'm an AI assistant..."  // This is just a string
```

---

## Debugging Checklist

If any test fails:

1. **Check Console Logs**:
   - Look for "RAW response" logs to see what server returned
   - Look for "NORMALIZED response" logs to see what hook is returning
   - Look for validation failures in screen

2. **Check Network Tab**:
   - In browser DevTools (if using localhost testing)
   - Or use logcat for actual response data
   - Verify request body has correct `context: 'recording'`

3. **Check Backend Logs**:
   - On server, check what request was received
   - Check what response was generated
   - Look for any errors during processing

4. **Common Issues**:
   - ❌ `contextType: 'transcript'` → Use `context: 'recording'`
   - ❌ Hook returns string → Should return object with coachResponse field
   - ❌ Screen validation fails → Check response structure matches expected
   - ❌ Follow-up not sent with correct ID → Check currentInteractionId is set

---

## Success Criteria

All tests pass when:
1. ✅ Transcripts create successfully and transcriptId is extracted
2. ✅ Summaries generate and display correctly
3. ✅ Coach answers first question with proper response normalization
4. ✅ Follow-ups work and maintain conversation context
5. ✅ History loads when reopening screen
6. ✅ No cascading errors (one bug doesn't cause multiple failures)
7. ✅ All responses validate correctly with their expected structure
8. ✅ Console logs show proper RAW → NORMALIZED transformation

