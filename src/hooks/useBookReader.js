import { useEffect, useState, useRef, useCallback } from 'react';
import Tts from 'react-native-tts';

/**
 * Custom hook for reading books with 3D text array structure (page -> paragraph -> sentence)
 * Supports multiple reading modes: sentence, paragraph, and page
 * 
 * @param {Array} textArray3D - 3D array structure [page][paragraph][sentence]
 * @returns {Object} Object containing state and methods for TTS reading
 */

const useBookReader = (textArray3D = []) => {
    // State management
    const [currentPage, setCurrentPage] = useState(0);
    const [currentParagraph, setCurrentParagraph] = useState(0);
    const [currentSentence, setCurrentSentence] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [readingMode, setReadingMode] = useState('sentence'); // sentence, paragraph, page

    // Refs for efficient access in callbacks
    const speakingRef = useRef(false);
    const pausedRef = useRef(false);
    const currentPageRef = useRef(0);
    const currentParagraphRef = useRef(0);
    const currentSentenceRef = useRef(0);
    const modeRef = useRef('sentence');
    const textArray3DRef = useRef(textArray3D);

    /**
     * Initialize TTS engine
     */
    useEffect(() => {
        initTTS();
    }, []);

    /**
     * Update refs whenever state changes
     */
    useEffect(() => {
        speakingRef.current = isSpeaking;
        pausedRef.current = isPaused;
        currentPageRef.current = currentPage;
        currentParagraphRef.current = currentParagraph;
        currentSentenceRef.current = currentSentence;
        modeRef.current = readingMode;
        textArray3DRef.current = textArray3D;
    }, [
        isSpeaking,
        isPaused,
        currentPage,
        currentParagraph,
        currentSentence,
        readingMode,
        textArray3D,
    ]);

    /**
     * Initialize TTS engine with default settings
     */
    const initTTS = useCallback(() => {
        try {
            // Log the structure of textArray3D
            console.log('[useBookReader] ===== INIT TTS =====');
            console.log('[useBookReader] textArray3D length:', textArray3D?.length);
            console.log('[useBookReader] textArray3D[0] type:', Array.isArray(textArray3D[0]) ? 'array' : typeof textArray3D[0]);
            console.log('[useBookReader] textArray3D[0] length:', textArray3D[0]?.length);
            if (textArray3D[0] && textArray3D[0][0]) {
                console.log('[useBookReader] textArray3D[0][0] type:', Array.isArray(textArray3D[0][0]) ? 'array' : typeof textArray3D[0][0]);
                console.log('[useBookReader] textArray3D[0][0] length:', textArray3D[0][0]?.length);
                console.log('[useBookReader] textArray3D[0][0]:', JSON.stringify(textArray3D[0][0]));
                if (textArray3D[0][0][0]) {
                    console.log('[useBookReader] textArray3D[0][0][0] type:', Array.isArray(textArray3D[0][0][0]) ? 'array' : typeof textArray3D[0][0][0]);
                    console.log('[useBookReader] textArray3D[0][0][0]:', JSON.stringify(textArray3D[0][0][0]));
                }
            }
            console.log('[useBookReader] ===== END STRUCTURE LOG =====');
            
            Tts.setDefaultLanguage('en-IN');
            Tts.setDefaultRate(0.5);
            Tts.setDefaultPitch(1.0);
        } catch (error) {
            console.log('[useBookReader] TTS init error:', error);
        }
    }, [textArray3D]);

    /**
     * Handle TTS finish event - move to next content based on reading mode
     */
    const handleTtsFinish = useCallback(() => {
        console.log('[useBookReader] TTS finished speaking');
        if (!speakingRef.current || pausedRef.current) return;

        const mode = modeRef.current;
        const page = currentPageRef.current;
        const para = currentParagraphRef.current;
        const sent = currentSentenceRef.current;
        const array3D = textArray3DRef.current;

        if (mode === 'sentence') {
            moveToNextSentenceInternal(page, para, sent, array3D);
        } else if (mode === 'paragraph') {
            // moveToNextParagraphInternal(page, para, sent, array3D);
            moveToNextSentenceInternal(page, para, sent, array3D);
        } else if (mode === 'page') {
            // moveToNextPageInternal(page, para, sent, array3D);
            moveToNextSentenceInternal(page, para, sent, array3D);
        }
    }, [moveToNextSentenceInternal, moveToNextParagraphInternal, moveToNextPageInternal]);

    /**
     * Attach TTS finish listener with proper dependency tracking
     */
    useEffect(() => {
        console.log('[useBookReader] Attaching TTS finish listener');
        const finishListener = Tts.addEventListener('tts-finish', handleTtsFinish);

        return () => {
            try {
                finishListener.remove();
                Tts.stop();
            } catch (error) {
                console.log('[useBookReader] Listener cleanup error:', error);
            }
        };
    }, [handleTtsFinish]);

    /**
     * Check if indices are valid in a given array
     */
    const isValidIndicesInArray = useCallback(
        (page, para, sent, array) => {
            return (
                array[page] &&
                array[page][para] &&
                array[page][para][sent]
            );
        },
        []
    );

    /**
     * Speak a specific sentence - NOT memoized to always have fresh ref access
     * Accepts array3D as parameter to avoid closure issues
     */
    const speakSentence = (page, para, sent, array3D = null) => {
        // Use provided array or fall back to ref
        const targetArray = array3D || textArray3DRef.current;

        if (!isValidIndicesInArray(page, para, sent, targetArray)) {
            console.log('[useBookReader] Invalid indices:', { page, para, sent });
            console.log('[useBookReader] Target array structure:', {
                pages: targetArray.length,
                paras: targetArray[page]?.length,
                sentences: targetArray[page]?.[para]?.length,
            });
            return false;
        }

        const rawSentence = targetArray[page][para][sent];
        
        // Handle both array and string formats for backward compatibility
        // If sentence is an array with one element, extract it
        const sentence = Array.isArray(rawSentence) ? rawSentence[0] : rawSentence;
        
        console.log('[useBookReader] Accessing sentence:', {
            page,
            para,
            sent,
            targetArray_page_para_type: Array.isArray(targetArray[page]?.[para]) ? 'array' : typeof targetArray[page]?.[para],
            rawSentence_type: Array.isArray(rawSentence) ? 'array' : typeof rawSentence,
            sentence_type: typeof sentence,
            sentence_value: JSON.stringify(sentence),
        });
        
        // ALWAYS update UI position, regardless of speaking state
        setCurrentPage(page);
        setCurrentParagraph(para);
        setCurrentSentence(sent);

        // ONLY speak if actually speaking and not paused
        console.log('[useBookReader] speakSentence called - isSpeaking:', speakingRef.current, 'isPaused:', pausedRef.current);
        if (!speakingRef.current || (speakingRef.current && pausedRef.current)) {
            console.log('[useBookReader] Not speaking or paused, skipping audio playback');
            return false;
        }

        Tts.stop();
        try {
            console.log('[useBookReader] Speaking:', sentence);
            Tts.speak(sentence);
        } catch (error) {
            console.log('[useBookReader] TTS speak error:', error);
        }
        return true;
    };

    /**
     * Internal method to move to next sentence
     */
    const moveToNextSentenceInternal = useCallback(
        (page, para, sent, array3D) => {


            if (!array3D[page]) {
                console.log('[useBookReader] Page not found, stopping');
                stopReading();
                return;
            }

            // Try to move to next sentence in current paragraph
            if (sent < array3D[page][para].length - 1) {
                console.log('[useBookReader] Moving to next sentence in same paragraph');
                speakSentence(page, para, sent + 1, array3D);
            }
            // Try to move to next paragraph
            else if (para < array3D[page].length - 1) {
                console.log('[useBookReader] Moving to next paragraph');
                speakSentence(page, para + 1, 0, array3D);
            }
            // Try to move to next page
            else if (page < array3D.length - 1) {
                console.log('[useBookReader] Moving to next page');
                speakSentence(page + 1, 0, 0, array3D);
            }
            // End of book
            else {
                console.log('[useBookReader] End of book reached');
                stopReading();
            }
        },
        [stopReading]
    );

    /**
     * Internal method to move to next paragraph
     */
    const moveToNextParagraphInternal = useCallback(
        (page, para, sent, array3D) => {
            if (!array3D[page]) {
                stopReading();
                return;
            }

            // Try to move to next paragraph
            if (para < array3D[page].length - 1) {
                speakSentence(page, para + 1, 0, array3D);
            }
            // Try to move to next page
            else if (page < array3D.length - 1) {
                speakSentence(page + 1, 0, 0, array3D);
            }
            // End of book
            else {
                pauseReading();
            }
        },
        [pauseReading, stopReading]
    );

    /**
     * Internal method to move to next page
     */
    const moveToNextPageInternal = useCallback(
        (page, para, sent, array3D) => {
            if (page < array3D.length - 1) {
                speakSentence(page + 1, 0, 0, array3D);
            } else {
                pauseReading();
            }
        },
        [pauseReading]
    );

    /**
     * Move to next sentence (public method)
     */
    const moveToNextSentence = useCallback(() => {
        moveToNextSentenceInternal(
            currentPageRef.current,
            currentParagraphRef.current,
            currentSentenceRef.current,
            textArray3DRef.current
        );
    }, [moveToNextSentenceInternal]);

    /**
     * Move to next paragraph (public method)
     */
    const moveToNextParagraph = useCallback(() => {
        moveToNextParagraphInternal(
            currentPageRef.current,
            currentParagraphRef.current,
            currentSentenceRef.current,
            textArray3DRef.current
        );
    }, [moveToNextParagraphInternal]);

    /**
     * Move to next page (public method)
     */
    const moveToNextPage = useCallback(() => {
        moveToNextPageInternal(
            currentPageRef.current,
            currentParagraphRef.current,
            currentSentenceRef.current,
            textArray3DRef.current
        );
    }, [moveToNextPageInternal]);

    /**
     * Move to previous sentence
     */
    const moveToPrevSentence = useCallback(() => {
        const page = currentPageRef.current;
        const para = currentParagraphRef.current;
        const sent = currentSentenceRef.current;
        const array3D = textArray3DRef.current;

        if (!array3D[page]) {
            return;
        }

        if (sent > 0) {
            speakSentence(page, para, sent - 1, array3D);
        } else if (para > 0) {
            const prevPara = array3D[page][para - 1].length - 1;
            speakSentence(page, para - 1, prevPara, array3D);
        } else if (page > 0) {
            const prevPageLastPara = array3D[page - 1].length - 1;
            const prevSent = array3D[page - 1][prevPageLastPara].length - 1;
            speakSentence(page - 1, prevPageLastPara, prevSent, array3D);
        }
    }, []);

    /**
     * Move to previous paragraph
     */
    const moveToPrevParagraph = useCallback(() => {
        const page = currentPageRef.current;
        const para = currentParagraphRef.current;
        const array3D = textArray3DRef.current;

        if (!array3D[page]) {
            return;
        }

        if (para > 0) {
            speakSentence(page, para - 1, 0, array3D);
        } else if (page > 0) {
            const prevPageLastPara = array3D[page - 1].length - 1;
            speakSentence(page - 1, prevPageLastPara, 0, array3D);
        }
    }, []);

    /**
     * Move to previous page
     */
    const moveToPrevPage = useCallback(() => {
        const page = currentPageRef.current;
        const array3D = textArray3DRef.current;

        if (page > 0) {
            speakSentence(page - 1, 0, 0, array3D);
        }
    }, []);

    /**
     * Start reading from current position
     */
    const startReading = useCallback(() => {
        speakingRef.current = true;
        pausedRef.current = false;
        setIsSpeaking(true);
        setIsPaused(false);
        speakSentence(
            currentPageRef.current,
            currentParagraphRef.current,
            currentSentenceRef.current
        );
    }, []);

    /**
     * Pause reading (keep position)
     */
    const pauseReading = useCallback(() => {
        Tts.stop();
        setIsPaused(true);
    }, []);

    /**
     * Resume reading from current position
     */
    const resumeReading = useCallback(() => {
        pausedRef.current = false;
        setIsPaused(false);
        speakSentence(
            currentPageRef.current,
            currentParagraphRef.current,
            currentSentenceRef.current
        );
    }, []);

    /**
     * Stop reading and reset position
     */
    const stopReading = useCallback(() => {
        Tts.stop();
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentPage(0);
        setCurrentParagraph(0);
        setCurrentSentence(0);
    }, []);

    /**
     * Change reading mode
     */
    const changeReadingMode = useCallback((mode) => {
        if (['sentence', 'paragraph', 'page'].includes(mode)) {
            setReadingMode(mode);
        }
    }, []);

    /**
     * Get current paragraph text
     */
    const getCurrentParagraphText = useCallback(() => {
        if (
            textArray3D[currentPage] &&
            textArray3D[currentPage][currentParagraph]
        ) {
            return textArray3D[currentPage][currentParagraph].join(' ');
        }
        return '';
    }, [textArray3D, currentPage, currentParagraph]);

    /**
     * Get current page text
     */
    const getCurrentPageText = useCallback(() => {
        if (textArray3D[currentPage]) {
            return textArray3D[currentPage]
                .map((para) => para.join(' '))
                .join('\n\n');
        }
        return '';
    }, [textArray3D, currentPage]);

    /**
     * Get total pages
     */
    const getTotalPages = useCallback(() => {
        return textArray3D.length;
    }, [textArray3D]);

    /**
     * Get total paragraphs in current page
     */
    const getTotalParagraphs = useCallback(() => {
        return textArray3D[currentPage]?.length || 0;
    }, [textArray3D, currentPage]);

    /**
     * Get total sentences in current paragraph
     */
    const getTotalSentences = useCallback(() => {
        return textArray3D[currentPage]?.[currentParagraph]?.length || 0;
    }, [textArray3D, currentPage, currentParagraph]);

    return {
        // State
        currentPage,
        currentParagraph,
        currentSentence,
        isSpeaking,
        isPaused,
        readingMode,

        // Navigation methods
        moveToNextSentence,
        moveToNextParagraph,
        moveToNextPage,
        moveToPrevSentence,
        moveToPrevParagraph,
        moveToPrevPage,

        // Playback control methods
        startReading,
        pauseReading,
        resumeReading,
        stopReading,
        speakSentence,

        // Settings
        changeReadingMode,

        // Text retrieval
        getCurrentParagraphText,
        getCurrentPageText,
        getTotalPages,
        getTotalParagraphs,
        getTotalSentences,
    };
};

export default useBookReader;
