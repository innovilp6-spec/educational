# Quick Reference - Frontend API Integration

## Server Configuration

```javascript
// File: src/hooks/useTranscriptAPI.js
const SERVER_BASE_URL = "http://192.168.1.100:5000";  // ← UPDATE IP
const USER_EMAIL = "testuser@example.com";            // ← UPDATE EMAIL
```

---

## API Functions Available

### 1. Ask Coach (New Question)

```javascript
import useTranscriptAPI from '../hooks/useTranscriptAPI';

const { askCoach } = useTranscriptAPI();

// Call it:
const response = await askCoach(
  'What are the main concepts?',  // question (string)
  3,                               // simplificationLevel (1-5)
  'transcript',                    // contextType ('transcript'|'notes')
  '507f1f77bcf86cd799439011'      // contextId (string)
);

// Response:
{
  interaction: {
    _id: '507f1f77bcf86cd799439012',  // Use for follow-ups
    userQuestion: 'What are...',
    coachResponse: 'Based on...',
    createdAt: '2024-01-15T10:30:00Z'
  }
}
```

**Error Handling**:
```javascript
try {
  const response = await askCoach(question, level, type, id);
  // Success - use response.interaction._id for follow-ups
} catch (err) {
  console.error('Coach error:', err);
  // Show error to user
}
```

---

### 2. Ask Coach Follow-up

```javascript
const { askCoachFollowup } = useTranscriptAPI();

// Call it:
const response = await askCoachFollowup(
  '507f1f77bcf86cd799439012',  // interactionId from previous response
  'Can you explain further?'    // followupQuestion (string)
);

// Response: Same format as askCoach()
{
  interaction: {
    _id: '507f1f77bcf86cd799439012',
    userQuestion: 'Can you...',
    coachResponse: 'Sure!...',
    createdAt: '2024-01-15T10:32:00Z'
  }
}
```

**Key Difference**: No simplificationLevel or contextType needed - inherited from original question

---

### 3. Get Coach History

```javascript
const { getCoachHistory } = useTranscriptAPI();

// Call it:
const history = await getCoachHistory();

// Response:
{
  interactions: [
    {
      _id: '507f1f77bcf86cd799439012',
      userQuestion: 'What are...',
      coachResponse: 'Based on...',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      _id: '507f1f77bcf86cd799439013',
      userQuestion: 'Explain further?',
      coachResponse: 'Sure!...',
      createdAt: '2024-01-15T10:32:00Z'
    }
  ]
}

// Returns empty array if no history
```

**Error Handling**:
```javascript
try {
  const history = await getCoachHistory();
  // Convert to messages and display
} catch (err) {
  console.error('Load history failed:', err);
  // Show empty state, user can start fresh
}
```

---

### 4. Generate Summary

```javascript
const { generateSummary } = useTranscriptAPI();

// Call it:
const summary = await generateSummary(
  '507f1f77bcf86cd799439011',  // transcriptId (string)
  'quick'                       // summaryType: 'quick'|'detailed'|'simplified'
);

// Returns: String (summary text)
// Example:
"This lecture covers main concepts including X, Y, and Z. Key takeaways: ..."

// Error returns empty string
```

---

### 5. Create Transcript

```javascript
const { createTranscript } = useTranscriptAPI();

// Call it:
const response = await createTranscript(
  'Full transcript text...',  // transcriptText
  'Class 10',                 // standard
  'Chapter 5',                // chapter
  'Algorithms',               // topic
  'Computer Science'          // subject
);

// Response:
{
  transcriptId: '507f1f77bcf86cd799439011',
  transcriptText: '...',
  createdAt: '...'
}
```

---

## Usage in Components

### In TranscriptViewerScreen

```javascript
import useTranscriptAPI from '../hooks/useTranscriptAPI';

export default function TranscriptViewerScreen({ route, navigation }) {
  const { generateSummary } = useTranscriptAPI();
  
  const generateSummaryHandler = async (type) => {
    try {
      setIsLoadingSummary(true);
      const summary = await generateSummary(transcriptId, type);
      // Display summary
    } catch (err) {
      // Show error
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  // Navigate to coach
  navigation.navigate('AgenticCoach', {
    transcriptId,
    sessionName,
    transcript
  });
}
```

### In AgenticCoachScreen

```javascript
import useTranscriptAPI from '../hooks/useTranscriptAPI';

export default function AgenticCoachScreen({ route }) {
  const { transcriptId, sessionName, transcript } = route.params;
  const { askCoach, askCoachFollowup, getCoachHistory } = useTranscriptAPI();
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = async () => {
    const history = await getCoachHistory();
    // Convert to messages and display
  };
  
  const sendQuestion = async (question) => {
    if (currentInteractionId) {
      // Follow-up
      const response = await askCoachFollowup(currentInteractionId, question);
    } else {
      // New question
      const response = await askCoach(
        question,
        simplificationLevel,
        'transcript',
        transcriptId
      );
      setCurrentInteractionId(response.interaction._id);
    }
    
    // Add to messages
    setMessages(prev => [...prev, {
      id: response.interaction._id,
      type: 'coach',
      text: response.interaction.coachResponse
    }]);
  };
}
```

