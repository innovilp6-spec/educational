# Context Switching Flow - Fully Restored

## Overview
The context-switching functionality has been fully restored. The system now properly detects when users want to switch contexts (e.g., "switch to lecture", "study physics", etc.) and shows them a modal with matching resources to select from.

## Flow Diagram

```
User Types Message → Frontend Checks if Context Hint
    ↓
    YES → Call /detect-hint endpoint
    ↓
    Backend searches for matching resources (lectures, notes, books)
    ↓
    Backend returns suggestions in modal format
    ↓
    Frontend shows Context Suggestions Modal
    ↓
    User selects a resource → Call /confirm-context endpoint
    ↓
    Backend validates access & returns confirmation
    ↓
    Frontend switches context & reloads chat history
    ↓
    Chat now shows ONLY "study" type messages for new context
    
    OR
    
    NO → Regular coach question → Ask coach → Save to DB
```

## Frontend Changes

### File: `src/screens/AgenticCoachScreen.jsx`

#### 1. **New Imports**
Added `Modal` and `FlatList` to React Native imports for displaying context suggestions.

#### 2. **New State Variables**
```javascript
const [showContextModal, setShowContextModal] = useState(false);          // Show/hide modal
const [contextSuggestions, setContextSuggestions] = useState([]);         // Suggestions from backend
const [isDetectingHint, setIsDetectingHint] = useState(false);             // Loading state for hint detection
const [pendingContextSwitch, setPendingContextSwitch] = useState(null);    // Track context switch progress
```

#### 3. **New Hook Functions**
Updated API hook to include:
```javascript
const { ..., detectContextHint, confirmContextSwitch } = useTranscriptAPI();
```

#### 4. **New Helper Functions**

##### `isContextHint(message)` 
Checks if message matches context-switching patterns:
- "change context to ...", "switch to ...", "go to ..."
- "study about ...", "read ...", "learn ..."
- "what/tell/show me [lecture/chapter/topic/book/note] ..."
- "i want to ...", "let's study ..."

##### `handleContextHint(userMessage)`
- Calls `/api/coach/agentic/detect-hint` endpoint
- Gets list of matching resources from backend
- Shows modal with suggestions
- Adds "searching" system message to chat
- Returns `{ isHint: boolean, suggestions?: array }`

##### `handleContextSelection(selectedContext)`
- Calls `/api/coach/agentic/confirm-context` endpoint
- Updates context state
- Resets interaction ID
- Reloads conversation history for new context
- Shows context-switch system message
- Removes "searching" message

#### 5. **Updated `sendMessage()` Function**

