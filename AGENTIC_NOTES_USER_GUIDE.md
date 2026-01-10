# Agentic Notes - Quick Start Guide

## User Workflows

### Creating Your First Note

1. **Navigate to Notes**
   - From HomeScreen, tap "My Notes" button
   - Empty notes list appears

2. **Start Conversation**
   - Tap "Start New Note" button
   - Conversation view opens

3. **Send Your First Prompt**
   - Type: "Create notes on photosynthesis"
   - Tap "Send"
   - Agent generates notes and displays them

4. **Refine Your Notes**
   - See the generated content
   - Type new instructions:
     - "Add examples of photosynthesis in nature"
     - "Simplify the explanation for middle school"
     - "Include the role of chlorophyll"
   - Each instruction refines the note

### Continuing an Existing Note

1. **Navigate to Notes**
   - Tap "My Notes" button
   - See list of all your notes

2. **Select a Note**
   - Tap on any note in the list
   - Conversation view opens with that note's history

3. **Add to Your Notes**
   - See the current note content
   - See conversation history showing how it was created
   - Type new instructions:
     - "Add a section on..."
     - "Change the title to..."
     - "Make it more detailed..."
   - Each instruction updates the note

## Prompt Examples

### Creating New Notes
```
"Create notes on the water cycle"
"Generate notes about photosynthesis"
"Make notes covering calculus derivatives"
"Create study notes for the American Revolution"
```

### Adding to Notes
```
"Add examples of the water cycle in different regions"
"Include a section on photosynthesis in plants vs bacteria"
"Add practice problems for derivatives"
"Include key dates in the American Revolution"
```

### Editing Notes
```
"Simplify the explanation"
"Make it more detailed"
"Rewrite the introduction"
"Fix the grammar and wording"
"Make it suitable for 7th graders"
"Add more technical details"
"Make it less wordy"
```

### Improving Notes
```
"Add a visual description of the process"
"Include real-world examples"
"Reorganize by topic rather than chronologically"
"Add a summary section"
"Highlight the most important points"
```

## Chat Interface Guide

### Message Types

1. **Your Messages** (Blue, right side)
   - Your prompts and instructions
   - Example: "Create notes on photosynthesis"

2. **Agent Messages** (Light blue, left side)
   - Agent's responses with checkmark
   - Shows what was done
   - Example: "✓ Created new note\n\nPhotosynthesis..."

3. **System Messages** (Gray, center)
   - Informational messages
   - Example: "Opened note: 'Photosynthesis Notes'"

### Controls

- **Back Button** (← Back)
  - Returns to notes list
  - Your conversation is saved

- **Send Button** (Send)
  - Sends your prompt to agent
  - Disabled while waiting for response
  - Disabled if text input is empty

- **Note Content Preview** (Top section)
  - Shows current content of your note
  - Scrollable if content is long
  - Updates as you modify the note

- **Refresh Button** (↻ on notes list)
  - Reloads the notes list
  - Use if new notes don't appear

## Tips & Best Practices

### Writing Effective Prompts

1. **Be Specific**
   - ✓ "Add a section on photosynthesis in plants"
   - ✗ "Add stuff"

2. **Use Natural Language**
   - ✓ "Simplify this for a 6th grader"
   - ✗ "make simple"

3. **Include Context**
   - ✓ "Add examples of photosynthesis in tropical rainforests"
   - ✗ "Add examples"

4. **One Instruction at a Time**
   - ✓ Send: "Add a section on stomata"
   - Then: "Explain their role in photosynthesis"
   - ✗ "Add a section on stomata and explain their role..."

### Organizing Your Notes

1. **Use Clear Titles**
   - Agent auto-generates titles from your prompts
   - Try specific topics in your initial prompt

2. **Build Gradually**
   - Start with core content
   - Add examples and details
   - Simplify for readability

3. **Track Changes**
   - Conversation history shows how notes evolved
   - Use this to understand note content better

## Troubleshooting

### Notes Won't Load
- **Check**: Is the server running?
- **Solution**: Start backend server with `npm start`

### Send Button Disabled
- **Reason**: Text input is empty or app is processing
- **Solution**: Wait for current response, then type your message

### No Response from Agent
- **Reason**: Network connection or server issue
- **Solution**: Check internet, refresh, try again
- **Alternative**: Take a screenshot and try again later

### Note Disappeared
- **Reason**: It might not have saved
- **Solution**: Navigate back and reload notes list
- **Check**: Refresh button to reload list

### Conversation History Not Showing
- **Reason**: Note may be new or history not loaded
- **Solution**: Close and reopen the note
- **Alternative**: Refresh the notes list

## Data Structure

### What Gets Saved

For each note, the system stores:
- **Title**: Auto-generated from your initial prompt
- **Content**: Full text of the note
- **Conversation History**: Every instruction you gave
- **Version**: How many times it's been modified
- **Metadata**: Creation date, last modified date
- **Standard**: Grade/education level
- **Topic**: Subject area

### What's Visible to You

In the notes list:
- Note title
- Subject and topic
- Content preview (first 100 characters)
- Version number (v1, v2, v3, etc.)
- Last modified date

In the conversation:
- Current full note content
- All your prompts and agent responses
- Timestamps of changes

## Keyboard & Input

- **Text Input**: Max 500 characters per message
- **Multiline**: Supports multiple lines in your prompts
- **Auto-Clear**: Text input clears after sending
- **Keyboard**: Appears automatically when you tap input

## Navigation

**From Conversation Back to List**
- Tap "← Back" button
- Your note is automatically saved
- Return to see list of all notes

**Opening a Different Note**
- Tap "← Back" to return to list
- Tap the note you want to open
- New conversation loads

**Creating New Note While Viewing Note**
- Tap "← Back" to return to list
- Look for "Start New Note" option
- If no notes, button appears in center
- If notes exist, use "Start New Note" in list view

## FAQ

**Q: Can I delete a note?**
A: Yes, swipe left or look for delete option in note (coming soon)

**Q: Can I export my notes?**
A: Not yet, but this feature is planned

**Q: Can I share notes with friends?**
A: Not yet, but collaboration features are coming

**Q: What if I make a mistake in my prompt?**
A: Send a correction prompt like "Actually, change that to..."

**Q: How long can my notes be?**
A: No limit - notes can grow as large as needed

**Q: Can I edit the notes directly?**
A: Not currently - all editing is through conversation prompts

**Q: Will my notes be saved if I close the app?**
A: Yes - notes are saved on the server immediately

**Q: Can I restore a deleted note?**
A: Not currently - delete is permanent

## Example Session

```
User: "Create notes on the water cycle"
Agent: ✓ Created new note
        The water cycle is the continuous movement of water...

User: "Add a section on evaporation"
Agent: ✓ Updated note (v2)
        Added detailed explanation of evaporation...

User: "Simplify the vocabulary"
Agent: ✓ Updated note (v3)
        Simplified technical terms for easier understanding...

User: "Add an example with a puddle"
Agent: ✓ Updated note (v4)
        Added example: When a puddle in your yard disappears...

User: "Expand the condensation section"
Agent: ✓ Updated note (v5)
        Expanded condensation with more detail...
```

## Support

If you encounter issues:
1. Take a screenshot of the error
2. Note what you were trying to do
3. Check the console logs (tap more options → View Logs)
4. Report to your instructor or developer

---

**Happy Note Taking! Your AI Study Assistant is Ready to Help.** 📝✨
