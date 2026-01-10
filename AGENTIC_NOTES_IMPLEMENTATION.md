# Agentic Notes Implementation

## Overview

The Agentic Notes feature provides a **completely conversational, AI-powered note-taking experience**. Instead of form-based note creation, users have natural conversations with an AI agent that:

1. **Creates** new notes based on prompts
2. **Edits** existing notes based on conversational instructions
3. **Appends** content to existing notes
4. **Understands** note structure (headings, points, paragraphs, etc.)
5. **Tracks** conversation history for every modification

## Architecture

### Frontend Components

#### AgenticNotesScreen.jsx
- **Purpose**: Complete conversational note management interface
- **Views**:
  - **Notes List View**: Shows all user's agentic notes with metadata
  - **Conversation View**: Chat-based interface for creating/editing notes
- **Features**:
  - Create new notes from prompts
  - Continue existing note conversations
  - View conversation history
  - Real-time response from AI agent
  - Note content preview

#### useTranscriptAPI Hook Functions
New agentic note functions added:

```javascript
// Create a new agentic note
agenticCreateNote({
    content: String,              // Source content (transcript, etc)
    standard: String,             // '6'-'12'
    chapter: String,              // Chapter name
    topic: String,                // Topic for note
    subject: String,              // Subject area
    sourceId: String|null,        // Reference to transcript/book
    sourceType: String,           // 'lecture'|'book'|'standalone'
    initialInstruction: String    // User's prompt for creation
})

// Edit existing agentic note
agenticEditNote(noteId, {
    editInstruction: String  // Natural language instruction
})

// Append content to agentic note
agenticAppendNote(noteId, {
    appendInstruction: String,     // Natural language instruction
    additionalContent: String|null // Optional additional content
})

// Get all user's agentic notes
agenticGetUserNotes()

// Get single agentic note with conversation history
agenticGetNote(noteId)

// Delete agentic note
agenticDeleteNote(noteId)
```

### Backend Integration

#### API Endpoints

**Create Note**
- Route: `POST /api/notes/agentic/create`
- Body:
  ```javascript
  {
    content: String,
    standard: String,
    chapter: String,
    topic: String,
    subject: String,
    sourceType: 'lecture'|'book'|'standalone',
    sourceId: ObjectId|null,
    initialInstruction: String
  }
  ```
- Response:
  ```javascript
  {
    success: true,
    note: {
      noteId: ObjectId,
      title: String,
      content: String,
      contentPreview: String,
      conversationHistoryCount: Number,
      version: Number,
      createdAt: Date,
      agenticMetadata: {
        generatedWith: String,
        relatedTopics: [String],
        generatedAt: Date,
        agentModel: String
      }
    }
  }
  ```

**Edit Note**
- Route: `POST /api/notes/agentic/:noteId/edit`
- Body:
  ```javascript
  {
    editInstruction: String  // Natural language edit request
  }
  ```
- Response:
  ```javascript
  {
    success: true,
    note: {
      noteId: ObjectId,
      title: String,
      content: String,
      version: Number,
      updatedAt: Date
    }
  }
  ```

**Append to Note**
- Route: `POST /api/notes/agentic/:noteId/append`
- Body:
  ```javascript
  {
    appendInstruction: String,     // Natural language request
    additionalContent: String|null // Optional content
  }
  ```
- Response: Same as edit

**Get User Notes**
- Route: `GET /api/notes/agentic/`
- Response:
  ```javascript
  {
    success: true,
    notes: [
      {
        _id: ObjectId,
        title: String,
        content: String,
        standard: String,
        topic: String,
        version: Number,
        conversationHistoryCount: Number,
        createdAt: Date,
        updatedAt: Date
      }
    ]
  }
  ```

**Get Single Note**
- Route: `GET /api/notes/agentic/:noteId`
- Response:
  ```javascript
  {
    success: true,
    note: {
      _id: ObjectId,
      title: String,
      content: String,
      conversationHistory: [
        {
          type: 'initial-prompt'|'edit'|'append',
          instruction: String,
          content: String,
          timestamp: Date
        }
      ],
      agenticMetadata: {
        generatedWith: String,
        relatedTopics: [String],
        generatedAt: Date
      }
    }
  }
  ```

**Delete Note**
- Route: `DELETE /api/notes/agentic/:noteId`

## User Workflows

### Workflow 1: Create New Note from Transcript

1. User navigates from TranscriptViewerScreen to "My Notes"
2. AgenticNotesScreen shows notes list (empty if first time)
3. User taps "Start New Note"
4. User types prompt: "Create notes on photosynthesis"
5. Agent processes request and creates note
6. Note appears in conversation with preview
7. User continues refining: "Add examples", "Simplify the explanation"
8. Each instruction updates the note and adds to conversation history

### Workflow 2: Continue Existing Note Conversation

1. User taps on existing note from list
2. Conversation view opens showing:
   - Current note content
   - Conversation history of how it was created/modified
3. User types new instruction: "Add a section on cellular respiration"
4. Agent detects action (add) and appends to note
5. Conversation history updates

### Workflow 3: Edit Note Structure

1. User opens existing note
2. Types instruction: "Rewrite the introduction to be simpler"
3. Agent detects edit instruction
4. Note content is modified
5. Version increments

## Data Model

### Conversation History Structure

Each note maintains a conversation history:

```javascript
conversationHistory: [
  {
    type: 'initial-prompt',  // How note was created
    instruction: 'Create notes on photosynthesis',
    content: 'Full generated content...',
    timestamp: Date,
    agentResponse: 'I\'ve created comprehensive notes...'
  },
  {
    type: 'append',
    instruction: 'Add examples of photosynthesis in different plants',
    content: 'Added new section: Examples...',
    timestamp: Date,
    agentResponse: 'I\'ve added examples...'
  },
  {
    type: 'edit',
    instruction: 'Simplify the explanation',
    content: 'Updated content...',
    timestamp: Date,
    agentResponse: 'Simplified the explanation...'
  }
]
```

