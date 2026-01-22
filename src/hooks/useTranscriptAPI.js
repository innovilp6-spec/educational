import { useState, useMemo } from "react";

const SERVER_BASE_URL = "http://10.0.2.2:5000"; // Update with your actual server IP
const USER_EMAIL = "testuser@example.com"; // Using test user for now

export default function useTranscriptAPI() {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Helper function to make API calls to the server
    const makeServerRequest = async (endpoint, method = "POST", body = null) => {
        try {
            const options = {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "x-user-email": USER_EMAIL,
                },
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const url = `${SERVER_BASE_URL}${endpoint}`;
            console.log(`Making ${method} request to: ${url}`);

            const res = await fetch(url, options);

            if (!res.ok) {
                const errorData = await res.text();
                console.error(`API Error (${res.status}):`, errorData);
                throw new Error(`HTTP ${res.status}: ${errorData}`);
            }

            const data = await res.json();
            return data;
        } catch (err) {
            console.error("Server request error:", err);
            throw err;
        }
    };

    // Transcribe audio chunk using server's transcribe endpoint
    const transcribeAudioChunk = async (audioFilePath) => {
        try {
            setIsTranscribing(true);
            console.log("Transcribing audio chunk using server:", audioFilePath);

            // TODO: Implement actual audio file upload to server
            // For now, return a placeholder transcription
            // In production, you'll need to:
            // 1. Read the audio file
            // 2. Create FormData with the audio file
            // 3. POST to /api/lectures/transcribe-audio

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Return realistic transcription
            return "This is the transcribed content from the audio chunk.";
        } catch (err) {
            console.error("Error transcribing audio:", err);
            throw err;
        } finally {
            setIsTranscribing(false);
        }
    };

    // Create transcript on server from chunks
    const createTranscript = async (transcriptText, standard, chapter, topic, subject, sessionName) => {
        try {
            setIsProcessing(true);
            console.log("Creating transcript on server...");

            const response = await makeServerRequest("/api/lectures/transcript", "POST", {
                transcriptText,
                standard,
                chapter,
                topic,
                subject,
                sessionName,
            });

            console.log("Transcript created:", response);
            return response;
        } catch (err) {
            console.error("Error creating transcript:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Process master transcript on server
    const processTranscript = async (masterTranscript) => {
        try {
            setIsProcessing(true);
            console.log("Processing master transcript on server...");

            // For now, return the transcript as-is since server processing is done server-side
            // In a real scenario, you might call a server endpoint to clean up the text
            return masterTranscript;
        } catch (err) {
            console.error("Error processing transcript:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Get summaries from server
    const getSummaries = async (transcriptId) => {
        try {
            setIsSummarizing(true);
            console.log("Getting summaries from server for transcript:", transcriptId);

            const response = await makeServerRequest(
                `/api/lectures/transcript/${transcriptId}/summaries`,
                "GET"
            );

            console.log("Summaries retrieved:", response);
            return response.summaries || [];
        } catch (err) {
            console.error("Error getting summaries:", err);
            throw err;
        } finally {
            setIsSummarizing(false);
        }
    };

    // Generate summary on server
    const generateSummary = async (transcriptId, summaryType = "quick") => {
        try {
            setIsSummarizing(true);
            console.log(`Generating ${summaryType} summary from server...`);

            const response = await makeServerRequest(
                `/api/lectures/transcript/${transcriptId}/summary`,
                "POST",
                { summaryType }
            );

            console.log("Summary generated:", response);
            return response.summary?.content || "";
        } catch (err) {
            console.error("Error generating summary:", err);
            throw err;
        } finally {
            setIsSummarizing(false);
        }
    };

    // Ask coach a question (agentic)
    const askCoach = async (question, simplificationLevel = 3, contextType = "general", contextId = null) => {
        try {
            console.log("Asking coach:", { question, contextType, contextId, simplificationLevel });

            const response = await makeServerRequest("/api/coach/agentic/ask", "POST", {
                question,
                simplificationLevel,
                contextType,  // Server expects 'contextType'
                contextId,
            });

            console.log("Coach RAW response received:", JSON.stringify(response, null, 2));

            // Server returns data in new standardized format: {success, data: {response, context, metadata}}
            if (response?.success && response?.data?.response?.answer) {
                const normalizedResponse = {
                    _id: response.data?.metadata?.interactionId || new Date().getTime(),
                    userQuestion: question,
                    coachResponse: response.data.response.answer,
                    formattedAnswer: response.data.response.formattedAnswer,
                    simplificationLevel: response.data.metadata?.simplificationLevel || simplificationLevel,
                    createdAt: response.data.metadata?.generatedAt || new Date().toISOString(),
                    context: response.data.context,
                };
                console.log("Coach NORMALIZED response being returned:", JSON.stringify(normalizedResponse, null, 2));
                return normalizedResponse;
            }

            console.log("WARNING: Unexpected response format - missing success or answer data");
            console.log("Response structure:", JSON.stringify(Object.keys(response || {}), null, 2));
            return {};
        } catch (err) {
            console.error("Error asking coach:", err);
            throw err;
        }
    };

    // Get coach interaction history
    const getCoachHistory = async () => {
        try {
            console.log("Getting coach history...");

            const response = await makeServerRequest("/api/coach/agentic/history", "GET");

            console.log("Coach history retrieved:", response);
            return response.interactions || [];
        } catch (err) {
            console.error("Error getting coach history:", err);
            return [];
        }
    };

    // Ask follow-up question to coach
    const askCoachFollowup = async (interactionId, followupQuestion) => {
        try {
            console.log("Asking coach follow-up:", { followupQuestion, interactionId });

            const response = await makeServerRequest(
                `/api/coach/agentic/${interactionId}/followup`,
                "POST",
                { followupQuestion }
            );

            console.log("Coach follow-up RAW server response:", JSON.stringify(response, null, 2));

            // Server returns: {success, message, coach: {question, response, simplificationLevel, context, processingTimeMs, respondedAt, interactionId}}
            if (response?.success && response?.coach?.response) {
                const normalizedResponse = {
                    _id: response.coach.interactionId || new Date().getTime(),
                    userQuestion: followupQuestion,
                    coachResponse: response.coach.response,
                    simplificationLevel: response.coach.simplificationLevel || 3,
                    createdAt: response.coach.respondedAt || new Date().toISOString(),
                    context: response.coach.context,
                };
                console.log("Coach follow-up NORMALIZED response being returned:", JSON.stringify(normalizedResponse, null, 2));
                return normalizedResponse;
            }

            console.log("WARNING: Unexpected follow-up response format");
            console.log("Response structure:", JSON.stringify(Object.keys(response || {}), null, 2));
            return {};
        } catch (err) {
            console.error("Error asking coach follow-up:", err);
            throw err;
        }
    };

    // Get all notes for user
    const getUserNotes = async () => {
        try {
            console.log("Getting user notes...");

            const response = await makeServerRequest("/api/notes", "GET");

            console.log("User notes retrieved:", response);
            return response.notes || [];
        } catch (err) {
            console.error("Error getting user notes:", err);
            return [];
        }
    };

    // Create a new note
    const createNote = async (noteData) => {
        try {
            console.log("Creating note:", noteData.title);

            const response = await makeServerRequest("/api/notes/create", "POST", noteData);

            console.log("Note created:", response);
            return response.note;
        } catch (err) {
            console.error("Error creating note:", err);
            throw err;
        }
    };

    // Delete a note
    const deleteNote = async (noteId) => {
        try {
            console.log("Deleting note:", noteId);

            const response = await makeServerRequest(`/api/notes/${noteId}`, "DELETE");

            console.log("Note deleted:", response);
            return response;
        } catch (err) {
            console.error("Error deleting note:", err);
            throw err;
        }
    };

    // Get single note
    const getNote = async (noteId) => {
        try {
            console.log("Getting note:", noteId);

            const response = await makeServerRequest(`/api/notes/${noteId}`, "GET");

            console.log("Note retrieved:", response);
            return response.note;
        } catch (err) {
            console.error("Error getting note:", err);
            throw err;
        }
    };

    // Update a note
    const updateNote = async (noteId, updateData) => {
        try {
            console.log("Updating note:", noteId);

            const response = await makeServerRequest(`/api/notes/${noteId}`, "PUT", updateData);

            console.log("Note updated:", response);
            return response.note;
        } catch (err) {
            console.error("Error updating note:", err);
            throw err;
        }
    };

    // ==========================================
    // AGENTIC NOTE FUNCTIONS
    // ==========================================

    // Create a new agentic note with AI-powered note generation
    // NEW APPROACH: Send raw prompt, backend extracts all metadata
    const agenticCreateNote = async (noteData) => {
        try {
            setIsProcessing(true);
            console.log("Creating agentic note:", noteData);

            // Support both approaches:
            // 1. NEW (recommended): Raw prompt - backend extracts everything
            // 2. OLD: Structured data - for backward compatibility
            
            let payload;
            
            if (noteData.prompt) {
                // NEW: Raw prompt - let backend extract metadata
                console.log("Using NEW approach: Sending raw prompt");
                payload = {
                    prompt: noteData.prompt,
                    sourceId: noteData.sourceId,
                    sourceType: noteData.sourceType || 'standalone',
                };
            } else {
                // OLD: Structured data (backward compatibility)
                console.log("Using OLD approach: Structured data");
                payload = {
                    content: noteData.content,
                    standard: noteData.standard || '10',
                    chapter: noteData.chapter || 'Chapter 1',
                    topic: noteData.topic || 'General',
                    subject: noteData.subject || 'General',
                    sourceId: noteData.sourceId,
                    sourceType: noteData.sourceType || 'standalone',
                    initialInstruction: noteData.initialInstruction,
                };
            }

            const response = await makeServerRequest("/api/notes/agentic/create", "POST", payload);

            console.log("Agentic note created - RAW response:", response);

            // Normalize response
            const normalized = {
                noteId: response.note?.noteId || response.noteId,
                title: response.note?.title || response.title,
                content: response.note?.content || response.contentPreview || response.content,
                contentPreview: response.note?.contentPreview || response.contentPreview,
                conversationHistoryCount: response.note?.conversationHistoryCount || 0,
                version: response.note?.version || 1,
                createdAt: response.note?.createdAt || new Date().toISOString(),
            };

            console.log("Agentic note created - NORMALIZED response:", normalized);
            return normalized;
        } catch (err) {
            console.error("Error creating agentic note:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Edit an agentic note based on instruction
    const agenticEditNote = async (noteId, editData) => {
        try {
            setIsProcessing(true);
            console.log("Editing agentic note:", noteId, editData);

            const payload = {
                editInstruction: editData.editInstruction || editData,
            };

            const response = await makeServerRequest(
                `/api/notes/agentic/${noteId}/edit`,
                "POST",
                payload
            );

            console.log("Agentic note edited - RAW response:", response);

            // Normalize response
            const normalized = {
                noteId: response.note?.noteId || noteId,
                title: response.note?.title,
                content: response.note?.content,
                contentPreview: response.note?.contentPreview,
                conversationHistoryCount: response.note?.conversationHistoryCount || 0,
                version: response.note?.version || 1,
                updatedAt: response.note?.updatedAt || new Date().toISOString(),
            };

            console.log("Agentic note edited - NORMALIZED response:", normalized);
            return normalized;
        } catch (err) {
            console.error("Error editing agentic note:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Append to an agentic note
    const agenticAppendNote = async (noteId, appendData) => {
        try {
            setIsProcessing(true);
            console.log("Appending to agentic note:", noteId, appendData);

            const payload = {
                appendInstruction: appendData.appendInstruction || appendData,
                additionalContent: appendData.additionalContent || null,
            };

            const response = await makeServerRequest(
                `/api/notes/agentic/${noteId}/append`,
                "POST",
                payload
            );

            console.log("Agentic note appended - RAW response:", response);

            // Normalize response
            const normalized = {
                noteId: response.note?.noteId || noteId,
                title: response.note?.title,
                content: response.note?.content,
                contentPreview: response.note?.contentPreview,
                conversationHistoryCount: response.note?.conversationHistoryCount || 0,
                version: response.note?.version || 1,
                updatedAt: response.note?.updatedAt || new Date().toISOString(),
            };

            console.log("Agentic note appended - NORMALIZED response:", normalized);
            return normalized;
        } catch (err) {
            console.error("Error appending to agentic note:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Get all user's agentic notes
    const agenticGetUserNotes = async () => {
        try {
            setIsProcessing(true);
            console.log("Fetching user agentic notes...");

            const response = await makeServerRequest("/api/notes/agentic/", "GET");

            console.log("User agentic notes retrieved - RAW response:", response);

            // Normalize array of notes
            const notes = (response.notes || response || []).map((note) => ({
                _id: note._id || note.noteId,
                title: note.title,
                content: note.content,
                contentPreview: note.contentPreview || note.content?.substring(0, 100),
                standard: note.standard,
                chapter: note.chapter,
                topic: note.topic,
                version: note.version || 1,
                conversationHistoryCount: note.conversationHistoryCount || 0,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
            }));

            console.log("User agentic notes - NORMALIZED response:", notes);
            return notes;
        } catch (err) {
            console.error("Error getting user agentic notes:", err);
            return [];
        } finally {
            setIsProcessing(false);
        }
    };

    // Get single agentic note with full conversation history
    const agenticGetNote = async (noteId) => {
        try {
            setIsProcessing(true);
            console.log("Fetching agentic note:", noteId);

            const response = await makeServerRequest(`/api/notes/agentic/${noteId}`, "GET");

            console.log("Agentic note retrieved - RAW response:", response);

            // Normalize response
            const normalized = {
                _id: response.note?._id || response._id,
                noteId: response.note?.noteId || response.noteId || noteId,
                title: response.note?.title || response.title,
                content: response.note?.content || response.content,
                contentPreview: response.note?.contentPreview || response.contentPreview,
                standard: response.note?.standard || response.standard,
                chapter: response.note?.chapter || response.chapter,
                topic: response.note?.topic || response.topic,
                version: response.note?.version || response.version || 1,
                conversationHistory: response.note?.conversationHistory || response.conversationHistory || [],
                agenticMetadata: response.note?.agenticMetadata || response.agenticMetadata || {},
                createdAt: response.note?.createdAt || response.createdAt,
                updatedAt: response.note?.updatedAt || response.updatedAt,
            };

            console.log("Agentic note - NORMALIZED response:", normalized);
            return normalized;
        } catch (err) {
            console.error("Error getting agentic note:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Delete an agentic note
    const agenticDeleteNote = async (noteId) => {
        try {
            setIsProcessing(true);
            console.log("Deleting agentic note:", noteId);

            const response = await makeServerRequest(
                `/api/notes/agentic/${noteId}`,
                "DELETE"
            );

            console.log("Agentic note deleted:", response);
            return response;
        } catch (err) {
            console.error("Error deleting agentic note:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // ===================================
    // SUGAMYA PUSTAKALAYA FUNCTIONS
    // ===================================

    // Get available search filters
    const getSugamyaFilters = async () => {
        try {
            setIsProcessing(true);
            console.log("Fetching Sugamya filters");

            const response = await makeServerRequest(
                `/api/sugamya/filters`,
                "GET"
            );

            console.log("Sugamya filters:", response);
            return response.filters;
        } catch (err) {
            console.error("Error fetching Sugamya filters:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Search books with filters (agentic)
    const searchSugamyaBooks = async (filters = {}) => {
        try {
            setIsProcessing(true);
            console.log("Searching Sugamya books with filters:", filters);

            const queryParams = new URLSearchParams();
            if (filters.grade) queryParams.append('grade', filters.grade);
            if (filters.language) queryParams.append('language', filters.language);
            if (filters.title) queryParams.append('title', filters.title);
            if (filters.category) queryParams.append('category', filters.category);
            if (filters.format) queryParams.append('format', filters.format);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const response = await makeServerRequest(
                `/api/sugamya/search?${queryParams.toString()}`,
                "GET"
            );

            console.log("Sugamya search results:", response);
            return response;
        } catch (err) {
            console.error("Error searching Sugamya books:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Get popular books
    const getSugamyaPopularBooks = async () => {
        try {
            setIsProcessing(true);
            console.log("Fetching Sugamya popular books");

            const response = await makeServerRequest(
                `/api/sugamya/popular`,
                "GET"
            );

            console.log("Sugamya popular books:", response);
            return response.books || [];
        } catch (err) {
            console.error("Error fetching popular books:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Get books by language
    const getSugamyaBooksByLanguage = async (language) => {
        try {
            setIsProcessing(true);
            console.log("Fetching Sugamya books for language:", language);

            const response = await makeServerRequest(
                `/api/sugamya/language?language=${language}`,
                "GET"
            );

            console.log("Sugamya books by language:", response);
            return response.books || [];
        } catch (err) {
            console.error("Error fetching books by language:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Get book details
    const getSugamyaBookDetails = async (bookId) => {
        try {
            setIsProcessing(true);
            console.log("Fetching Sugamya book details:", bookId);

            const response = await makeServerRequest(
                `/api/sugamya/book/${bookId}`,
                "GET"
            );

            console.log("Sugamya book details:", response);
            return response.book;
        } catch (err) {
            console.error("Error fetching book details:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Request book download
    const requestSugamyaDownload = async (bookId, format = null) => {
        try {
            setIsProcessing(true);
            console.log("Requesting Sugamya book download:", bookId, format);

            const response = await makeServerRequest(
                `/api/sugamya/download`,
                "POST",
                { bookId, format }
            );

            console.log("Download request created:", response);
            return response.download;
        } catch (err) {
            console.error("Error requesting download:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Get download history and status
    const getSugamyaDownloads = async (downloadId = null) => {
        try {
            setIsProcessing(true);
            console.log("Fetching Sugamya downloads");

            const query = downloadId ? `?downloadId=${downloadId}` : '';
            const response = await makeServerRequest(
                `/api/sugamya/downloads${query}`,
                "GET"
            );

            console.log("Sugamya downloads:", response);
            return response.downloads || [];
        } catch (err) {
            console.error("Error fetching downloads:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Update format preferences
    const updateSugamyaFormatPreferences = async (formats) => {
        try {
            setIsProcessing(true);
            console.log("Updating Sugamya format preferences:", formats);

            const response = await makeServerRequest(
                `/api/sugamya/preferences`,
                "PUT",
                { formats }
            );

            console.log("Format preferences updated:", response);
            return response.preferences;
        } catch (err) {
            console.error("Error updating format preferences:", err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        isAuthenticating,
        isSummarizing,
        isTranscribing,
        isProcessing,
        transcribeAudioChunk,
        processTranscript,
        createTranscript,
        generateSummary,
        getSummaries,
        askCoach,
        getCoachHistory,
        askCoachFollowup,
        getUserNotes,
        createNote,
        deleteNote,
        getNote,
        updateNote,
        agenticCreateNote,
        agenticEditNote,
        agenticAppendNote,
        agenticGetUserNotes,
        agenticGetNote,
        agenticDeleteNote,
        // Sugamya functions
        getSugamyaFilters,
        searchSugamyaBooks,
        getSugamyaPopularBooks,
        getSugamyaBooksByLanguage,
        getSugamyaBookDetails,
        requestSugamyaDownload,
        getSugamyaDownloads,
        updateSugamyaFormatPreferences,
    };
}

