# React Native Screen Workflow - Visual Guide

## Complete Lecture-to-Coach Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          HOME SCREEN                               │
│  [Lecture Capture] [Study Library] [Recordings] [Books] [More]     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ Press "Lecture Capture"
                       ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    LECTURE CAPTURE SCREEN                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Recording in progress...                          00:15     │   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  47%       │   │
│  │  Transcribed so far:                                         │   │
│  │  "This is the first chunk of the lecture..."               │   │
│  │  "Here is the second chunk about algorithms..."            │   │
│  │  "In this part we discuss complexity analysis..."          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Pause]  [Stop Recording]                                          │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ Press "Stop Recording"
                               ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    TRANSCRIBING SCREEN                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Processing master transcript...                             │   │
│  │  ⏳ Cleaning and organizing text...                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ Processing complete
                               ↓
┌──────────────────────────────────────────────────────────────────────┐
│                   NAME SESSION SCREEN                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Enter session name:                                         │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │ Introduction to Algorithms - Lecture 5   X           │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Cancel]  [Save]                                                   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ Press "Save"
                               ↓
┌──────────────────────────────────────────────────────────────────────┐
│                TRANSCRIPT VIEWER SCREEN (UPDATED)                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Introduction to Algorithms - Lecture 5                       │   │
│  │ [Transcript] [Quick Summary] [Detailed Summary]               │   │
│  │                                                              │   │
│  │ Full Transcript:                                             │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ This is the first chunk of the lecture about         │   │   │
│  │ │ algorithms and data structures. We cover...          │   │   │
│  │ │                                                      │   │   │
│  │ │ Here is the second chunk discussing sorting...       │   │   │
│  │ │                                                      │   │   │
│  │ │ In this part we analyze time complexity...          │   │   │
│  │ │                                                      │   │   │
│  │ │ [SCROLL DOWN FOR MORE]                              │   │   │
│  │ └────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [Study with Coach]          ← NEW BUTTON                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ Press "Study with Coach"
                               ↓
┌──────────────────────────────────────────────────────────────────────┐
│          AGENTIC COACH SCREEN (NEW - CONVERSATIONAL UI)             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Agentic Coach              [Clear]                           │   │
│  │ Intro to Algorithms - Lecture 5                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Start Learning!                                              │   │
│  │                                                              │   │
│  │ Ask the coach any questions about the lecture.              │   │
│  │ The coach will provide context-aware responses.             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                   ↑ EMPTY STATE      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Simplification Level                                         │   │
│  │ [1] [2] [3]✓ [4] [5]                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ Ask a question...                          X          │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  │ [Send]                                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ User types: "What are the main concepts?"
                               │ Press "Send"
                               ↓
┌──────────────────────────────────────────────────────────────────────┐
│          AGENTIC COACH SCREEN (WITH MESSAGE HISTORY)                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Agentic Coach              [Clear]                           │   │
│  │ Intro to Algorithms - Lecture 5                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │                    ┌─────────────────────┐                  │   │
│  │                    │ What are the main   │                  │   │
│  │                    │ concepts?           │ ← USER (blue)    │   │
│  │                    └─────────────────────┘                  │   │
│  │                                                              │   │
│  │  ┌────────────────────────────────────────────┐             │   │
│  │  │ Based on the lecture, the main concepts   │ ← COACH     │   │
│  │  │ covered are:                              │   (white)    │   │
│  │  │                                            │             │   │
│  │  │ 1. Sorting algorithms (quicksort,          │             │   │
│  │  │    mergesort)                              │             │   │
│  │  │                                            │             │   │
│  │  │ 2. Time complexity analysis (Big O)        │             │   │
│  │  │                                            │             │   │
│  │  │ 3. Data structure fundamentals             │             │   │
│  │  │                                            │             │   │
│  │  │ These are critical for interview prep.     │             │   │
│  │  └────────────────────────────────────────────┘             │   │
│  │                                                              │   │
│  │              ┌──────────────────────────┐                   │   │
│  │              │ Can you explain more     │                   │   │
│  │              │ about quicksort?         │ ← FOLLOW-UP (blue)│   │
│  │              └──────────────────────────┘                   │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────┐            │   │
│  │  │ Sure! Quicksort is a divide-and-conquer     │            │   │
│  │  │ algorithm that works by:                    │            │   │
│  │  │                                              │            │   │
│  │  │ 1. Selecting a pivot element                │            │   │
│  │  │ 2. Partitioning around the pivot            │            │   │
│  │  │ 3. Recursively sorting sub-arrays           │            │   │
│  │  │                                              │            │   │
│  │  │ Time complexity: O(n log n) average case    │            │   │
│  │  │                                              │            │   │
│  │  │ [SCROLL UP FOR MORE]                        │            │   │
│  │  └──────────────────────────────────────────────┘            │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Simplification Level                                         │   │
│  │ [1] [2] [3]✓ [4] [5]                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ What about space complexity?         X               │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  │ [Send]                                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ Conversation continues...
                               │ User can:
                               │ - Change simplification level
                               │ - Ask more follow-ups
                               │ - Go back to transcript
                               │ - Clear conversation
                               ↓