---

## Headers Sent with Every Request

```javascript
{
  "Content-Type": "application/json",
  "x-user-email": "testuser@example.com"  // From hook
}
```

**Important**: All requests include `x-user-email` header automatically

---

## Response Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | ✅ Success | Use response data |
| 400 | ❌ Bad Request | Check request format |
| 404 | ❌ Not Found | Transcript/interaction doesn't exist |
| 500 | ❌ Server Error | Show user error, can retry |

---

## Common Error Messages

```javascript
// Network error
"Error: Failed to fetch"
// Action: Check server running, IP correct

// Invalid transcriptId
"404 Transcript not found"
// Action: Verify transcript exists, use correct ID

// Server error
"500 Internal server error"
// Action: Check server logs, retry later

// Missing required field
"400 Missing required field: question"
// Action: Provide all required parameters
```

---

## State Management Pattern

```javascript
// Initialize hook
const { askCoach, getCoachHistory, askCoachFollowup } = useTranscriptAPI();

// States needed
const [messages, setMessages] = useState([]);
const [currentInteractionId, setCurrentInteractionId] = useState(null);
const [isLoading, setIsLoading] = useState(false);

// Send message pattern
const sendMessage = async (text) => {
  setIsLoading(true);
  try {
    // Make API call
    const response = currentInteractionId
      ? await askCoachFollowup(currentInteractionId, text)
      : await askCoach(text, level, 'transcript', transcriptId);
    
    // Add to messages
    setMessages(prev => [...prev, {
      type: 'coach',
      text: response.interaction.coachResponse
    }]);
    
    // Update interaction ID
    setCurrentInteractionId(response.interaction._id);
  } catch (err) {
    // Handle error
    setMessages(prev => [...prev, {
      type: 'error',
      text: err.message
    }]);
  } finally {
    setIsLoading(false);
  }
};
```

---

## Navigation Between Screens

### From TranscriptViewer to Coach

```javascript
navigation.navigate('AgenticCoach', {
  transcriptId: '507f1f77...',
  sessionName: 'Introduction to Algorithms',
  transcript: 'Full transcript text...'
})
```

### Back from Coach to Transcript

```javascript
navigation.goBack()
```

---

## Testing Each Function

### Test askCoach

```javascript
// In your component or test
const result = await askCoach(
  "What is the main topic?",
  3,
  "transcript",
  "507f1f77bcf86cd799439011"
);

console.log('Response:', result.interaction);
// Check: Has _id, userQuestion, coachResponse
```

### Test askCoachFollowup

```javascript
const result = await askCoachFollowup(
  "507f1f77bcf86cd799439012",
  "Can you explain more?"
);

console.log('Follow-up response:', result.interaction);
// Check: Same _id, different question/response
```

### Test getCoachHistory

```javascript
const history = await getCoachHistory();

console.log('History:', history.interactions);
// Check: Array of interactions, in order
```

### Test generateSummary

```javascript
const summary = await generateSummary(
  "507f1f77bcf86cd799439011",
  "quick"
);

console.log('Summary:', summary);
// Check: Returns string with summary
```

---

## Debug Checklist

When something isn't working:

- [ ] Server IP correct in `useTranscriptAPI.js`?
- [ ] User email set correctly?
- [ ] Server running (`node server.js`)?
- [ ] MongoDB connected?
- [ ] Check console.log output for API calls
- [ ] Check Network tab for request/response
- [ ] Verify transcriptId is valid UUID
- [ ] Verify response format matches expected
- [ ] Check server logs for incoming requests
- [ ] Try endpoint in Thunder Client first

---

## Quick Copy-Paste Code

### Coach Screen Setup

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import useTranscriptAPI from '../hooks/useTranscriptAPI';

export default function CoachScreen({ route }) {
  const { transcriptId, sessionName } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentId, setCurrentId] = useState(null);
  const { askCoach, askCoachFollowup, getCoachHistory } = useTranscriptAPI();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await getCoachHistory();
    if (history.interactions?.length > 0) {
      setCurrentId(history.interactions[0]._id);
    }
  };

  const send = async () => {
    const response = currentId
      ? await askCoachFollowup(currentId, input)
      : await askCoach(input, 3, 'transcript', transcriptId);
    
    setMessages(m => [...m, {
      type: 'user',
      text: input
    }, {
      type: 'coach',
      text: response.interaction.coachResponse
    }]);
    setCurrentId(response.interaction._id);
    setInput('');
  };

  return (
    <View>
      <ScrollView>
        {messages.map((msg, i) => (
          <Text key={i}>{msg.type}: {msg.text}</Text>
        ))}
      </ScrollView>
      <TextInput value={input} onChangeText={setInput} />
      <TouchableOpacity onPress={send}>
        <Text>Send</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Import Statement

```javascript
// Always use this import
import useTranscriptAPI from '../hooks/useTranscriptAPI';

// Then in component:
const {
  askCoach,
  askCoachFollowup,
  getCoachHistory,
  generateSummary,
  createTranscript,
  isLoading,
} = useTranscriptAPI();
```

---

**Quick Reference Ready** ✅  
**All functions documented** ✅  
**Ready to use** ✅