### Note Structure

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,                    // Auto-generated from prompt
  content: String,                  // Full note content
  standard: String,                 // Grade/level
  chapter: String,                  // Source chapter
  topic: String,                    // Topic covered
  subject: String,                  // Subject area
  version: Number,                  // Incremented on each change
  sourceType: 'lecture'|'book'|'standalone',
  sourceId: ObjectId|null,          // Reference to transcript/book
  conversationHistory: Array,       // As described above
  agenticMetadata: {
    generatedWith: 'full-context|simple|enhanced',
    relatedTopics: [String],
    generatedAt: Date,
    agentModel: String              // e.g., 'GPT-4o'
  },
  simplifiedVersions: {
    level1: String,                 // Simplified for younger students
    level2: String,                 // Medium simplification
    level3: String                  // Complex/detailed
  },
  createdAt: Date,
  updatedAt: Date
}
```

## UI/UX Design

### Notes List View
- Shows all notes with:
  - Title
  - Standard/Topic metadata
  - Content preview (first 100 chars)
  - Version number
  - Last modified date
  - Tap to open conversation

### Conversation View
- **Header**:
  - Back button to list
  - Note title
  - Save/check icon
- **Content**:
  - Current note content preview (scrollable, ~250px max)
  - Conversation history as chat bubbles
  - User messages (blue, right-aligned)
  - Agent responses (light blue, left-aligned)
  - System messages (gray, centered)
- **Input**:
  - Text input for user prompts
  - Send button
  - Placeholder varies based on create vs edit context
  - Character limit: 500

### Message Types

1. **User Messages** (Blue bubbles, right)
   - User's prompts and instructions
   - Example: "Create notes on photosynthesis"

2. **Agent Messages** (Light blue bubbles, left)
   - Agent responses with checkmark
   - Shows what was done
   - Example: "✓ Created new note\n\nPhotosynthesis is..."

3. **System Messages** (Gray, centered)
   - Note opened/created messages
   - Example: "Opened note: 'Photosynthesis Notes'"

4. **Error Messages** (Red, centered)
   - Error notifications
   - Example: "Error: Failed to process request"

## Intent Detection

The system infers user intent from prompts:

- **Create New Note**:
  - "Create notes on..."
  - "Generate notes for..."
  - "Make notes about..."
  - No existing note open

- **Edit Note**:
  - "Change the..."
  - "Rewrite the..."
  - "Fix the..."
  - "Improve the..."
  - "Make it simpler..."
  - Existing note open

- **Append to Note**:
  - "Add a section on..."
  - "Include..."
  - "Also add..."
  - "Expand on..."
  - Existing note open

## Integration Points

### From TranscriptViewerScreen
Potential future integration to save transcript as note:
```javascript
<Button 
  onPress={() => navigation.navigate('Notes', {
    transcriptId: transcript._id,
    sessionName: sessionName,
    transcript: transcript.content
  })}
  title="Save as Agentic Note"
/>
```

### From AgenticCoachScreen
Potential future integration to save coach conversation as note:
```javascript
<Button
  onPress={() => navigation.navigate('Notes', {
    transcript: coachHistory.map(m => `${m.question}\n${m.response}`).join('\n\n'),
    sessionName: 'Coach Conversation Notes'
  })}
  title="Save Conversation as Note"
/>
```

## Error Handling

The system gracefully handles errors:

1. **Network Errors**: "Error: Failed to process request"
2. **Validation Errors**: "Error: Missing required fields"
3. **AI Processing Errors**: "Error: Could not generate content"

Errors are shown in:
- Chat as red error bubbles
- Alert dialogs for critical errors
- Logged to console for debugging

## Performance Considerations

1. **Lazy Loading**: Notes list fetched once, specific note loaded on demand
2. **Local Caching**: Can be added for offline support
3. **Streaming**: AI responses could be streamed for long notes
4. **Pagination**: Notes list paginated if > 100 notes

## Future Enhancements

1. **Simplified Versions**: Auto-generate reading-level versions
2. **Text-to-Speech**: Read notes aloud
3. **Collaboration**: Share notes with other students
4. **Search**: Full-text search across notes
5. **Tags**: User-defined tags for organization
6. **Export**: PDF/Word export with formatting
7. **Templates**: Note templates for specific subjects
8. **Analytics**: Track note usage and learning progress

## Testing Checklist

- [ ] Create new note from conversation
- [ ] Edit existing note
- [ ] Append to note
- [ ] Load notes list
- [ ] Navigate between list and conversation
- [ ] Back button returns to list
- [ ] Error handling (network, validation)
- [ ] Empty state (no notes)
- [ ] Long content scrolling
- [ ] Input clearing after send
- [ ] Loading states (loading history, processing)
- [ ] Conversation history reconstruction

## Notes on Backend Requirements

The backend `/api/notes/agentic/*` endpoints must:

1. Support conversation history tracking
2. Use LLM (GPT-4o) for note generation and editing
3. Include user context (study level, previous notes)
4. Auto-generate titles from prompts
5. Handle all edge cases (empty content, very long prompts)
6. Return consistent JSON structure
7. Support partial updates with version tracking
8. Clean up old/unused notes (optional)

## Related Documentation

- [API_RESPONSE_SCHEMAS.md](API_RESPONSE_SCHEMAS.md) - Complete API response structures
- [QUICK_API_REFERENCE.md](QUICK_API_REFERENCE.md) - API endpoint reference
- [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md) - Backend implementation guide
