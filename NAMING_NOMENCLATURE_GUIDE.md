# Resource Naming Nomenclature Guide

## Overview

This guide establishes consistent naming conventions for saving three types of educational resources:
1. **Lectures** - Recorded or transcribed learning sessions
2. **Notes** - User-created study materials  
3. **Scanned Books** - Captured physical books

A clear nomenclature helps with:
- Easier searching and filtering
- Consistent organization
- Better context for future review
- Simplified sharing and collaboration

---

## 1. LECTURE NAMING CONVENTION

### Pattern
```
[Subject] - [Chapter/Unit] - [Topic] [Date]
```

### Format Details

| Component | Rules | Example |
|-----------|-------|---------|
| **Subject** | Full subject name, not abbreviations | Physics, Biology, Mathematics, English |
| **Chapter/Unit** | Chapter number or unit designation | Ch5, Unit 2, Module 3, Ch-5 |
| **Topic** | Specific concept or title of lesson | Photosynthesis, Derivatives, Shakespeare |
| **Date** | MMM DD format (Month DayNumber) | Feb09, Mar15, Dec25 |

### Examples of Good Names
```
✓ Physics - Ch3 - Motion - Feb09
✓ English - Unit2 - Shakespeare - Feb08
✓ Mathematics - Ch7 - Calculus - Feb10
✓ Chemistry - Module1 - Bonds - Feb07
✓ Biology - Ch5 - Photosynthesis - Feb09
```

### Examples to Avoid
```
✗ Physics Lecture on Motion
✗ Ch3 - Feb9
✗ Motion_Lesson_Physics
✗ Physics lesson about motion from 2/9/2026
```

### Guidelines
- Keep names concise (aim for 40-50 characters)
- Use hyphens (-) as separators for consistency
- Include date for chronological tracking and versioning
- Start with subject for easy alphabetical organization
- Avoid special characters except hyphen and space

### Character Limits
- Minimum: 3 characters
- Maximum: 100 characters
- Recommended: 40-50 characters

---

## 2. NOTE NAMING CONVENTION

### Pattern
```
[Subject] - [Topic] - [Type] [Year]
```

### Format Details

| Component | Rules | Example |
|-----------|-------|---------|
| **Subject** | Course or subject area | Physics, Algebra, Literature, History |
| **Topic** | Specific concept or chapter | Photosynthesis, Derivatives, French Revolution |
| **Type** | Category of note | Study Notes, Quick Notes, Summary, Review |
| **Year** | Academic year (optional but recommended) | 2026, 2025-26 |

### Note Types
- **Study Notes** - Comprehensive material for in-depth study
- **Quick Notes** - Brief highlights and key points
- **Summary** - Condensed version of larger content
- **Review** - Exam preparation or revision material

### Examples of Good Names
```
✓ Physics - Wave Motion - Study Notes 2026
✓ Mathematics - Trigonometry - Quick Notes 2026
✓ History - French Revolution - Summary 2026
✓ Chemistry - Periodic Table - Review 2026
✓ Biology - Photosynthesis - Study Notes 2026
```

### Examples to Avoid
```
✗ My Physics Study Notes About Wave Motion
✗ Notes on Trigonometry
✗ Math_Quick_Notes_2026
✗ Chapter 5 Notes
```

### Guidelines
- Use consistent note types for better filtering
- Include year for easy chronological reference
- Keep descriptive but concise
- Subject should come first for organization
- Type field helps in quick identification

### Character Limits
- Minimum: 3 characters
- Maximum: 100 characters
- Recommended: 45-55 characters

---

## 3. SCANNED BOOK NAMING CONVENTION

### Pattern
```
[Book Title] - [Author] - [Year]
```

### Format Details

| Component | Rules | Example |
|-----------|-------|---------|
| **Book Title** | Official or commonly used title | The Great Gatsby, To Kill a Mockingbird |
| **Author** | Last Name, First Name format | Fitzgerald, F. Scott; Lee, Harper |
| **Year** | Original publication or edition year | 1925, 1960, 2nd Edition |
| **Subject** | Related subject area (optional) | Literature, Science, History |

### Examples of Good Names
```
✓ To Kill a Mockingbird - Lee, Harper - 1960
✓ The Great Gatsby - Fitzgerald, F. Scott - 1925
✓ A Tale of Two Cities - Dickens, Charles - 1859
✓ Pride and Prejudice - Austen, Jane - 1813
✓ The Catcher in the Rye - Salinger, J.D. - 1951
```

### Examples to Avoid
```
✗ Great Gatsby Book
✗ Gatsby-F-S
✗ The_Great_Gatsby_Novel
✗ Book1, Book2, etc.
```

### Guidelines
- Use standardized library catalog format
- Include full author name (Last, First)
- Use publication year for reference
- Exact title for proper identification
- Optional: Add subject or edition info if needed

### Character Limits
- Minimum: 3 characters
- Maximum: 100 characters
- Recommended: 50-60 characters

---

## Validation Rules (Applied to All Types)

### Allowed Characters
```
✓ Letters (A-Z, a-z)
✓ Numbers (0-9)
✓ Spaces
✓ Hyphens (-)
✓ Commas (,)
✓ Periods (.)
✓ Parentheses ()
✓ Ampersand (&)
```

### Prohibited Characters
```
✗ Special symbols: @, #, $, %, ^, !, etc.
✗ Forward slashes: /
✗ Backslashes: \
✗ Colons: :
✗ Semicolons: ;
✗ Asterisks: *
✗ Question marks: ?
✗ Quotes: " '
✗ Pipe: |
```