```

---

## Transcript Viewer Screen - Summary View

```
┌──────────────────────────────────────────────────────────────────────┐
│                TRANSCRIPT VIEWER SCREEN - SUMMARY TAB                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Introduction to Algorithms - Lecture 5                       │   │
│  │ [Transcript] [Quick Summary]✓ [Detailed Summary]             │   │
│  │                                                              │   │
│  │ Quick Summary:                                               │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ ⏳ Generating summary...                                │   │   │
│  │ │                                                        │   │   │
│  │ │ [LOADING SPINNER]                                     │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Then updates to:]                                                 │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Quick Summary:                                             │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ This lecture introduces fundamental sorting            │   │   │
│  │ │ algorithms including quicksort and mergesort.          │   │   │
│  │ │ Key topics:                                             │   │   │
│  │ │ - Time/space complexity analysis                       │   │   │
│  │ │ - Divide-and-conquer approach                          │   │   │
│  │ │ - Practical applications in interviews                 │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Study with Coach]                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## API Flow Diagrams

### First Question Flow

```
User Types Question → Presses Send
            ↓
   [Ask Coach with Context]
            ↓
    POST /api/coach/agentic/ask
    {
      question: "...",
      simplificationLevel: 3,
      contextType: "transcript",
      contextId: "507f1f77bcf86cd799439011"
    }
            ↓
   [Backend Processes]
   - Gets transcript context
   - Gathers user study history
   - Builds context-aware prompt
   - Calls Azure OpenAI
   - Stores interaction
            ↓
    Response with interactionId
    {
      interaction: {
        _id: "507f1f77bcf86cd799439012",
        userQuestion: "...",
        coachResponse: "Based on the lecture...",
        createdAt: "..."
      }
    }
            ↓
   [Frontend]
   - Display in message bubble
   - Store interactionId
   - Enable follow-up
            ↓
   Coach Response Displayed in Chat
```

### Follow-up Question Flow

```
User Types Follow-up → Presses Send
            ↓
   [Ask Coach Follow-up]
            ↓
    POST /api/coach/agentic/{interactionId}/followup
    {
      followupQuestion: "Can you explain further?"
    }
            ↓
   [Backend Processes]
   - Looks up previous interaction
   - Maintains conversation context
   - Includes previous Q&A
   - Calls Azure OpenAI
   - Updates interaction
            ↓
    Response (same interactionId)
    {
      interaction: {
        _id: "507f1f77bcf86cd799439012",
        userQuestion: "Can you explain further?",
        coachResponse: "Sure! Let me break it down...",
        createdAt: "..."
      }
    }
            ↓
   [Frontend]
   - Display in message bubble
   - Same interactionId for next follow-up
   - Conversation continues
            ↓
   Follow-up Response Displayed
```