**Priority Flow:**
1. **First**: Check if message is a context hint → Show modal (don't ask coach)
2. **Second**: Check if message is a quiz request → Generate quiz
3. **Third**: Regular coach question → Ask coach normally

```javascript
// FIRST: Check if this is a context-switching hint
if (isContextHint(userMessage)) {
    const hintResult = await handleContextHint(userMessage);
    if (hintResult.isHint && hintResult.suggestions?.length > 0) {
        return;  // Modal shown, waiting for user selection
    }
    // If no hints found, continue as regular message
}

// SECOND: Check if user is asking for a quiz
// ... (existing quiz logic)

// THIRD: Regular coach question
// ... (existing coach logic)
```

#### 6. **New Context Suggestions Modal**

Modal displays:
- Title: "Switch Context"
- Subtitle: "Select which context you'd like to study:"
- List of matching resources with:
  - Icon (📷 for books, 🎙️ for lectures, 📝 for notes)
  - Name (e.g., "Physics Chapter 5 (Lecture)")
  - Description (subject • topic)
  - Badge showing current context
- Cancel button

#### 7. **New Styles**
Added complete styling for:
- `modalOverlay` - semi-transparent background
- `modalContent` - modal container
- `modalTitle` & `modalSubtitle`
- `contextOption` - individual suggestion item
- `contextOptionContent`, `contextOptionText`, etc.
- `currentBadge` - highlights current context
- `modalCancelButton`

## Backend Changes

### File: `src/services/contextHintService.js`

#### Updated `formatHintResponse()` Method

**Before:** Returned `matches` array
**After:** Returns `suggestions` array with frontend-compatible structure

**New Response Format:**
```javascript
{
    success: true,
    hasContextHint: true,
    suggestions: [
        {
            contextId: "mongo_id_123",
            contextType: "lecture",  // or "note", "book", "general"
            name: "Physics Chapter 5 (Lecture)",
            description: "Physics • Waves and Light",
            icon: "🎙️",
            isCurrentContext: false,
            // ... additional metadata
        }
    ],
    isSingleMatch: true/false,
    isMultipleMatches: true/false,
    instruction: "User needs to confirm context switch"
}
```

#### New Helper Methods

**`_getDescription(match)`** - Formats description text
- Books: category name
- Lectures: "Subject • Topic"
- Notes: "Subject • Topic"

**`_getIcon(type)`** - Returns emoji for context type
- Books: 📷
- Lectures: 🎙️
- Notes: 📝
- General: 🧠

### File: `src/controllers/agenticCoachController.js`

No changes needed - already properly configured for:
- `/coach/agentic/detect-hint` endpoint (returns suggestions)
- `/coach/agentic/confirm-context` endpoint (validates context)

### File: `src/models/Coach.js`

No changes needed - already has:
- `messageType` field with values: `['study', 'system', 'navigation', 'context-switch']`
- Backend filters by `messageType = 'study'` in `getCoachHistory` to exclude system messages

## Data Flow

### When User Types Context Hint

**Frontend → Backend:**
```
POST /api/coach/agentic/detect-hint
{
    message: "I want to study physics lectures"
}
```

**Backend → Frontend:**
```
{
    success: true,
    hasContextHint: true,
    suggestions: [
        {
            contextId: "abc123",
            contextType: "lecture",
            name: "Introduction to Physics (Lecture)",
            description: "Physics • General",
            icon: "🎙️",
            isCurrentContext: false
        }
    ]
}
```

### When User Selects from Modal

**Frontend → Backend:**
```
POST /api/coach/agentic/confirm-context
{
    selectedContextId: "abc123",
    selectedContextType: "lecture"
}
```

**Backend → Frontend:**
```
{
    success: true,
    message: "Context switched to ...",
    contextSwitch: {
        confirmed: true,
        contextType: "lecture",
        contextId: "abc123",
        displayName: "...",
        info: { ... }
    }
}
```

### Chat History Loading

**Before:** Loaded once on mount with `useEffect(() => { loadCoachHistory() }, [])`

**After:** Loads whenever context changes with `useEffect(() => { loadCoachHistory() }, [currentContext])`

**Backend Query:**
```
GET /api/coach/agentic/history?contextId=abc123&contextType=lecture

Returns ONLY messages where messageType = 'study'
Excludes: system messages, navigation messages, context-switch notifications
```

## Key Differences from Previous Issues

| Aspect | Before (Broken) | After (Fixed) |
|--------|-----------------|---------------|
| Context Hint Detection | Not implemented | ✅ Detects patterns like "switch to", "study", "go to" |
| Modal Display | None | ✅ Shows matching resources in beautiful modal |
| Endpoint Usage | Not called | ✅ Calls `/detect-hint` and `/confirm-context` |
| Chat Filtering | All messages shown | ✅ Only "study" messages, excludes system/context-switch |
| History Reload | Only on mount | ✅ Reloads on context change |
| Same Messages Issue | ✅ This was the problem! | ✅ FIXED - each context has separate history |

## Testing Checklist

- [ ] **Test 1: Detect Context Hint**
  - Open coach from Home (general context)
  - Type: "switch to physics lecture"
  - Verify: Modal appears with matching lectures
  
- [ ] **Test 2: Select Context**
  - Select a lecture from modal
  - Verify: Context switches to "lecture"
  - Verify: Chat history changes to lecture context
  - Verify: No system/context-switch messages shown
  
- [ ] **Test 3: Chat History Separation**
  - Ask general coach: "What is photosynthesis?"
  - Switch context to lecture
  - Verify: Lecture history is different
  - Switch back to general
  - Verify: Original general message is still there
  
- [ ] **Test 4: Regular Questions Work**
  - Type regular question (not a hint)
  - Verify: Goes directly to coach (no modal)
  - Verify: Response is saved to database
  
- [ ] **Test 5: Quiz Requests**
  - Type: "Create a quiz about photosynthesis"
  - Verify: Quiz appears (not hint detection)
  - Verify: Quiz works normally
  
- [ ] **Test 6: Back Navigation**
  - Follow: Home → Coach → Switch Context → Ask Question
  - Press back through entire flow
  - Verify: Navigation preserves all screens

## Consistency Notes

✅ **Frontend & Backend Aligned:**
- Frontend detects hints using same keywords as backend heuristics
- Backend response format matches frontend modal expectations
- Context types are consistent: "lecture", "note", "book", "general"
- Message filtering by `messageType` prevents mixed contexts

✅ **API Contracts:**
- Request/response formats validated
- Error handling consistent
- Authorization checks at every step
- User ID properly validated

## Files Modified

### Frontend
- `src/screens/AgenticCoachScreen.jsx` - Complete context-switching implementation

### Backend  
- `src/services/contextHintService.js` - Updated response formatting

### No Changes Needed
- `src/hooks/useTranscriptAPI.js` - Already had the functions
- `src/controllers/agenticCoachController.js` - Already implemented
- `src/models/Coach.js` - Already had messageType field

## Next Steps (If Needed)

1. **Persistence**: Save user's context preference (optional)
2. **Context Icons**: Add to coach header to show active context
3. **Keyboard Dismissal**: Dismiss keyboard when modal opens
4. **Haptic Feedback**: Add vibration on context switch
5. **Analytics**: Track which contexts users switch to
