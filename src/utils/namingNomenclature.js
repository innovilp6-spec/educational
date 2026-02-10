/**
 * Resource Naming Nomenclature
 * Guidelines for consistent naming of lectures, notes, and books
 */

export const NAMING_NOMENCLATURE = {
  lecture: {
    name: 'Lecture',
    pattern: '[Subject] - [Chapter/Unit] - [Topic] [Date]',
    example: 'Biology - Ch5 - Photosynthesis - Feb09',
    guidelines: [
      '• Subject: Full subject name (e.g., Physics, Mathematics, English)',
      '• Chapter/Unit: Chapter number or unit name (e.g., Ch5, Unit 2, Module 3)',
      '• Topic: Main topic covered (e.g., Photosynthesis, Quadratic Equations)',
      '• Date: Recording date in format MMM DD (e.g., Feb09, Mar15)',
      '• Keep it concise (max 50 characters)',
      '• Use hyphens (-) as separators',
      '• Avoid special characters except hyphen',
    ],
    examples: [
      'Physics - Ch3 - Motion - Feb09',
      'English - Unit2 - Shakespeare - Feb08',
      'Mathematics - Ch7 - Calculus - Feb10',
      'Chemistry - Module1 - Bonds - Feb07',
    ],
  },

  note: {
    name: 'Note',
    pattern: '[Subject] - [Topic] - [Type] [Year]',
    example: 'Biology - Photosynthesis - Study Notes 2026',
    guidelines: [
      '• Subject: Course or subject name (e.g., Biology, Algebra, Literature)',
      '• Topic: Specific topic or concept (e.g., Photosynthesis, Derivatives)',
      '• Type: Note category (Study Notes, Quick Notes, Summary, Review)',
      '• Year: Academic year for reference (e.g., 2026)',
      '• Keep it descriptive yet concise (max 55 characters)',
      '• Use hyphens (-) as separators',
      '• Type field helps in filtering and organization',
    ],
    examples: [
      'Physics - Wave Motion - Study Notes 2026',
      'Mathematics - Trigonometry - Quick Notes 2026',
      'History - French Revolution - Summary 2026',
      'Chemistry - Periodic Table - Review 2026',
    ],
  },

  book: {
    name: 'Scanned Book',
    pattern: '[Book Title] - [Author] - [Year]',
    example: 'The Great Gatsby - F. Scott Fitzgerald - 1925',
    guidelines: [
      '• Book Title: Full or commonly used book title',
      '• Author: Last name, First name (e.g., Fitzgerald, F. Scott)',
      '• Year: Publication year or edition year',
      '• Subject: Related subject area (Optional for categorization)',
      '• Edition: Include edition info if relevant (e.g., 2nd Edition)',
      '• Keep format consistent: Title - Author - Year',
      '• Use exact book title for proper identification',
    ],
    examples: [
      'To Kill a Mockingbird - Lee, Harper - 1960',
      'A Tale of Two Cities - Dickens, Charles - 1859',
      'Pride and Prejudice - Austen, Jane - 1813',
      'The Catcher in the Rye - Salinger, J.D. - 1951',
    ],
  },
};

/**
 * Detailed nomenclature guidelines with tips
 */
