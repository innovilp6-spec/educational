# Backend Requirements for Frontend Integration

**Status**: Frontend Implementation Complete  
**Date**: Today  
**Version**: 1.0

---

## Overview

The React Native frontend has been updated to integrate with the backend agentic coach system. This document outlines what the backend needs to support and how it will be called from the frontend.

---

## Critical Requirements

### 1. Server Configuration
**Frontend Expects**:
- Server running on `http://192.168.1.100:5000` (IP must be configurable)
- All API endpoints return JSON responses
- CORS enabled for cross-origin requests from React Native

**Frontend Will Send**:
- Header: `"x-user-email": "testuser@example.com"`
- All requests: `Content-Type: application/json`

---

### 2. Authentication & User Context

**Current Implementation**: Email-based user identification (temporary)

**Frontend Code**:
```javascript
headers: {
  "x-user-email": "testuser@example.com",  // Passed with every request
}
```

**Backend Requirements**:
- [ ] Accept `x-user-email` header for user identification
- [ ] Validate user exists (or create if new)
- [ ] Associate all coach interactions with user
- [ ] Return user's study context when gathering context

**Note**: Should be replaced with JWT auth in production

---

## API Endpoints Required

### A. Summary Generation

**Endpoint**: `POST /api/lectures/transcript/{transcriptId}/summary`

**Frontend Call**:
```javascript
const response = await generateSummary(transcriptId, 'quick');
```

**Expected Request**:
```json
{
  "method": "POST",
  "url": "/api/lectures/transcript/507f1f77bcf86cd799439011/summary",
  "headers": {
    "Content-Type": "application/json",
    "x-user-email": "testuser@example.com"
  },
  "body": {
    "summaryType": "quick"  // or "detailed" or "simplified"
  }
}
```

