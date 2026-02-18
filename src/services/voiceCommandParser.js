/**
 * Voice Command Parser
 * Converts spoken text to actionable intents
 * Handles confidence scoring and command disambiguation
 */

// Command maps for each screen
const commandMaps = {
    AgenticCoach: {
        nextQuestion: {
            keywords: ['next', 'next question', 'go to next', 'continue'],
            action: 'nextQuestion',
            confidence: 0.9,
        },
        previousQuestion: {
            keywords: ['previous', 'back', 'go back', 'last question'],
            action: 'previousQuestion',
            confidence: 0.9,
        },
        repeatQuestion: {
            keywords: ['repeat', 'say it again', 'repeat question'],
            action: 'repeatQuestion',
            confidence: 0.85,
        },
        submitAnswer: {
            keywords: ['submit', 'send answer', 'submit answer', 'check answer'],
            action: 'submitAnswer',
            confidence: 0.9,
        },
        showHint: {
            keywords: ['hint', 'give me a hint', 'help'],
            action: 'showHint',
            confidence: 0.85,
        },
        readQuestion: {
            keywords: ['read', 'read question', 'read it out'],
            action: 'readQuestion',
            confidence: 0.85,
        },
    },

    AgenticNotes: {
        saveNote: {
            keywords: ['save', 'save note', 'save this'],
            action: 'saveNote',
            confidence: 0.95,
        },
        newNote: {
            keywords: ['new', 'new note', 'create note'],
            action: 'newNote',
            confidence: 0.9,
        },
        clearText: {
            keywords: ['clear', 'delete', 'clear text'],
            action: 'clearText',
            confidence: 0.85,
        },
        submitText: {
            keywords: ['submit', 'send', 'submit text'],
            action: 'submitText',
            confidence: 0.9,
        },
    },

    ChatScreen: {
        sendMessage: {
            keywords: ['send', 'submit', 'send message'],
            action: 'sendMessage',
            confidence: 0.9,
        },
        clear: {
            keywords: ['clear', 'delete', 'clear message'],
            action: 'clearInput',
            confidence: 0.85,
        },
    },

    TranscriptScreen: {
        nextPage: {
            keywords: ['next', 'next page', 'go to next'],
            action: 'nextPage',
            confidence: 0.9,
        },
        previousPage: {
            keywords: ['previous', 'back', 'previous page'],
            action: 'previousPage',
            confidence: 0.9,
        },
        search: {
            keywords: ['search', 'find'],
            action: 'openSearch',
            confidence: 0.85,
        },
    },

    BookDetailScreen: {
        nextChapter: {
            keywords: ['next', 'next chapter', 'continue reading'],
            action: 'nextChapter',
            confidence: 0.9,
        },
        previousChapter: {
            keywords: ['previous', 'back', 'previous chapter'],
            action: 'previousChapter',
            confidence: 0.9,
        },
        bookmark: {
            keywords: ['bookmark', 'mark', 'save page'],
            action: 'toggleBookmark',
            confidence: 0.85,
        },
    },

    // Universal commands (work on all screens)
    UNIVERSAL: {
        goHome: {
            keywords: ['go home', 'home', 'go to home'],
            action: 'goHome',
            confidence: 0.9,
        },
        goBack: {
            keywords: ['go back', 'back', 'go back'],
            action: 'goBack',
            confidence: 0.9,
        },
        openSettings: {
            keywords: ['settings', 'open settings', 'go to settings'],
            action: 'openSettings',
            confidence: 0.9,
        },
        help: {
            keywords: ['help', 'assist', 'how do i'],
            action: 'showHelp',
            confidence: 0.8,
        },
    },
};

/**
 * Calculate similarity between two strings (0-1)
 * Uses simple character-level matching
 */
const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
};

/**
 * Calculate edit distance (Levenshtein distance)
 */
const getEditDistance = (s1, s2) => {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
};

/**
 * Extract keywords from spoken text
 */
const extractKeywords = (text) => {
    return text
        .toLowerCase()
        .trim()
        .split(' ')
        .filter(word => word.length > 2); // Filter short words
};

/**
 * Check if keyword matches text
 */
const matchesKeyword = (text, keyword) => {
    const lowerText = text.toLowerCase().trim();
    const lowerKeyword = keyword.toLowerCase();

    // Exact match
    if (lowerText === lowerKeyword) return 1.0;

    // Contains match
    if (lowerText.includes(lowerKeyword)) return 0.95;

    // Similarity-based match
    return calculateSimilarity(lowerText, lowerKeyword);
};

/**
 * Parse voice text to extract intent
 * @param {string} text - Spoken text
 * @param {string} screenName - Current screen name
 * @param {object} options - Configuration options
 * @returns {object} Parsed intent with confidence
 */
