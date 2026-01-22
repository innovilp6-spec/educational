# Book Capture Flow - Complete Implementation

## 📱 Complete Navigation Flow

```
┌─────────────────────────────────────────────────────────┐
│         CAPTURED BOOKS - COMPLETE USER FLOW              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User Home                                              │
│      ↓                                                   │
│  [+ Capture New Book]                                   │
│      ↓                                                   │
│  ┌──────────────────────────────────────────────┐      │
│  │  BookCameraScreen                            │      │
│  │  • Use back camera                           │      │
│  │  • Capture multiple pages                    │      │
│  │  • Show page counter                         │      │
│  │  • Voice commands support                    │      │
│  │  Buttons:                                    │      │
│  │  - [Capture] → Add page to list             │      │
│  │  - [Clear] → Reset captures                 │      │
│  │  - [Process] → Convert & upload             │      │
│  └──────────────────────────────────────────────┘      │
│            ↓                                             │
│  ┌──────────────────────────────────────────────┐      │
│  │  BookProcessingScreen                        │      │
│  │  • Show upload progress (X of Y pages)      │      │
│  │  • Estimated time remaining                 │      │
│  │  • Call backend /scan endpoint              │      │
│  │  • Azure Vision processes OCR               │      │
│  │  • Auto-navigate on success                 │      │
│  │  • Error handling with retry                │      │
│  └──────────────────────────────────────────────┘      │
│            ↓ (auto-navigate on success)                 │
│  ┌──────────────────────────────────────────────┐      │
│  │  BookDetailScreen                            │      │
│  │  • Load extracted text (3D array)           │      │
│  │  • Convert 3D→2D for useRead hook           │      │
│  │  • Play/Pause with TTS                      │      │
│  │  • Navigate paragraphs (next/previous)      │      │
│  │  • 3 reading modes                          │      │
│  │  • Track progress                           │      │
│  │  • Edit metadata                            │      │
│  └──────────────────────────────────────────────┘      │
│                                                           │
│  OR                                                      │
│                                                           │
│  ┌──────────────────────────────────────────────┐      │
│  │  CapturedBooksLibraryScreen                  │      │
│  │  • View all previously captured books       │      │
│  │  • Filter by category/language              │      │
│  │  • Click to open in BookDetailScreen        │      │
│  │  • Delete books                             │      │
│  │  • Pull-to-refresh                          │      │
│  └──────────────────────────────────────────────┘      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Files Created

### 1. BookCameraScreen.js (437 lines)
**Location**: `src/screens/BookCameraScreen.js`

**Purpose**: Capture multiple book pages with the device camera

**Key Features**:
- Uses `react-native-vision-camera` for back camera
- Capture button → takes photo, converts to file URI, stores in state
- Process button → converts all images to base64, navigates to BookProcessingScreen
- Clear button → resets captures
- Page counter showing how many pages captured
- Voice commands: "capture", "process", "clear"
- Network connectivity check before capture/process
- Visual feedback with icons and status text
- Disabled state management

**State**:
```javascript
capturedImages     // Array of file URIs for captured images
isProcessing       // Boolean - processing in progress
canCapture         // Boolean - can take photo
```

**Navigation**:
```javascript
// From home → BookCameraScreen
navigation.navigate('BookCamera')

// From BookCameraScreen → BookProcessingScreen
navigation.replace('BookProcessing', {
  images: base64Images,
  title: 'Captured Book',
  category: 'Uncategorized',
  tags: [],
})
```

**UI Layout**:
```
┌─────────────────────────────┐
│                             │
│     CAMERA VIEW (78%)       │
│                             │
│  "Capture Book Pages"       │
│  "X pages captured"         │
│                             │
└─────────────────────────────┘
┌─────────────────────────────┐
│  📷 X pages  🗑 Clear      │ (Info row)
│                             │
│  [📷 Capture] [▶ Process]  │ (Buttons row)
│                             │
│  "Tap Capture to take..."   │ (Help text)
└─────────────────────────────┘
```

---

## 🔄 Data Flow

### Image Capture & Conversion

```
1. User taps [Capture]
   ↓
   CameraScreen.takePhoto()
   ↓
   cameraRef.current.takePhoto({
     quality: 0.7,
     flash: 'off',
     ...
   })
   ↓
   photo.path → file:///path/to/image.jpg
   ↓
   Add to capturedImages array
   ↓
   Show page counter: "1 pages captured"