**Expected Response** (200 OK):
```json
{
  "summary": {
    "content": "The lecture covered X, Y, Z concepts...",
    "type": "quick",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Requirements**:
- [ ] Find transcript by `transcriptId`
- [ ] Generate summary using `summaryType` (quick/detailed/simplified)
- [ ] Use Azure OpenAI or LLM service
- [ ] Return summary text in response
- [ ] Handle missing transcript (404 error)

---

### B. Agentic Coach - Ask Question

**Endpoint**: `POST /api/coach/agentic/ask`

**Frontend Call**:
```javascript
const response = await askCoach(
  'What are the main concepts?',  // question
  3,                               // simplificationLevel (1-5)
  'transcript',                    // contextType
  '507f1f77bcf86cd799439011'      // contextId
);
```

**Expected Request**:
```json
{
  "method": "POST",
  "url": "/api/coach/agentic/ask",
  "headers": {
    "Content-Type": "application/json",
    "x-user-email": "testuser@example.com"
  },
  "body": {
    "question": "What are the main concepts?",
    "simplificationLevel": 3,
    "contextType": "transcript",
    "contextId": "507f1f77bcf86cd799439011"
  }
}
```

**Expected Response** (200 OK):
```json
{
  "interaction": {
    "_id": "507f1f77bcf86cd799439012",
    "userEmail": "testuser@example.com",
    "userQuestion": "What are the main concepts?",
    "coachResponse": "Based on the transcript, the main concepts covered are...",
    "simplificationLevel": 3,
    "contextType": "transcript",
    "contextId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Requirements**:
- [ ] Extract context from `contextId` using `contextService.getUserStudyContext()`
- [ ] Build context-aware prompt including:
  - User's question
  - Transcript content (if contextType="transcript")
  - User's study history
  - Previous interactions
- [ ] Apply `simplificationLevel` to adjust response complexity
- [ ] Call LLM with context-aware prompt
- [ ] Store interaction in Coach model
- [ ] Return interaction with `_id` for follow-up reference

**Context Requirements** (Backend Should Gather):
- Full transcript text
- User's previous study sessions
- Previous coach interactions
- User's learning level/progress

---

### C. Agentic Coach - Follow-up Question

**Endpoint**: `POST /api/coach/agentic/{interactionId}/followup`

**Frontend Call**:
```javascript
const response = await askCoachFollowup(
  '507f1f77bcf86cd799439012',  // interactionId from previous response
  'Can you explain further?'    // followupQuestion
);
```

**Expected Request**:
```json
{
  "method": "POST",
  "url": "/api/coach/agentic/507f1f77bcf86cd799439012/followup",
  "headers": {
    "Content-Type": "application/json",
    "x-user-email": "testuser@example.com"
  },
  "body": {
    "followupQuestion": "Can you explain further?"
  }
}
```

**Expected Response** (200 OK):
```json
{
  "interaction": {
    "_id": "507f1f77bcf86cd799439012",
    "userQuestion": "Can you explain further?",
    "coachResponse": "Sure! Let me break it down into simpler terms...",
    "createdAt": "2024-01-15T10:32:00Z"
  }
}
```

**Requirements**:
- [ ] Find interaction by `interactionId`
- [ ] Maintain conversation context from previous interactions
- [ ] Include previous question/answer in context
- [ ] Call LLM with conversation history
- [ ] Store follow-up as continuation (same conversation)
- [ ] Return updated interaction

**Conversation State** (Must Maintain):
- All previous Q&A in conversation
- Transcript context
- User context
- Simplification level from original question

---

### D. Coach Conversation History

**Endpoint**: `GET /api/coach/agentic/history`

**Frontend Call**:
```javascript
const history = await getCoachHistory();
```

**Expected Request**:
```json
{
  "method": "GET",
  "url": "/api/coach/agentic/history",
  "headers": {
    "x-user-email": "testuser@example.com"
  }
}
```

**Expected Response** (200 OK):
```json
{
  "interactions": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "userQuestion": "What are the main concepts?",
      "coachResponse": "Based on the transcript...",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "userQuestion": "Can you explain further?",
      "coachResponse": "Sure! Let me break it down...",
      "createdAt": "2024-01-15T10:32:00Z"
    }
  ]
}
```

**Requirements**:
- [ ] Query all Coach interactions for user (via email)
- [ ] Return interactions in chronological order
- [ ] Include `_id`, `userQuestion`, `coachResponse`, `createdAt`
- [ ] Sort by creation date (oldest first)
- [ ] Return empty array if no history

---

### E. Clear Coach History (Optional)

**Endpoint**: `DELETE /api/coach/agentic/history`

**Frontend Will Call**: When user clicks "Clear" button in CoachScreen

**Expected Request**:
```json
{
  "method": "DELETE",
  "url": "/api/coach/agentic/history",
  "headers": {
    "x-user-email": "testuser@example.com"
  }
}
```

**Expected Response** (200 OK):
```json
{
  "message": "History cleared successfully",
  "deletedCount": 3
}
```

**Requirements**:
- [ ] Delete all Coach interactions for user
- [ ] Confirm deletion with count
- [ ] Prevent accidental deletion (warn frontend)

---

## Context Service Integration

### What Frontend Expects

When frontend asks a question, backend should:

1. **Gather Context** using existing `contextService`:
   ```javascript
   const context = await contextService.getUserStudyContext(
     userEmail,
     contextType,  // 'transcript', 'notes', etc.
     contextId     // specific transcript/notes ID
   );
   ```

2. **Build Prompt** that includes:
   - User's current question
   - Transcript content (if available)
   - Previous study sessions
   - Prior coach interactions
   - User's learning level

3. **Apply Simplification**:
   - Level 1: Explain in simplest terms
   - Level 3: Balanced explanation
   - Level 5: Technical/detailed explanation

4. **Call LLM** with full context
   ```javascript
   const response = await llmService.generateResponse(contextPrompt, {
     simplificationLevel,
     temperature,
     maxTokens
   });
   ```

---

## Frontend → Backend Message Flow

### Scenario 1: First Coach Question

```
Frontend                          Backend
├─ Get transcript from route.params
├─ User enters question
├─ POST /api/coach/agentic/ask
│  ├─ question
│  ├─ simplificationLevel: 3
│  ├─ contextType: "transcript"
│  └─ contextId: <transcriptId>
│                               │
│                               ├─ Lookup transcript
│                               ├─ Gather user context
│                               ├─ Build context prompt
│                               ├─ Call Azure OpenAI
│                               ├─ Store in Coach model
│                               └─ Return interaction._id
│
├─ Receive interaction with _id
├─ Display coach response
├─ Store interactionId for follow-up
└─ Ready for follow-up question
```

### Scenario 2: Follow-up Question

```
Frontend                          Backend
├─ User asks follow-up
├─ POST /api/coach/agentic/{interactionId}/followup
│  ├─ interactionId
│  └─ followupQuestion
│                               │
│                               ├─ Lookup interaction
│                               ├─ Get previous conversation
│                               ├─ Include full context
│                               ├─ Build conversation prompt
│                               ├─ Call Azure OpenAI
│                               ├─ Update Coach model
│                               └─ Return updated interaction
│
├─ Display follow-up response
└─ Continue conversation
```

### Scenario 3: History Load

```
Frontend                          Backend
├─ Navigate to CoachScreen
├─ useEffect calls getCoachHistory()
├─ GET /api/coach/agentic/history
│                               │
│                               ├─ Query user's interactions
│                               ├─ Sort chronologically
│                               └─ Return all interactions
│
├─ Receive interaction array
├─ Convert to message format
├─ Display all messages
└─ Can continue conversation
```

---

## Error Handling

### Errors Frontend Expects

**Missing Transcript (404)**:
```json
{
  "error": "Transcript not found",
  "status": 404
}
```

**Missing Interaction (404)**:
```json
{
  "error": "Interaction not found",
  "status": 404
}
```

**Invalid Request (400)**:
```json
{
  "error": "Missing required field: question",
  "status": 400
}
```

**Server Error (500)**:
```json
{
  "error": "Internal server error",
  "status": 500
}
```

**Frontend Handling**:
- Shows error message in red chat bubble
- Alert pop-up with error description
- Allows user to retry

---

## Testing Requirements

### For Backend Team to Test

1. **Test with Thunder Client** (use existing THUNDERCLIENT_TESTING.md)

2. **Test Flows**:
   - [ ] Ask new question → receives response
   - [ ] Ask follow-up → maintains context
   - [ ] Get history → loads all interactions
   - [ ] Clear history → deletes all interactions
   - [ ] Generate summary → returns correct summary type

3. **Verify Context**:
   - [ ] Coach response mentions specific transcript content
   - [ ] Simplification level affects response complexity
   - [ ] Follow-up continues from previous context
   - [ ] Previous sessions inform context

4. **Database Checks**:
   ```javascript
   // Verify documents created:
   db.coaches.find({userEmail: "testuser@example.com"}).pretty()
   ```

---

## Database Models Used

### Coach Collection (Existing)
```javascript
{
  _id: ObjectId,
  userId: String,
  transcriptId: ObjectId,
  userQuestion: String,
  coachResponse: String,
  simplificationLevel: Number,
  contextType: String,
  contextData: Object,
  followUpResponses: [
    {
      question: String,
      response: String,
      createdAt: Date
    }
  ],
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Expected Queries:
- Find by user: `db.coaches.find({userId: email})`
- Find by transcript: `db.coaches.find({transcriptId: id})`
- Get history: `db.coaches.find({userId: email}).sort({createdAt: 1})`

---

## Performance Considerations

### Frontend Expectations
- Coach response within 5-10 seconds (LLM call latency)
- History loads in < 2 seconds
- Summary generation within 8-15 seconds

### Backend Recommendations
- [ ] Cache frequently asked questions
- [ ] Implement request queuing for LLM calls
- [ ] Optimize context gathering (don't fetch unnecessary data)
- [ ] Index collections by userId and transcriptId
- [ ] Consider async processing for slow operations

---

## Security Considerations

### Frontend Will Send
- User email in header: `x-user-email`
- No sensitive data in request body
- All requests via HTTPS (in production)

### Backend Should Validate
- [ ] User email is valid
- [ ] User exists in system
- [ ] User owns the transcript/interaction
- [ ] Request is properly authenticated
- [ ] Rate limiting on API calls
- [ ] Input validation on all fields

---

## Current Server Status (As Provided)

✅ **Ready to Use**:
- Express.js server with all routes
- MongoDB connected
- Context service available
- Agent service operational
- 12+ endpoints functional

❌ **Verification Needed**:
- [ ] All coach endpoints working correctly
- [ ] Context service returning proper data
- [ ] LLM integration (Azure OpenAI) configured
- [ ] Error handling comprehensive
- [ ] Database queries optimized

---

## Next Steps for Frontend Testing

1. **Backend Team**:
   - [ ] Verify all endpoints return expected format
   - [ ] Test with Thunder Client using THUNDERCLIENT_TESTING.md
   - [ ] Ensure context service working
   - [ ] Check LLM responses quality

2. **Frontend Team**:
   - [ ] Update `SERVER_BASE_URL` to actual IP
   - [ ] Update `USER_EMAIL` to test user
   - [ ] Run app and test coach workflow
   - [ ] Verify API responses match expected format
   - [ ] Check console logs for errors

3. **Integration**:
   - [ ] Frontend sends requests, backend receives correctly
   - [ ] Backend responses match expected format
   - [ ] Context flows properly through system
   - [ ] Error handling works both sides

---

## Notes for Backend Team

- Frontend expects **specific response format** - don't change
- Coach interactions stored with user email, not JWT yet
- Simplification level (1-5) should affect response length/complexity
- Context service must work reliably - coach quality depends on it
- All errors should return JSON, not HTML error pages

---

## Support Contact Points

**If Frontend Gets Error**:
1. Check server logs for incoming request
2. Verify request body matches expected format
3. Test endpoint with Thunder Client first
4. Check if transcriptId/interactionId valid
5. Verify user exists in system

**If Response Wrong Format**:
1. Verify response matches examples above
2. Ensure all required fields present
3. Test with actual data, not sample data
4. Check for any typos in field names

---

**Last Updated**: Today  
**Version**: 1.0  
**Status**: Ready for Backend Verification
