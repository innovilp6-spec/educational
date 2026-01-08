import { useState, useMemo } from "react";
import { AZURE_OPENAI_API_KEY } from 'react-native-dotenv';

export default function useTranscriptAPI() {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const model = "gpt-4.1";
    const apiVersion = "2024-08-01-preview";

    const endpoint = useMemo(() => `https://ots-openai.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=${apiVersion}`, []);

    const makeOpenAIRequest = async (prompt) => {
        console.log(AZURE_OPENAI_API_KEY);
        const storedKey = "BMnLqzun2vpeAAxx4P95sKJND31hGejLauqID6pwgWqWONZNxNcQJQQJ99BIACYeBjFXJ3w3AAABACOG3jDa";
        if (!storedKey) {
            throw new Error("No API key found. Please configure your OpenAI API key first.");
        }

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": storedKey,
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (errorData.error) {
                    throw new Error(errorData.error.message);
                }
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            if (!data.choices || !data.choices[0]?.message?.content) {
                throw new Error("Invalid response format from OpenAI API");
            }
            return data.choices[0].message.content.trim();
        } catch (err) {
            throw err;
        }
    };

    const authenticateKey = async () => {
        try {
            setIsAuthenticating(true);
            await makeOpenAIRequest("Respond with 'OK' if you can read this message.");
        } catch (err) {
            throw err;
        } finally {
            setIsAuthenticating(false);
        }
    };

    const summarizeTranscript = async (transcriptText, summaryType) => {
        try {
            setIsSummarizing(true);
            const prompt = `Generate a ${summaryType} summary of the following transcript: "${transcriptText}"`;
            const summary = await makeOpenAIRequest(prompt);
            return summary;
        } catch (err) {
            throw err;
        } finally {
            setIsSummarizing(false);
        }
    };

    // Transcribe a single audio chunk - DUMMY ENDPOINT
    const transcribeAudioChunk = async (audioFilePath) => {
        try {
            setIsTranscribing(true);
            // TODO: Replace with actual Transcribe API endpoint
            // This is a dummy implementation - will be replaced with real transcription service
            console.log('Transcribing audio chunk:', audioFilePath);

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Return dummy transcription
            const dummyTranscriptions = [
                "The lecture covers fundamental concepts in computer science.",
                "We discuss data structures and algorithms.",
                "Time complexity and space complexity are important considerations.",
                "We also covered sorting algorithms like quicksort and mergesort.",
                "These algorithms have different trade-offs in performance.",
                "These algorithms have different time complexities.",
                "These algorithms have different space complexities.",
                "These algorithms have different intuitions.",
            ];

            return dummyTranscriptions[Math.floor(Math.random() * dummyTranscriptions.length)];
        } catch (err) {
            console.error('Error transcribing audio:', err);
            throw err;
        } finally {
            setIsTranscribing(false);
        }
    };

    // Process master transcript - Uses OpenAI API
    const processTranscript = async (masterTranscript) => {
        try {
            setIsProcessing(true);
            console.log('Processing master transcript...');
            const prompt = `Clean and organize the following transcript, fixing any transcription errors and improving clarity. Do not include any other text in the output and it should be generated as plain text not markdown: "${masterTranscript}"`;
            const processedTranscript = await makeOpenAIRequest(prompt);
            console.log('Transcript processing complete');
            return processedTranscript;
        } catch (err) {
            console.error('Error processing transcript:', err);
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
        authenticateKey,
        summarizeTranscript,
        transcribeAudioChunk,
        processTranscript,
    };
}