### Name Requirements
- Minimum length: 3 characters
- Maximum length: 100 characters
- Cannot be empty
- Must contain at least one letter or number

---

## Implementation in the App

### For Lectures (NameSessionScreen)
When naming a lecture, the app shows:
1. **Suggested Format** - Pattern display
2. **Quick Guidelines** - Key rules to follow
3. **Examples** - Real naming examples
4. **Info Button** - Detailed guidelines (ℹ️ icon)
5. **Character Counter** - Real-time count
6. **Validation** - Instant feedback on invalid names

### For Notes (NotesScreen - Create Form)
When creating a note, the app shows:
1. **Suggested Format** - Pattern display
2. **Quick Guidelines** - Key rules to follow  
3. **Examples** - Real naming examples
4. **Info Button** - Detailed guidelines (ℹ️ icon)
5. **Placeholder Text** - Example format in input
6. **Validation** - Instant feedback on invalid names

### For Books (BookCameraScreen - Title Modal)
When naming captured books, the modal shows:
1. **Suggested Format** - Pattern display
2. **Quick Guidelines** - Key rules to follow
3. **Examples** - Real naming examples
4. **Info Button** - Detailed guidelines (ℹ️ icon)
5. **Character Counter** - Real-time count
6. **Validation** - Instant feedback on invalid names

---

## Pro Tips for Better Organization

### For Lectures
- 💡 Start with subject for easy browsing
- 💡 Include dates for version tracking
- 💡 Use consistent chapter notation (Ch5 or Chapter 5, not mixed)
- 💡 Make topics searchable and specific
- 💡 Keep format consistent across sessions

### For Notes
- 💡 Use "Study Notes" for comprehensive material
- 💡 Use "Quick Notes" for highlights
- 💡 Include year for academic reference
- 💡 Keep notes organized by subject
- 💡 Review names periodically for consistency

### For Books
- 💡 Use standardized library format
- 💡 Include full author name for clarity
- 💡 Add edition info if scanning specific editions
- 💡 Maintain consistent format across library
- 💡 Use search to avoid duplicates

---

## Common Mistakes to Avoid

### ❌ Lectures
- ❌ Vague topics: "Lecture", "Important Concept", "Stuff"
- ❌ Inconsistent dates: "2/9", "Feb 9", "February 9"
- ❌ Too long: "Physics Lecture on Motion and Dynamics from February 9 2026"
- ❌ Missing key info: "Ch3" (missing subject and topic)

### ❌ Notes  
- ❌ Generic types: "Notes", "Info", "Data"
- ❌ Missing subject: "Study Notes 2026"
- ❌ Inconsistent separators: "Physics_Note-Derivatives"
- ❌ Special characters: "Physics: Derivatives!" or "Calculus #Notes"

### ❌ Books
- ❌ Incorrect author format: "Scott F. Fitzgerald" instead of "Fitzgerald, F. Scott"
- ❌ Using abbreviations: "TGG" instead of "The Great Gatsby"
- ❌ Missing publication info: "The Great Gatsby"
- ❌ Inconsistent format: Mixed patterns across library

---

## Using the Info Button (ℹ️)

Each resource type has an info button in the naming modal that shows:

1. **Detailed Guidelines** - In-depth rules and explanations
2. **Good vs Avoid Examples** - Visual comparison with color coding
   - ✓ Green for recommended approaches
   - ✗ Red for approaches to avoid
3. **Pro Tips** - Expert recommendations for organization
4. **Comprehensive Rule Set** - All validation and format rules

Click the ℹ️ icon to open the full guidelines modal when you need detailed help.

---

## Searching and Filtering

By following the nomenclature, your resources become easy to:

### Search
- By Subject: "Physics" to find all physics resources
- By Topic: "Photosynthesis" to find specific concepts
- By Date: "Feb09" to find session-specific materials
- By Type: "Summary" to find note summaries

### Filter
- Lectures: Filter by date range or chapter
- Notes: Filter by type (Study, Quick, Summary, Review)
- Books: Filter by author or publication year

### Browse
- Alphabetical: Organized by subject (lecture/note) or title (books)
- Chronological: Find resources by date
- By Category: Group by type and subject

---

## Migration Guide

If you have existing resources with inconsistent names, consider:

1. **Renaming Priority**: Start with most frequently accessed resources
2. **Batch Naming**: Review and rename by type (all lectures, then notes, then books)
3. **Consistency Gradual**: Maintain old names for archival, use new names for new resources
4. **Documentation**: Keep list of before/after names during transition

---

## Questions & Troubleshooting

### Q: Can I use different separators?
A: No, use hyphens (-) consistently for all resource types to maintain uniformity.

### Q: What if my topic has multiple words?
A: Combine them naturally: "Ch5 - Cell Structure and Function" is acceptable.

### Q: Can I include timestamps?
A: Not recommended for lectures/notes. Use date (Feb09) instead for simplicity.

### Q: How do I handle ambiguous titles?
A: Add clarifying info in parentheses: "Biology - Ch5 - Photosynthesis (Light Reactions)"

### Q: What if name validation fails?
A: Check for invalid characters, ensure minimum 3 characters, maximum 100 characters, and follow the pattern.

---

## Conclusion

Following the nomenclature system helps create an organized, searchable, and maintainable resource library. The info buttons in each modal provide quick access to detailed guidelines when needed.

**Remember**: Consistent naming now saves time searching and organizing later!
