# Navigation Setup - Captured Books Feature

## 🗺️ Final Navigation Structure

```
App Home/Root Navigator
  ↓
┌──────────────────────────────────────────────────────┐
│  CapturedBooksLibraryScreen (Main)                   │
│  • Shows list of captured books                      │
│  • Header with [📷 Capture] + [🔍 Filter] buttons   │
│  • Click book → BookDetailScreen                     │
│  • [📷 Capture] button → BookCameraScreen            │
└──────────────────────────────────────────────────────┘
         │                          │
         │ Capture Button          │ Click Book
         ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│ BookCameraScreen │    │ BookDetailScreen     │
│ • Back camera    │    │ • Read extracted text│
│ • Capture pages  │    │ • Play/Pause TTS     │
│ • Show counter   │    │ • Navigate paragraphs│
│ • Process button │    │ • Reading modes      │
└──────────────────┘    └──────────────────────┘
         │
         │ Process Button
         ▼
┌──────────────────────────────┐
│ BookProcessingScreen         │
│ • Upload progress (X of Y)   │
│ • Azure Vision processing    │
│ • Auto-navigate on success   │
└──────────────────────────────┘
         │
         │ Auto-navigate (success)
         ▼
    BookDetailScreen
```

---

## 📋 Required Navigation Routes

Add these routes to your Stack.Navigator:

```javascript
import BookCameraScreen from './src/screens/BookCameraScreen';
import BookProcessingScreen from './src/screens/BookProcessingScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';
import CapturedBooksLibraryScreen from './src/screens/CapturedBooksLibraryScreen';

// In your navigation setup:
<Stack.Navigator screenOptions={{ headerShown: false }}>
  {/* Make this your main home screen */}
  <Stack.Screen 
    name="CapturedBooksLibrary" 
    component={CapturedBooksLibraryScreen}
  />
  
  <Stack.Screen 
    name="BookCamera" 
    component={BookCameraScreen}
  />
  
  <Stack.Screen 
    name="BookProcessing" 
    component={BookProcessingScreen}
  />
  
  <Stack.Screen 
    name="BookDetail" 
    component={BookDetailScreen}
  />
</Stack.Navigator>
```

---

## 🎯 Navigation Flow Explanation

### 1. Initial Load
- App opens → Shows `CapturedBooksLibraryScreen`
- Loads all previously captured books
- Shows list of books with thumbnails

### 2. Capture New Book Path
```
User taps [📷 Capture] button in header
  ↓
navigation.navigate('BookCamera')
  ↓
BookCameraScreen opens with back camera
  ↓
User captures multiple pages, taps [Process]
  ↓
navigation.replace('BookProcessing', {
  images: base64Array,
  title: 'Captured Book'
})
  ↓
BookProcessingScreen shows progress
  ↓
Auto-navigate: navigation.replace('BookDetail', {bookId})
  ↓
BookDetailScreen with reading interface
```

### 3. Open Existing Book Path
```
User sees list of books
  ↓
User taps on a book card
  ↓
handleBookPress(book)
  ↓
navigation.navigate('BookDetail', {bookId: book._id})
  ↓
BookDetailScreen loads and displays the book
```

### 4. Filter Books Path
```
User taps [🔍 Filter] button in header
  ↓
Modal opens with category/language options
  ↓
User selects filter
  ↓
Books list refreshes with filter applied
```

---

## 💻 Implementation in Main App File

Here's how to structure your main navigation:

```javascript
// App.js or Navigation.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CapturedBooksLibraryScreen from './src/screens/CapturedBooksLibraryScreen';
import BookCameraScreen from './src/screens/BookCameraScreen';
import BookProcessingScreen from './src/screens/BookProcessingScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';

const Stack = createNativeStackNavigator();

export const BooksNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      {/* Main home screen showing all books */}
      <Stack.Screen 
        name="CapturedBooksLibrary" 
        component={CapturedBooksLibraryScreen}
        options={{
          gestureEnabled: false, // Prevent back swipe
        }}
      />

      {/* Camera screen for capturing new books */}
      <Stack.Screen 
        name="BookCamera" 
        component={BookCameraScreen}
        options={{
          gestureEnabled: true,
          animationEnabled: true,
        }}
      />

      {/* Processing screen during Azure OCR */}
      <Stack.Screen 
        name="BookProcessing" 
        component={BookProcessingScreen}
        options={{
          gestureEnabled: false, // Prevent back swipe during processing
        }}
      />

      {/* Reading screen */}
      <Stack.Screen 
        name="BookDetail" 
        component={BookDetailScreen}
        options={{
          gestureEnabled: true,
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

// Export your main app
export default function App() {
  return (
    <NavigationContainer>
      <BooksNavigator />
    </NavigationContainer>
  );
}
```

---

## 🔗 Navigation Methods Used

### In CapturedBooksLibraryScreen (Header)
```javascript
// Camera button
<TouchableOpacity 
  onPress={() => navigation.navigate('BookCamera')}
>
  <Icon name="camera" size={20} color="#fff" />
</TouchableOpacity>

// Click on book
const handleBookPress = (book) => {
  navigation.navigate('BookDetail', { bookId: book._id });
};
```

### In BookCameraScreen
```javascript
// Process button navigates to processing screen
navigation.replace('BookProcessing', {
  images: base64Images,
  title: 'Captured Book',
  category: 'Uncategorized',
  tags: [],
});
```

