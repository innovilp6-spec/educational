# Markdown Preview & Export Feature - Implementation

## Overview

Added markdown preview and text export functionality to the Agentic Notes feature. Users can now:
- View formatted note content with metadata
- See note structure with headers and formatting
- Export notes as formatted text files (.txt)
- Share exported notes via system share dialog

## Changes Made

### 1. **AgenticNotesScreen.jsx** - Enhanced with Preview & Export

#### New Imports
```javascript
import RNFS from 'react-native-fs';
import { Share } from 'react-native';
```

#### New Function: `exportNoteAsText()`
Exports the current note with:
- Title and metadata (standard, chapter, topic, version, created date)
- Full note content
- Conversation history showing all changes
- Formatted as structured text with markdown-like structure
- Uses RNFS to write to device filesystem
- Opens system share dialog for sending via email, messaging, etc.

**Export Format:**
```
# Note Title

**Standard:** 10
**Chapter:** Chapter 1
**Topic:** Photosynthesis
**Version:** 3
**Created:** 1/10/2026, 10:30:00 AM

---

## Content

[Full note content here]

---

## Conversation History

### Change 1
**Type:** initial-prompt
**Instruction:** Create notes on photosynthesis
**Date:** 1/10/2026, 10:25:00 AM

### Change 2
**Type:** append
**Instruction:** Add examples
**Date:** 1/10/2026, 10:27:00 AM

### Change 3
**Type:** edit
**Instruction:** Simplify it
**Date:** 1/10/2026, 10:29:00 AM
```

#### Updated Header Section
- Added "Export" button (green, right side)
- Replaced "Save" checkmark with export button
- Export button disabled while processing

#### Enhanced Note Content Display
- **Section Title:** "📖 Note Content" with emoji
- **Metadata Box:** Shows standard, chapter, topic, and version in organized rows
- **Better Typography:**
  - Larger font size (14px instead of 12px)
  - Better line height (22 instead of 18)
  - Darker color (#333 instead of #555)
  - Regular weight for readability
- **Visual Separator:** Divider line between metadata and content
- **Scrollable Preview:** Can scroll within the preview box independently

#### Updated Conversation Section
- **Section Title:** "💬 Conversation History" with emoji
- Same message bubble styling as before

### 2. **New Styles Added**

```javascript
headerButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
}

exportButton: {
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
}

exportButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
}

sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
}

noteMetadata: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
}

metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
}

metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
}

metaValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
}

divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
}
```

## User Workflows

### Workflow 1: Preview Note Content
1. User opens a note from the list
2. Conversation view loads
3. Top section shows:
   - Note metadata (standard, chapter, topic, version)
   - Full note content with better formatting
   - Can scroll within this section to read full content

### Workflow 2: Export Note as Text
1. User opens a note
2. Taps "Export" button in header
3. File is created with formatted content
4. System share dialog opens with options:
   - Send via email
   - Send via messaging apps
   - Save to files
   - Copy to clipboard
   - Print
5. User selects action
6. Success alert confirms "Note exported as text file"

### Workflow 3: Export on Mobile
- File saved to device Documents directory
- Filename format: `note_title_timestamp.txt`
- Special characters in title converted to underscores
- Can be found in Files app on iOS or Files app on Android

## Key Features

✅ **Formatted Export**
- Includes all metadata
- Shows conversation history
- Structured with markdown-like formatting
- Ready to read or share

✅ **Better Preview Display**
- Metadata in organized rows
- Clear visual separation
- Larger, more readable text
- Emoji indicators for sections

✅ **System Integration**
- Uses native Share dialog
- Works with all device sharing methods
- Respects device sharing preferences
- Standard file handling

✅ **Error Handling**
- Try-catch for file operations
- User-friendly error messages
- Alert dialogs on success/failure
- Console logging for debugging

✅ **UX Improvements**
- Export button in convenient location
- Disabled during processing
- Clear visual indicators
- Instant feedback

## Technical Details

### File Saving
```javascript
const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
await RNFS.writeFile(filePath, exportContent, 'utf8');
```

### Sharing
```javascript
await Share.share({
    url: `file://${filePath}`,
    title: currentNote.title,
    message: `Note: ${currentNote.title}`,
});
```

### File Naming
```javascript
const fileName = `${currentNote.title
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()}_${Date.now()}.txt`;
```

## Metadata Included in Export

- **Title**: From note
- **Standard**: Grade/education level
- **Chapter**: Source chapter
- **Topic**: Note topic
- **Version**: Current version number
- **Created**: Formatted creation date/time
- **Content**: Full note text
- **Conversation History**: All changes with:
  - Change type (initial-prompt, edit, append)
  - User instruction
  - Timestamp of each change

## Benefits

✅ **For Users**
- Easy to share notes with others
- Preserve note history in export
- Professional-looking exported files
- Works offline (file saved locally first)

✅ **For Teachers**
- Students can submit work via email
- Better document format
- Includes version history
- Can track note evolution

✅ **For Students**
- Backup notes as text files
- Share study notes with classmates
- Create printable versions
- Organize exports by subject

## Files Modified

- `src/screens/AgenticNotesScreen.jsx` - Added export function, updated UI, enhanced display

## No Breaking Changes

- All existing functionality preserved
- Backward compatible
- No new dependencies required beyond RNFS (already available)
- No database changes

## Future Enhancements (Optional)

1. **PDF Export** - Convert to PDF format
2. **Markdown Export** - Export with markdown syntax
3. **HTML Export** - Export as HTML for web viewing
4. **Custom Templates** - Different export formats
5. **Scheduled Exports** - Auto-backup functionality
6. **Cloud Sync** - Auto-sync to cloud storage
7. **Print Support** - Direct printing to printer
8. **Watermark** - Add watermark to exported files

## Testing Checklist

- [ ] Create and open a note
- [ ] View note content in preview
- [ ] See metadata displayed correctly
- [ ] Tap Export button
- [ ] System share dialog appears
- [ ] Send via different methods (email, messaging, etc.)
- [ ] File receives successfully
- [ ] File format looks good
- [ ] Conversation history includes all changes
- [ ] Error handling works (test offline)
- [ ] Export button disabled while processing
- [ ] Success alert appears after export

---

## Summary

The Agentic Notes feature now includes:
- **📖 Enhanced Preview**: Better formatted note display with metadata
- **📤 Export to Text**: Share notes as formatted text files
- **🔄 Full History**: Export includes conversation history
- **📱 System Integration**: Native share dialog for easy distribution
- **✨ Professional Output**: Structured, readable exported files

Users can now easily share and archive their agentic notes with all context and history preserved!
