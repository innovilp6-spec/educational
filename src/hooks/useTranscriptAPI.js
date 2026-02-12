import { useState, useMemo } from "react";
import RNFS from 'react-native-fs';
import { useAuth } from '../context/AuthContext';

const SERVER_BASE_URL = "http://10.0.2.2:5000";

export default function useTranscriptAPI() {
    const { getUserEmail } = useAuth();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Get current user's email from AuthContext
    const USER_EMAIL = getUserEmail();

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
                console.log(`[makeServerRequest] Body to send:`, body);
                console.log(`[makeServerRequest] Stringified body:`, options.body);
            }

            const url = `${SERVER_BASE_URL}${endpoint}`;
            console.log(`[makeServerRequest] Making ${method} request to: ${url}`);
            console.log(`[makeServerRequest] User email in header: ${USER_EMAIL}`);
            console.log(`[makeServerRequest] Options:`, options);

            const res = await fetch(url, options);

            if (!res.ok) {
                const errorData = await res.text();
                console.error(`[makeServerRequest] API Error (${res.status}):`, errorData);
                throw new Error(`HTTP ${res.status}: ${errorData}`);
            }

            const data = await res.json();
            return data;
        } catch (err) {
            console.error("[makeServerRequest] Server request error:", err);
            throw err;
        }
    };

    // Transcribe audio chunk using server's transcribe endpoint
    const transcribeAudioChunk = async (audioFilePath) => {
        try {
            setIsTranscribing(true);
            console.log('\n[transcribeAudioChunk] ===== START TRANSCRIPTION =====');
            console.log("[transcribeAudioChunk] Audio file path:", audioFilePath);

            const fileName = audioFilePath.split('/').pop();
            console.log("[transcribeAudioChunk] File name:", fileName);

            // Read file as base64
            console.log("[transcribeAudioChunk] Reading file from disk...");
            const audioBase64 = await RNFS.readFile(audioFilePath, 'base64');
            console.log("[transcribeAudioChunk] File loaded successfully");
            console.log("[transcribeAudioChunk] File size (base64):", audioBase64.length, "characters");

            // Send to server as JSON with base64 data
            const serverUrl = `${SERVER_BASE_URL}/api/lectures/transcribe-audio`;
            console.log("[transcribeAudioChunk] Server URL:", serverUrl);
            console.log("[transcribeAudioChunk] User email:", USER_EMAIL);

            console.log("[transcribeAudioChunk] Preparing JSON payload...");
            const payload = {
                audioData: audioBase64,
                fileName: fileName,
            };
            console.log("[transcribeAudioChunk] Payload keys:", Object.keys(payload));
            console.log("[transcribeAudioChunk] Payload size:", JSON.stringify(payload).length, "bytes");

            console.log("[transcribeAudioChunk] Sending POST request...");
            const response = await fetch(serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': USER_EMAIL,
                },
                body: JSON.stringify(payload),
            });

            console.log("[transcribeAudioChunk] Response received");
            console.log("[transcribeAudioChunk] Response status:", response.status);
            console.log("[transcribeAudioChunk] Response status text:", response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[transcribeAudioChunk] Error response body:", errorText);
                throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log("[transcribeAudioChunk] Response JSON received");
            console.log("[transcribeAudioChunk] Response keys:", Object.keys(result));

            const transcribedText = result.transcription?.text || result.text || '';
            console.log("[transcribeAudioChunk] Transcribed text length:", transcribedText.length);
            console.log("[transcribeAudioChunk] Text preview:", transcribedText.substring(0, 100) + '...');
            console.log('[transcribeAudioChunk] ===== SUCCESS =====\n');

            return transcribedText;
        } catch (err) {
            console.error("[transcribeAudioChunk] ===== ERROR =====");
            console.error("[transcribeAudioChunk] Error message:", err.message);
            console.error("[transcribeAudioChunk] Error stack:", err.stack);
            console.error("[transcribeAudioChunk] ===== END ERROR =====\n");
            throw err;
        } finally {
            setIsTranscribing(false);
        }
    };

    // Helper to determine MIME type
    const getMimeType = (filePath) => {
        const ext = filePath.toLowerCase().split('.').pop();
        const mimeTypes = {
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg',
            'm4a': 'audio/mp4',
            'aac': 'audio/aac',
            'ogg': 'audio/ogg',
            'flac': 'audio/flac',
        };
        return mimeTypes[ext] || 'audio/wav';
    };

    // Create transcript on server from chunks
    const createTranscript = async (transcriptText, standard, chapter, topic, subject, sessionName) => {
        try {
            setIsProcessing(true);
            console.log("[createTranscript] Starting...");
            console.log("[createTranscript] Params:", {
                transcriptTextLength: transcriptText?.length,
                standard,
                chapter,
                topic,
                subject,
                sessionName,
            });

            const payload = {
                transcriptText,
                standard,
                chapter,
                topic,
                subject,
                sessionName,
            };

            console.log("[createTranscript] Payload to send:", payload);

            const response = await makeServerRequest("/api/lectures/transcript", "POST", payload);

            console.log("[createTranscript] Response:", response);
            return response;
        } catch (err) {
            console.error("[createTranscript] Error:", err);
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
            console.log(`[generateSummary] ===== START =====`);
            console.log(`[generateSummary] Transcript ID:`, transcriptId);
            console.log(`[generateSummary] Summary type:`, summaryType);
            console.log(`[generateSummary] Generating ${summaryType} summary from server...`);

            const endpoint = `/api/lectures/transcript/${transcriptId}/summary`;
            console.log(`[generateSummary] Endpoint:`, endpoint);

            const response = await makeServerRequest(
                endpoint,
                "POST",
                { summaryType }
            );

            console.log("[generateSummary] Summary generated successfully");
            console.log("[generateSummary] Response:", response);
            return response.summary?.content || "";
        } catch (err) {
            console.error("[generateSummary] Error generating summary:", err);
            console.error("[generateSummary] Error message:", err.message);
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
                // NOTE: Do NOT send messageType - backend will classify it based on content
            });

            console.log("Coach RAW response received:", JSON.stringify(response, null, 2));

            // Check for context-switch response (message not saved)
            if (response?.isContextSwitch) {
                console.log("Coach returned: Context-switch detected - message NOT saved");
                return {
                    isContextSwitch: true,
                    success: true
                };
            }

            // Handle new response format: {success, interactionId, coachResponse, createdAt, ...}
            if (response?.success && response?.interactionId && response?.coachResponse) {
                console.log("Coach returned: Study message saved successfully");
                return {
                    _id: response.interactionId,
                    interactionId: response.interactionId,
                    userQuestion: question,
                    coachResponse: response.coachResponse,
                    simplificationLevel: response.simplificationLevel || simplificationLevel,
                    createdAt: response.createdAt || new Date().toISOString(),
                    responseType: response.responseType,
                    processingTime: response.processingTime,
                };
            }

            // Legacy format fallback: {success, data: {response, context, metadata}}
            if (response?.success && response?.data?.response?.answer) {
                console.log("Coach returned: Legacy response format");
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

            console.log("WARNING: Unexpected response format - missing required fields");
            console.log("Response structure:", JSON.stringify(response, null, 2));
            return {};
        } catch (err) {
            console.error("Error asking coach:", err);
            throw err;
        }
    };

    // Get coach interaction history
    const getCoachHistory = async (contextId = null, contextType = null) => {
        try {
            console.log("[Hook getCoachHistory] Called with:", { contextId, contextType });
            console.log("[Hook getCoachHistory] contextId is null?", contextId === null);
            console.log("[Hook getCoachHistory] contextId value:", contextId);
            console.log("[Hook getCoachHistory] contextType value:", contextType);

            // Build query string
            const params = new URLSearchParams();
            if (contextId) {
                params.append('contextId', contextId);
                console.log("[Hook getCoachHistory] Added contextId to params");
            } else {
                console.log("[Hook getCoachHistory] contextId is falsy, not adding to params");
            }
            if (contextType) {
                params.append('contextType', contextType);
                console.log("[Hook getCoachHistory] Added contextType to params");
            }

            const queryString = params.toString() ? `?${params.toString()}` : '';
            console.log("[Hook getCoachHistory] Final query string:", queryString);
            
            const response = await makeServerRequest(`/api/coach/agentic/history${queryString}`, "GET");

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

    // Generate quiz based on topic
    const generateQuiz = async (topic, simplificationLevel = 3, contextType = "general", contextId = null) => {
        try {
            console.log("Generating quiz:", { topic, contextType, contextId, simplificationLevel });

            const response = await makeServerRequest("/api/coach/agentic/quiz", "POST", {
                topic,
                simplificationLevel,
                contextType,
                contextId,
            });

            console.log("Quiz generated response:", JSON.stringify(response, null, 2));

            if (response?.success && response?.quiz && response?.quizSessionId) {
                return {
                    quizSessionId: response.quizSessionId,
                    quiz: response.quiz,
                    processingTime: response.processingTime,
                };
            }

            throw new Error("Failed to generate quiz");
        } catch (err) {
            console.error("Error generating quiz:", err);
            throw err;
        }
    };

    // Submit quiz answers and get evaluation
    const submitQuizAnswers = async (quizSessionId, answers) => {
        try {
            console.log("Submitting quiz answers:", { quizSessionId, answersCount: Object.keys(answers).length });

            const response = await makeServerRequest(
                `/api/coach/agentic/quiz/${quizSessionId}/submit`,
                "POST",
                { answers }
            );

            console.log("Quiz evaluation response:", JSON.stringify(response, null, 2));

            if (response?.success) {
                return {
                    evaluationId: response.evaluationId,
                    marksObtained: response.marksObtained,
                    totalMarks: response.totalMarks,
                    correctAnswers: response.correctAnswers,
                    totalQuestions: response.totalQuestions,
                    isPassed: response.isPassed,
                    remarks: response.remarks,
                    detailedResults: response.detailedResults,
                    processingTime: response.processingTime,
                };
            }

            throw new Error("Failed to evaluate quiz");
        } catch (err) {
            console.error("Error submitting quiz answers:", err);
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

    // Request book download with format selection
    const requestSugamyaDownload = async (bookId, format = 'DAISY Text Only') => {
        try {
            setIsProcessing(true);
            console.log('[useTranscriptAPI] Requesting Sugamya book download:', { bookId, format });

            if (!bookId) {
                throw new Error('Book ID is required');
            }

            if (!format) {
                throw new Error('Format selection is required');
            }

            const response = await makeServerRequest(
                `/api/sugamya/download`,
                'POST',
                { bookId, format }
            );

            console.log('[useTranscriptAPI] Download request response:', response);

            if (response.success) {
                return {
                    success: true,
                    message: response.message,
                    download: response.download,
                    downloadId: response.download?._id,
                    status: response.download?.status || 'processing',
                    sugamyaBookId: response.download?.sugamyaBookId,
                    format: response.download?.format,
                    formatId: response.download?.formatId,
                };
            } else {
                throw new Error(response.message || 'Failed to request download');
            }
        } catch (err) {
            console.error('[useTranscriptAPI] Error requesting download:', err.message);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Get download history and status
    const getSugamyaDownloads = async (downloadId = null) => {
        try {
            setIsProcessing(true);
            console.log('[useTranscriptAPI] Fetching Sugamya downloads', { downloadId });

            const query = downloadId ? `?downloadId=${downloadId}` : '';
            const response = await makeServerRequest(
                `/api/sugamya/downloads${query}`,
                'GET'
            );

            console.log('[useTranscriptAPI] Sugamya downloads response:', response);

            // Ensure downloads is an array
            const downloads = response.downloads || [];

            return downloads.map(d => ({
                _id: d._id || d.downloadId,
                downloadId: d._id || d.downloadId,
                sugamyaBookId: d.sugamyaBookId,
                bookTitle: d.bookTitle,
                bookAuthor: d.bookAuthor,
                format: d.format || d.requestedFormat,
                formatId: d.formatId,
                status: d.status,
                progress: d.progress || 0,
                requestedAt: d.createdAt,
                completedAt: d.completedAt,
            }));
        } catch (err) {
            console.error('[useTranscriptAPI] Error fetching downloads:', err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Get user's download requests from NALP
    const getSugamyaDownloadRequests = async (page = 1, limit = 10) => {
        try {
            setIsProcessing(true);
            console.log('[useTranscriptAPI] Fetching Sugamya download requests', { page, limit });

            const response = await makeServerRequest(
                `/api/sugamya/download-requests?page=${page}&limit=${limit}`,
                'GET'
            );

            console.log('[useTranscriptAPI] Download requests response:', response);

            // Normalize response based on backend structure
            const requests = response.books || response.requests || response.data || [];

            return {
                requests: requests.map(item => ({
                    requestId: item.requestId || item.bookId,
                    bookId: item.bookId,
                    bookTitle: item.bookTitle || item.title,
                    bookAuthor: item.bookAuthor || item.author,
                    format: item.format,
                    status: item.status || 'pending',
                    expiryDate: item.expiryDate,
                    downloadLink: item.downloadLink,
                    requestDate: item.requestDate,
                })),
                totalCount: response.totalCount || response.meta?.totalResults || requests.length,
                page: response.page || page,
                limit: response.limit || limit,
            };
        } catch (err) {
            console.error('[useTranscriptAPI] Error fetching download requests:', err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    // Get user's view history from Sugamya
    const getSugamyaUserHistory = async (page = 1, limit = 10) => {
        try {
            setIsProcessing(true);
            console.log('[useTranscriptAPI] Fetching Sugamya user history', { page, limit });

            const response = await makeServerRequest(
                `/api/sugamya/history?page=${page}&limit=${limit}`,
                'GET'
            );

            console.log('[useTranscriptAPI] User history response:', response);

            // Normalize response based on backend structure
            const history = response.books || response.history || response.data || [];

            return {
                history: history.map(item => ({
                    bookId: item.bookId,
                    bookTitle: item.bookTitle || item.title,
                    bookAuthor: item.bookAuthor || item.author,
                    format: item.format,
                    status: item.status || 'viewed',
                    viewedDate: item.viewedDate,
                    downloadLink: item.downloadLink,
                })),
                totalCount: response.totalCount || response.meta?.totalResults || history.length,
                page: response.page || page,
                limit: response.limit || limit,
            };
        } catch (err) {
            console.error('[useTranscriptAPI] Error fetching user history:', err);
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

    // Detect context hint in user message
    const detectContextHint = async (message) => {
        try {
            console.log("Detecting context hint in message:", message);

            const response = await makeServerRequest(
                `/api/coach/agentic/detect-hint`,
                "POST",
                { message }
            );

            console.log("Context hint detection response:", response);
            return response;
        } catch (err) {
            console.error("Error detecting context hint:", err);
            throw err;
        }
    };

    // Confirm and switch context
    const confirmContextSwitch = async (selectedContextId, selectedContextType) => {
        try {
            console.log("[Hook] confirmContextSwitch called with:", { selectedContextId, selectedContextType });
            console.log("[Hook] selectedContextId type:", typeof selectedContextId, "value:", selectedContextId);
            console.log("[Hook] selectedContextType type:", typeof selectedContextType, "value:", selectedContextType);

            const payload = { selectedContextId, selectedContextType };
            console.log("[Hook] Payload being sent:", JSON.stringify(payload));

            const response = await makeServerRequest(
                `/api/coach/agentic/confirm-context`,
                "POST",
                payload
            );

            console.log("Context switch confirmed:", response);
            return response;
        } catch (err) {
            console.error("Error confirming context switch:", err);
            throw err;
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
        generateQuiz,
        submitQuizAnswers,
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
        getSugamyaDownloadRequests,
        getSugamyaUserHistory,
        updateSugamyaFormatPreferences,
        detectContextHint,
        confirmContextSwitch,
    };
}