2. User taps [Process]
   ↓
   processImagesForBook(capturedImages)
   ↓
   For each image:
     - Read file using RNFS
     - Convert to base64
     - Compress if needed
     - Return {data: base64String}
   ↓
   Array of base64 objects
   ↓
   Navigate to BookProcessingScreen with:
     {
       images: [{data: base64}, ...],
       title: 'Captured Book',
       category: 'Uncategorized',
       tags: []
     }

3. BookProcessingScreen
   ↓
   POST /api/books/captured/scan
   ↓
   Backend processes with Azure Vision
   ↓
   Returns: { bookId, textArray3D, ... }
   ↓
   Auto-navigate to BookDetailScreen

4. BookDetailScreen
   ↓
   Load book data
   ↓
   Convert textArray3D → 2D
   ↓
   Initialize useRead hook
   ↓
   Display with play/pause controls
```

---

## 🎮 User Interactions

### Capture Screen Actions

| Action | Result | State Change |
|--------|--------|--------------|
| Tap Capture | Take photo, store URI | Add to capturedImages |
| Tap Clear | Reset all captures | capturedImages = [] |
| Tap Process | Convert & upload | Navigate to Processing |
| Say "capture" | Same as tap | Voice command |
| Say "process" | Same as tap | Voice command |
| Say "clear" | Same as tap | Voice command |

### Processing Screen Actions

| Status | Display | Button State |
|--------|---------|--------------|
| Processing | "2 of 5 pages" | Disabled |
| Error | "Error: Connection failed" | Retry enabled |
| Success | Auto-navigate | N/A |

### Reading Screen Actions

| Action | Result |
|--------|--------|
| Play | Start TTS, speak current sentence |
| Pause | Stop TTS, keep position |
| Next | Move to next paragraph, update progress |
| Previous | Move to previous paragraph |
| Settings | Show reading mode options |
| Edit | Modify title/notes |

---

## 📡 API Integration

### POST /api/books/captured/scan

**Request**:
```javascript
{
  images: [
    { data: "base64string1" },
    { data: "base64string2" },
    { data: "base64string3" }
  ],
  title: "Captured Book",
  category: "Uncategorized",
  tags: []
}
```

**Response**:
```javascript
{
  success: true,
  data: {
    bookId: "507f1f77bcf86cd799439011",
    title: "Captured Book",
    totalPages: 3,
    textArray3D: [
      [
        ["Sentence 1.", "Sentence 2."],
        ["Sentence 3.", "Sentence 4."]
      ],
      // ... more pages
    ],
    averageConfidence: 94.5,
    thumbnail: "data:image/jpeg;base64,..."
  }
}
```

---

## 🔧 Setup Instructions

### 1. Add Navigation Routes

```javascript
// In your navigation configuration
import BookCameraScreen from './src/screens/BookCameraScreen';
import BookProcessingScreen from './src/screens/BookProcessingScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';
import CapturedBooksLibraryScreen from './src/screens/CapturedBooksLibraryScreen';

<Stack.Navigator>
  {/* ... existing screens ... */}
  
  <Stack.Screen 
    name="BookCamera" 
    component={BookCameraScreen}
    options={{ headerShown: false }}
  />
  <Stack.Screen 
    name="BookProcessing" 
    component={BookProcessingScreen}
    options={{ headerShown: false }}
  />
  <Stack.Screen 
    name="BookDetail" 
    component={BookDetailScreen}
    options={{ headerShown: false }}
  />
  <Stack.Screen 
    name="CapturedBooksLibrary" 
    component={CapturedBooksLibraryScreen}
    options={{ headerShown: false }}
  />
</Stack.Navigator>
```

### 2. Update API Base URL

In `BookProcessingScreen.js` and `BookDetailScreen.js`:
```javascript
const API_BASE = 'http://192.168.1.100:5000/api'; // Your server URL
```

### 3. Add Start Button (from Home)

```javascript
<TouchableOpacity 
  onPress={() => navigation.navigate('BookCamera')}
  style={styles.captureButton}
>
  <Icon name="camera" size={24} color="#fff" />
  <Text>Capture New Book</Text>
</TouchableOpacity>
```

### 4. Add Library Button (from Home)

```javascript
<TouchableOpacity 
  onPress={() => navigation.navigate('CapturedBooksLibrary')}
  style={styles.libraryButton}
>
  <Icon name="book" size={24} color="#fff" />
  <Text>My Books</Text>