### History Load Flow

```
Mount AgenticCoachScreen
            ↓
   useEffect calls getCoachHistory()
            ↓
    GET /api/coach/agentic/history
            ↓
   [Backend Queries]
   - Find all interactions for user
   - Sort by date (oldest first)
   - Return interactions
            ↓
    Response
    {
      interactions: [
        {
          _id: "507f1f77bcf86cd799439012",
          userQuestion: "What are concepts?",
          coachResponse: "Based on...",
          createdAt: "..."
        },
        {
          _id: "507f1f77bcf86cd799439013",
          userQuestion: "Explain further?",
          coachResponse: "Sure!...",
          createdAt: "..."
        }
      ]
    }
            ↓
   [Frontend Processes]
   - Convert interactions to messages
   - Display all messages
   - Get last interactionId
   - Ready for follow-up
            ↓
   Conversation History Displayed
```

---

## Component Communication

```
┌─────────────────────────────────────────────────────────┐
│                  AppNavigator.js                        │
│  (Stack Navigator with all screens)                     │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ↓              ↓              ↓
TranscriptViewer  ...other    AgenticCoach
Screen         screens        Screen
    │                              │
    │ Pass params:                 │
    │ - transcriptId              │ Uses API hook:
    │ - sessionName               │ - askCoach()
    │ - transcript                │ - askCoachFollowup()
    │                             │ - getCoachHistory()
    ↓                             ↓
    │  navigation.navigate()      │
    │     ('AgenticCoach', {...}) │
    └─────────────────────────────┘
                   ↓
         useTranscriptAPI Hook
         (Shared across screens)
         - makeServerRequest()
         - askCoach()
         - askCoachFollowup()
         - getCoachHistory()
                   ↓
         HTTP Requests to Server
         (backend endpoints)
```

---

## State Management in CoachScreen

```
┌─────────────────────────────────────────────────────────┐
│            AgenticCoachScreen State                     │
├─────────────────────────────────────────────────────────┤
│ messages: [                                             │
│   { id, type: 'user', text, timestamp },               │
│   { id, type: 'coach', text, timestamp },              │
│   { id, type: 'error', text, timestamp }               │
│ ]                                                       │
│                                                         │
│ userInput: "What is..."          ← Current input        │
│                                                         │
│ isLoading: false|true            ← API call in progress │
│                                                         │
│ simplificationLevel: 1-5          ← User preference     │
│                                                         │
│ isLoadingHistory: true|false      ← Initial load       │
│                                                         │
│ currentInteractionId: "507f..."   ← For follow-ups     │
└─────────────────────────────────────────────────────────┘
            │
            ├→ Render messages list
            ├→ Disable input while loading
            ├→ Show loading spinner
            ├→ Render simplification selector
            ├→ Handle errors in chat
            └→ Auto-scroll to latest
```

---

## Error Scenarios Handled

```
┌─────────────────────────────────────────────────────────┐
│            Error Handling in Coach Screen               │
├─────────────────────────────────────────────────────────┤
│ Network Error:                                          │
│   → Show red error bubble: "Failed to connect..."       │
│   → Alert pop-up                                        │
│   → User can retry                                      │
│                                                         │
│ Server Error (500):                                     │
│   → Show red error bubble: "Server error occurred..."   │
│   → Alert pop-up                                        │
│   → User can retry                                      │
│                                                         │
│ Missing Context:                                        │
│   → Show error: "Unable to generate response..."        │
│   → Alert: Check connection                             │
│                                                         │
│ Invalid Interaction ID:                                 │
│   → Treat as new question                              │
│   → Send as askCoach() not follow-up                   │
│                                                         │
│ History Load Failure:                                   │
│   → Start with empty messages                           │
│   → Show empty state                                    │
│   → User can ask first question                        │
└─────────────────────────────────────────────────────────┘
```

---

**Visual Guide Complete** ✅  
**All workflows documented** ✅  
**Ready for implementation** ✅
