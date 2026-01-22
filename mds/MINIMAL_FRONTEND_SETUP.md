# Minimal OCR Book Reading Feature - Frontend Setup

## Overview
Completely refactored OCR screens to use ONLY built-in React Native APIs. No external dependencies for state management, voice commands, text-to-speech, or HTTP clients.

## Key Changes Made

### 1. **Removed Dependencies** ❌
- ❌ `react-native-tts` - Removed all TTS functionality
- ❌ `@react-native-voice/voice` - Removed voice command recognition
- ❌ `react-redux` & `redux` - No state management needed
- ❌ `axios` - Using native `fetch` API instead
- ❌ `react-native-linear-gradient` - Using simple white/black theme

### 2. **Installed Dependencies** ✅
Only these libraries are needed:
- ✅ `react-native-vision-camera` - Camera access for photo capture
- ✅ `react-native-reanimated` - Dependency of vision-camera  
- ✅ `react-native-fs` - File system operations
- ✅ `react-native-vector-icons` - Icon components
- ✅ `@react-navigation/*` - Already installed
- ✅ `react-native` core - Built-in APIs

**NO additional libraries needed!**

## Screen Refactoring Details

### BookCameraScreen.js
**Before**: 436 lines with Redux, TTS, Voice, complex debouncing
**After**: 250 lines, minimal, focused

**Changes**:
- Removed: Redux imports, Tts, Voice, custom utilities
- Kept: React Native Camera (vision-camera), Icon, Alert
- API: `RNFS.readFile()` for file operations
- UI Alerts instead of toast notifications
- Simple state: `capturedImages`, `isProcessing`, `canCapture`

**Flow**:
1. User taps "Capture" → `cameraRef.current.takePhoto()`
2. Images stored as file URIs
3. User taps "Process" → Convert to base64 via RNFS
4. Navigate to BookProcessingScreen with base64 array

```javascript
// Simple capture flow
const captureBookPage = async () => {
    const photo = await cameraRef.current.takePhoto();
    setCapturedImages(prev => [...prev, `file://${photo.path}`]);
};

// Simple base64 conversion
const processBook = async () => {
    const base64Images = await Promise.all(
        capturedImages.map(uri => 
            RNFS.readFile(uri.replace('file://', ''), 'base64')
        )
    );
    navigation.replace('BookProcessing', { images: base64Images });
};
```

### BookProcessingScreen.js
**Before**: 321 lines with axios, Redux, TTS, progress tracking
**After**: 180 lines, fetch API based

**Changes**:
- Replaced `axios` with native `fetch` API
- Removed Redux token management (no auth header)
- Removed TTS announcements
- Simplified progress: Just progress counter, no time estimation
- UI: White background, simple progress bar

**Flow**:
1. Receive base64 images from BookCameraScreen
2. POST to `/api/books/captured/scan` with FormData
3. Show progress counter
4. On success → Navigate to BookDetailScreen with bookId
5. On error → Show error message + retry button

```javascript
// Simple fetch-based upload
const uploadAndProcessImages = async () => {
    const formData = new FormData();
    images.forEach((img, idx) => {
        formData.append('images', {
            uri: `data:image/jpeg;base64,${img.data}`,
            type: 'image/jpeg',
            name: `page_${idx + 1}.jpg`,
        });
    });
    
    const response = await fetch(`${API_BASE}/books/captured/scan`, {
        method: 'POST',
        body: formData,
    });
};
```

### BookDetailScreen.js
**Before**: 679 lines with useRead hook, Redux, TTS, multiple reading modes, modals
**After**: 260 lines, simple paragraph navigation

**Changes**:
- Removed: Redux, TTS, useRead hook, multiple reading modes, metadata modal
- Kept: Simple paragraph navigation, play/pause button, reading mode toggle
- Convert 3D text array to 2D (flatten pages into paragraphs)
- White background with simple controls

**Flow**:
1. Fetch book details from `/api/books/captured/:bookId`
2. Convert textArray3D → textArray2D
3. Display current paragraph
4. Navigation: Previous/Next paragraph buttons
5. Mode toggle: Normal/Highlight reading mode
6. Play button: Just toggles `isSpeaking` state (no actual TTS)

```javascript
// Simple paragraph navigation
const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);

const moveNext = () => {
    if (currentParagraphIndex < totalParagraphs - 1) {
        setCurrentParagraphIndex(currentParagraphIndex + 1);
    }
};

const movePrevious = () => {
    if (currentParagraphIndex > 0) {
        setCurrentParagraphIndex(currentParagraphIndex - 1);
    }
};
```

### CapturedBooksLibraryScreen.js
**Before**: 506 lines with axios, Redux, TTS, filter modal, refresh control
**After**: 280 lines, fetch API based

**Changes**:
- Replaced axios with fetch API
- Removed Redux token usage
- Removed TTS announcements
- Removed filter modal (simple list only)
- Removed RefreshControl
- Simple FlatList showing all books

**Flow**:
1. Fetch books: `GET /api/books/captured`
2. Display in FlatList
3. Delete: `DELETE /api/books/captured/:bookId`
4. Open: Navigate to BookDetailScreen

## Navigation Flow (Unchanged)

```
Home Screen
    ↓ "Read a Book" button
CapturedBooksLibrary
    ↓ "📷 Camera" button in header
BookCameraScreen (capture pages)
    ↓ "Process" button
BookProcessingScreen (Azure processing)
    ↓ Auto-navigate on success
BookDetailScreen (read with navigation)
```

## API Endpoints Used

All endpoints should return JSON with `{ success: boolean, data: {...} }` structure:

1. **POST** `/api/books/captured/scan`
   - Input: FormData with images array
   - Output: `{ bookId, totalPages, averageConfidence }`

2. **GET** `/api/books/captured`
   - Output: `{ books: [{_id, title, totalPages, ...}] }`

3. **GET** `/api/books/captured/:bookId`
   - Output: `{ title, category, textArray3D[page][para][sentence], ...}`

4. **DELETE** `/api/books/captured/:bookId`
   - Output: Success confirmation

5. **PUT** `/api/books/captured/:bookId/progress` (optional)
   - Input: `{ progress: 0-100 }`

## No External Dependencies Needed

✅ **That's it!** No Redux, TTS, Voice Commands, or extra HTTP libraries.

Just pure React Native + Camera + File System + Icons + Navigation.

## Theme

All screens use **Black & White** theme:
- Backgrounds: #fff (white) or #1a1a1a (dark gray)
- Text: #000 (black) or #fff (white)
- Buttons: #333 (dark) or #fff (white)
- No gradients, no colors

## Testing

1. Install app with only required dependencies
2. Test navigation flow: Home → Library → Camera → Processing → Reading
3. Test image capture and base64 conversion
4. Test paragraph navigation
5. Test delete book functionality
6. Verify no Redux warnings or missing TTS errors

## Notes

- No authentication/authorization (remove Bearer token from API calls if not needed)
- Images are converted to base64 on device before upload
- All errors shown via `Alert.alert()` instead of custom toasts
- No progress time estimation (just counter)
- Simple UI, no modals for settings/metadata editing
- Read mode is just UI toggle, no actual text-to-speech