export const parseVoiceCommand = (text, screenName, options = {}) => {
    const {
        confidenceThreshold = 0.7,
        ambiguityThreshold = 0.85,
        includeUniversal = true,
        strictMode = false, // Only exact commands
    } = options;

    if (!text || !text.trim()) {
        return {
            intent: 'NO_MATCH',
            confidence: 0,
            rawText: text,
            error: 'Empty text provided',
        };
    }

    const lowerText = text.toLowerCase().trim();

    // Collect all potential matches
    const matches = [];

    // Screen-specific commands
    const screenCommands = commandMaps[screenName] || {};
    Object.entries(screenCommands).forEach(([cmdName, cmdData]) => {
        const match = findBestKeywordMatch(lowerText, cmdData.keywords, strictMode);
        if (match && match.similarity > confidenceThreshold) {
            matches.push({
                intent: cmdData.action,
                commandName: cmdName,
                screenName,
                similarity: match.similarity,
                baseConfidence: cmdData.confidence,
                confidence: match.similarity * cmdData.confidence,
                keyword: match.keyword,
            });
        }
    });

    // Universal commands
    if (includeUniversal) {
        Object.entries(commandMaps.UNIVERSAL).forEach(([cmdName, cmdData]) => {
            const match = findBestKeywordMatch(lowerText, cmdData.keywords, strictMode);
            if (match && match.similarity > confidenceThreshold * 0.9) { // Slightly lower threshold for universal
                matches.push({
                    intent: cmdData.action,
                    commandName: cmdName,
                    screenName: 'UNIVERSAL',
                    similarity: match.similarity,
                    baseConfidence: cmdData.confidence,
                    confidence: match.similarity * cmdData.confidence,
                    keyword: match.keyword,
                    isUniversal: true,
                });
            }
        });
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    // No match found
    if (matches.length === 0) {
        return {
            intent: 'NO_MATCH',
            confidence: 0,
            rawText: text,
            error: 'No matching command found',
        };
    }

    // Single clear match
    if (matches[0].confidence > ambiguityThreshold) {
        return {
            intent: matches[0].intent,
            commandName: matches[0].commandName,
            screenName: matches[0].screenName,
            confidence: matches[0].confidence,
            rawText: text,
            matchedKeyword: matches[0].keyword,
            isUniversal: matches[0].isUniversal || false,
        };
    }

    // Ambiguous - multiple similar matches
    if (matches.length > 1 && Math.abs(matches[0].confidence - matches[1].confidence) < 0.1) {
        return {
            intent: 'ASK_CLARIFICATION',
            confidence: matches[0].confidence,
            options: matches.slice(0, 3).map(m => ({
                intent: m.intent,
                commandName: m.commandName,
                confidence: m.confidence,
            })),
            rawText: text,
            error: 'Ambiguous command - multiple matches',
        };
    }

    // Default to best match
    return {
        intent: matches[0].intent,
        commandName: matches[0].commandName,
        screenName: matches[0].screenName,
        confidence: matches[0].confidence,
        rawText: text,
        matchedKeyword: matches[0].keyword,
        isUniversal: matches[0].isUniversal || false,
    };
};

/**
 * Find best matching keyword in array
 */
const findBestKeywordMatch = (text, keywords, strictMode = false) => {
    let bestMatch = null;
    let bestSimilarity = 0;

    keywords.forEach(keyword => {
        const similarity = matchesKeyword(text, keyword);
        if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = { keyword, similarity };
        }
    });

    return bestMatch;
};

/**
 * Get all available commands for a screen
 */
export const getScreenCommands = (screenName) => {
    return {
        ...commandMaps[screenName],
        ...commandMaps.UNIVERSAL,
    };
};

/**
 * Register custom command for a screen
 */
export const registerCustomCommand = (screenName, commandName, commandData) => {
    if (!commandMaps[screenName]) {
        commandMaps[screenName] = {};
    }
    commandMaps[screenName][commandName] = commandData;
    console.log(
        `[VOICE-PARSER] Registered custom command "${commandName}" for "${screenName}"`
    );
};

/**
 * Check if a command exists
 */
export const commandExists = (screenName, commandName) => {
    return !!(
        commandMaps[screenName]?.[commandName] ||
        commandMaps.UNIVERSAL[commandName]
    );
};

/**
 * Format parsed command for display/logging
 */
export const formatCommand = (parsed) => {
    return {
        intent: parsed.intent,
        confidence: (parsed.confidence * 100).toFixed(1) + '%',
        screen: parsed.screenName,
        keyword: parsed.matchedKeyword || 'N/A',
        raw: parsed.rawText,
    };
};

export default {
    parseVoiceCommand,
    getScreenCommands,
    registerCustomCommand,
    commandExists,
    formatCommand,
};
