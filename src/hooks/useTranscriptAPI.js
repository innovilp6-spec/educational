import { useState, useMemo } from "react";

export default function useTranscriptAPI() {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const model = "gpt-4.1";
    const apiVersion = "2024-08-01-preview";

    const endpoint = useMemo(() => `https://ots-openai.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=${apiVersion}`, []);

    const makeOpenAIRequest = async (prompt) => {
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

    return {
        isAuthenticating,
        isSummarizing,
        authenticateKey,
        summarizeTranscript
    };
}