</TouchableOpacity>
```

---

## 🔍 Screen-by-Screen Details

### BookCameraScreen

**Props**: None (navigation-based)

**State Management**:
- `capturedImages`: Array of file URIs
- `isProcessing`: Upload in progress flag
- `canCapture`: Can take another photo flag

**Key Methods**:
- `captureBookPage()`: Take photo with camera
- `processBook()`: Convert images to base64 and navigate
- `clearCaptures()`: Reset captured images
- `onRecordVoice()`: Start voice recognition
- `onSpeechResults()`: Handle voice commands
- `onSpeechError()`: Handle voice errors

**Dependencies**:
- `react-native-vision-camera`
- `react-native-voice`
- `react-native-tts`
- `imageProcessing.js` utilities
- Redux (voiceCommands state)

---

### BookProcessingScreen

**Props** (via route.params):
```javascript
{
  images: Array<{data: base64String}>, // REQUIRED
  title: String,                        // Optional
  category: String,                     // Optional
  tags: Array<String>                  // Optional
}
```

**Workflow**:
1. Receives image array from BookCameraScreen
2. POSTs to `/api/books/captured/scan`
3. Shows progress as images upload
4. On success: Auto-navigates to BookDetailScreen
5. On error: Shows retry button

---

### BookDetailScreen

**Props** (via route.params):
```javascript
{
  bookId: String  // REQUIRED - MongoDB book ID
}
```

**Workflow**:
1. Fetches book from `/api/books/captured/:bookId`
2. Receives textArray3D structure
3. Converts 3D→2D for useRead hook
4. Initializes useRead with 2D matrix
5. Manages reading state and TTS
6. Updates progress on navigation

---

### CapturedBooksLibraryScreen

**Props**: None

**Workflow**:
1. Fetches books from `/api/books/captured`
2. Shows list with thumbnails
3. Filter by category/language
4. Click to open BookDetailScreen
5. Delete books

---

## 💾 File Structure

```
educational074/
└── src/
    ├── screens/
    │   ├── BookCameraScreen.js        ✅ NEW - Capture pages
    │   ├── BookProcessingScreen.js    ✅ NEW - Azure processing
    │   ├── BookDetailScreen.js        ✅ NEW - Reading interface
    │   └── CapturedBooksLibraryScreen.js ✅ NEW - Book listing
    │
    ├── utils/
    │   ├── imageProcessing.js         ✅ NEW - Base64 utilities
    │   ├── connectivity.js            ✅ EXISTING
    │   ├── utility.js                 ✅ EXISTING (debounceFn)
    │   ├── toasts.js                  ✅ EXISTING (showToastInfo)
    │   └── ttsConfig.js               ✅ EXISTING (initTTS)
    │
    └── hooks/
        └── useRead.js                  ✅ EXISTING - Reading state
```

---

## ✅ Testing Checklist

- [ ] Camera permission granted
- [ ] Capture button takes photo
- [ ] Page counter increments
- [ ] Clear button resets captures
- [ ] Process button disabled when no captures
- [ ] Voice commands work ("capture", "process", "clear")
- [ ] Network check prevents offline operations
- [ ] Images convert to base64 correctly
- [ ] Processing screen shows progress
- [ ] Auto-navigation to detail screen works
- [ ] Detail screen loads book content
- [ ] useRead hook initializes with 2D array
- [ ] Play/pause buttons work
- [ ] Navigation (next/previous) works
- [ ] Progress updates on backend
- [ ] Reading modes change display

---

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Camera not showing | Permission not granted | Request camera permission |
| Images not converting | RNFS not installed | Ensure react-native-fs installed |
| Processing hangs | Server not responding | Check API_BASE URL |
| No voice feedback | TTS not initialized | Verify initTTS() called |
| Navigation fails | Screen name mismatch | Check Stack.Navigator names |

---

## 🎓 Key Concepts

### 3D to 2D Conversion
Backend returns pages→paragraphs→sentences, frontend flattens to paragraphs→sentences for useRead hook.

### Base64 Images
All images converted on frontend before sending to backend (no file uploads).

### Progress Tracking
As user reads (navigates paragraphs), progress updates as percentage.

### Voice Commands
When voiceCommands enabled in Redux, speak actions trigger corresponding functions.

### TTS Integration
useRead hook manages TTS internally, screen just calls play/pause/next/previous.

---

**Status**: ✅ **COMPLETE AND READY TO USE**

All four screens properly integrated to handle: capture → process → read workflow.