export const DETAILED_GUIDELINES = {
  lecture: {
    title: 'Lecture Naming Guidelines',
    rules: [
      {
        title: 'Subject Code',
        description: 'Use full subject name, not abbreviations',
        good: 'Biology, Physics, Mathematics',
        bad: 'Bio, Phys, Math',
      },
      {
        title: 'Chapter Reference',
        description: 'Include chapter/unit number from curriculum',
        good: 'Ch5, Unit 2, Module 3',
        bad: 'Chapter Five, UNIT_2',
      },
      {
        title: 'Topic Clarity',
        description: 'Use specific, searchable topic names',
        good: 'Photosynthesis, Derivatives, Shakespearean Sonnets',
        bad: 'Stuff, Important Concept, Lesson',
      },
      {
        title: 'Date Format',
        description: 'Use MMM DD format for consistency',
        good: 'Feb09, Mar15, Dec25',
        bad: '9-2-2026, February 9th, 2/9/26',
      },
      {
        title: 'Special Characters',
        description: 'Avoid special characters, use hyphens only',
        good: 'Biology - Ch5 - Photosynthesis - Feb09',
        bad: 'Biology: Ch.5 @ Photosynthesis (Feb/9)',
      },
    ],
    tips: [
      '💡 Start with subject for easier alphabetical organization',
      '💡 Use consistent separators (always use hyphens)',
      '💡 Include dates for chronological tracking',
      '💡 Make topics searchable and specific',
      '💡 Avoid very long names - aim for 40-50 characters',
    ],
  },

  note: {
    title: 'Note Naming Guidelines',
    rules: [
      {
        title: 'Subject/Course Name',
        description: 'Full course or subject identifier',
        good: 'Physics, Organic Chemistry, European History',
        bad: 'P, Chem, Hist',
      },
      {
        title: 'Topic Specification',
        description: 'Specific concept or chapter covered',
        good: 'Photosynthesis, Derivatives, Industrial Revolution',
        bad: 'Notes, Important, Chapter',
      },
      {
        title: 'Note Type',
        description: 'Categorize: Study Notes, Quick Notes, Summary, Review',
        good: 'Study Notes, Summary, Review Notes',
        bad: 'Notes, Info, Data',
      },
      {
        title: 'Academic Year',
        description: 'Current or relevant academic year',
        good: '2026, 2025-26',
        bad: 'New, Recent, Latest',
      },
      {
        title: 'Length Optimization',
        description: 'Keep names concise but informative',
        good: 'Physics - Wave Motion - Study Notes 2026',
        bad: 'My Physics Study Notes About Wave Motion and Related Concepts from Class 2026',
      },
    ],
    tips: [
      '💡 Use "Study Notes" for comprehensive material',
      '💡 Use "Quick Notes" for brief highlights',
      '💡 Use "Summary" for condensed versions',
      '💡 Use "Review" for exam preparation notes',
      '💡 Keep notes organized by subject for easy browsing',
    ],
  },

  book: {
    title: 'Scanned Book Naming Guidelines',
    rules: [
      {
        title: 'Exact Book Title',
        description: 'Use official published title',
        good: 'The Great Gatsby, To Kill a Mockingbird',
        bad: 'Great Gatsby Book, TKAM Novel',
      },
      {
        title: 'Author Format',
        description: 'Use: Last Name, First Name format',
        good: 'Fitzgerald, F. Scott; Lee, Harper',
        bad: 'F. Scott Fitzgerald, Harper Lee',
      },
      {
        title: 'Publication Year',
        description: 'Include original publication year',
        good: '1925, 1960, 1813',
        bad: 'Old Book, Recent Publication, Unknown',
      },
      {
        title: 'Edition Information',
        description: 'Include if using specific edition',
        good: '2nd Edition, Revised Edition, Student Edition',
        bad: 'Latest Version, Updated',
      },
      {
        title: 'Consistency',
        description: 'Keep format consistent across all entries',
        good: 'Title - Author - Year',
        bad: 'Mixed formats in library',
      },
    ],
    tips: [
      '📚 Use standardized library catalog format',
      '📚 Include author name for better searching',
      '📚 Add publication year for reference and context',
      '📚 For edited collections, include editor name',
      '📚 Maintain consistent format across library',
    ],
  },
};

/**
 * Generate formatted example
 */
export const formatExample = (type) => {
  return NAMING_NOMENCLATURE[type]?.example || '';
};

/**
 * Get nomenclature for type
 */
export const getNomenclature = (type) => {
  return NAMING_NOMENCLATURE[type] || null;
};

/**
 * Validate name against nomenclature pattern
 */
export const validateName = (type, name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Name is too long (max 100 characters)' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Name is too short (min 3 characters)' };
  }

  // Check for invalid characters (allow alphanumeric, spaces, hyphens, commas, periods)
  const validPattern = /^[a-zA-Z0-9\s\-,.()&]+$/;
  if (!validPattern.test(name)) {
    return { valid: false, error: 'Name contains invalid characters. Use only letters, numbers, hyphens, and basic punctuation.' };
  }

  return { valid: true, error: null };
};

/**
 * Get detailed guidelines for type
 */
export const getDetailedGuidelines = (type) => {
  return DETAILED_GUIDELINES[type] || null;
};