### In BookProcessingScreen
```javascript
// Auto-navigate to detail screen on success
setTimeout(() => {
  navigation.replace('BookDetail', { bookId: newBookId });
}, 2000);
```

### In BookDetailScreen
```javascript
// Back button
<TouchableOpacity onPress={() => navigation.goBack()}>
  <Icon name="arrow-left" size={24} color="#fff" />
</TouchableOpacity>
```

---

## 🎨 Screen Hierarchy

```
CapturedBooksLibraryScreen (HOME)
├── Header
│   ├── Title: "My Captured Books"
│   ├── [📷 Capture] button
│   └── [🔍 Filter] button
│
├── List
│   ├── Book Card 1
│   │   ├── Thumbnail
│   │   ├── Title
│   │   ├── Pages & Confidence
│   │   ├── Progress bar
│   │   └── Delete button
│   │
│   ├── Book Card 2
│   │ ...
│   └── Empty state (if no books)
│
└── Filter Modal
    ├── Category options
    ├── Language options
    └── Clear Filters button
```

---

## 📱 Screen Details

### CapturedBooksLibraryScreen
- **Purpose**: Main home screen showing all captured books
- **Navigation Output**:
  - `navigate('BookCamera')` → Capture new book
  - `navigate('BookDetail', {bookId})` → View existing book
- **Props**: None (navigation-based)

### BookCameraScreen
- **Purpose**: Capture book pages with camera
- **Navigation Input**: None required
- **Navigation Output**:
  - `replace('BookProcessing', {...})` → Process images
  - Can go back to library
- **Props**: Via route.params (optional)

### BookProcessingScreen
- **Purpose**: Process images with Azure Vision
- **Navigation Input**: 
  - `images` - Array of base64 images (REQUIRED)
  - `title`, `category`, `tags` (optional)
- **Navigation Output**:
  - `replace('BookDetail', {bookId})` → View new book
  - Can go back to camera on error
- **On Error**: Show retry button

### BookDetailScreen
- **Purpose**: Read and manage captured books
- **Navigation Input**: 
  - `bookId` - MongoDB book ID (REQUIRED)
- **Navigation Output**:
  - `goBack()` → Return to library
- **Subsequent**: Can edit metadata, update progress

---

## ✅ Configuration Checklist

- [ ] Add all 4 screens to Stack.Navigator
- [ ] Set `headerShown: false` in screen options
- [ ] Update API_BASE URL in BookProcessingScreen
- [ ] Update API_BASE URL in BookDetailScreen
- [ ] Test camera permission handling
- [ ] Test network connectivity checks
- [ ] Test voice commands if enabled
- [ ] Test complete flow: Library → Camera → Processing → Detail

---

## 🚀 Alternative Navigation Structures

### If using Tab Navigator with Books Tab:
```javascript
<Tab.Navigator>
  <Tab.Screen 
    name="Books"
    component={BooksNavigator}
    options={{
      tabBarLabel: 'Books',
      tabBarIcon: ({color}) => <Icon name="book" color={color} />
    }}
  />
  {/* ... other tabs ... */}
</Tab.Navigator>
```

### If using Drawer with Books Item:
```javascript
<Drawer.Navigator>
  <Drawer.Screen 
    name="Books"
    component={BooksNavigator}
  />
  {/* ... other drawer items ... */}
</Drawer.Navigator>
```

---

## 📋 Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Back press on Library | Exit app (gestureEnabled: false) |
| Back press on Camera | Return to Library |
| Back press on Processing | Show error (gestureEnabled: false) |
| Back press on Detail | Return to Library |
| Network offline | Show error, can retry |
| No books in library | Show empty state with "Capture" hint |
| Camera permission denied | Show permission error |
| No camera device | Show error message |

---

## 🎯 User Journey Examples

### Happy Path - New Book
```
1. App opens → CapturedBooksLibraryScreen
2. User taps [📷 Capture]
3. BookCameraScreen → Captures 5 pages
4. Taps [Process]
5. BookProcessingScreen → Uploads & processes
6. Auto-navigates to BookDetailScreen
7. User reads with play/pause
8. Reading progress saved
9. User taps back → CapturedBooksLibraryScreen
10. New book appears in list
```

### Happy Path - Existing Book
```
1. App opens → CapturedBooksLibraryScreen
2. User sees list of previous books
3. Taps on a book
4. BookDetailScreen opens
5. User reads with play/pause
6. Progress saved
7. Taps back → CapturedBooksLibraryScreen
```

### Error Path - Network Failure
```
1. BookCameraScreen
2. Tries to process
3. Network check fails
4. Shows toast: "Cannot process while offline"
5. User can tap back or retry when online
```

---

## 📞 Common Navigation Issues

| Issue | Solution |
|-------|----------|
| Screens not opening | Check screen name matches exactly |
| Back button not working | Ensure using `navigation.goBack()` |
| Infinite loops | Use `replace()` for processing screen |
| Parameters not passing | Check `route.params` is defined |
| Memory leaks | Use `useFocusEffect` cleanup functions |
| Animation stuttering | Reduce animation complexity |

---

**Status**: ✅ Complete navigation structure ready for implementation

All screens properly connected with:
- CapturedBooksLibraryScreen as home
- Camera button at top for quick capture
- Processing screen for Azure handling
- Detail screen for reading
- Full back navigation support

