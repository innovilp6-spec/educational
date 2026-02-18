import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import RNFS from 'react-native-fs';
import PrimaryButton from '../components/PrimaryButton';
import InfoButton from '../components/InfoButton';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import useVoiceModality from '../hooks/useVoiceModality';
import useSimpleSTT from '../hooks/useSimpleSTT';
import { VoiceContext } from '../context/VoiceContext';
import { useConfig } from '../hooks/useConfig';
import { NAMING_NOMENCLATURE, DETAILED_GUIDELINES, validateName } from '../utils/namingNomenclature';
import SpecialText from '../components/SpecialText';

export default function NameSessionScreen({ navigation, route }) {
  const { masterTranscript } = route.params;
  const { settings } = React.useContext(VoiceContext);
  const voiceEnabled = settings?.voiceEnabled ?? true;
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('');
  const [chapter, setChapter] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createTranscript } = useTranscriptAPI();
  const { educationStandard } = useConfig();
  const nomenclature = NAMING_NOMENCLATURE.lecture;
  const guidelines = DETAILED_GUIDELINES.lecture;

  // Voice hooks
  const sttName = useSimpleSTT({
    onTranscript: (transcript) => setName(transcript),
    autoSubmitOnSilence: false,
  });

  const sttSubject = useSimpleSTT({
    onTranscript: (transcript) => setSubject(transcript),
    autoSubmitOnSilence: false,
  });

  const sttChapter = useSimpleSTT({
    onTranscript: (transcript) => setChapter(transcript),
    autoSubmitOnSilence: false,
  });

  const commandHandlers = {
    save: async () => {
      await handleSave();
    },
    clearName: () => {
      setName('');
      voice.speakMessage('Name cleared');
    },
  };

  const voice = useVoiceModality('NameSessionScreen', commandHandlers, {
    enableAutoTTS: true,
  });

  // Initialize standard from user profile
  useEffect(() => {
    if (educationStandard) {
      setStandard(String(educationStandard));
      console.log('[NameSessionScreen] Standard pre-filled from profile:', educationStandard);
    }
  }, [educationStandard]);

  // Debug log
  console.log('[NameSessionScreen] Received params:', route.params);
  console.log('[NameSessionScreen] Transcript length:', masterTranscript?.length || 0);
  console.log('[NameSessionScreen] Transcript preview:', masterTranscript?.substring(0, 100) || 'EMPTY');
  console.log('[NameSessionScreen] User standard from profile:', educationStandard);

  const handleSave = async () => {
    // Validate name
    const validation = validateName('lecture', name);
    if (!validation.valid) {
      Alert.alert('Invalid Name', validation.error);
      return;
    }

    // Validate required fields
    if (!chapter.trim()) {
      Alert.alert('Required', 'Please enter a chapter/topic');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Required', 'Please enter a subject');
      return;
    }

    const sessionName = name || `Lecture_${new Date().toDateString()}`;

    try {
      setIsLoading(true);

      console.log('[NameSessionScreen] Creating transcript on server...');
      console.log('[NameSessionScreen] Sending data:', {
        transcriptLength: masterTranscript?.length,
        standard,
        chapter,
        topic: sessionName,
        subject,
        sessionName,
      });

      // Create transcript on server to get transcriptId
      const response = await createTranscript(
        masterTranscript,
        standard,
        chapter,
        sessionName,
        subject,
        sessionName
      );

      const transcriptId = response._id || response.transcriptId || response.transcript?.transcriptId;

      if (!transcriptId) {
        throw new Error('No transcript ID received from server');
      }

      console.log('Transcript created with ID:', transcriptId);

      // Save transcriptId and transcript to local files for later retrieval
      try {
        const sessionFolder = `${RNFS.DocumentDirectoryPath}/${sessionName.replace(/\s+/g, '_')}`;

        // Create session folder if it doesn't exist
        const exists = await RNFS.exists(sessionFolder);
        if (!exists) {
          await RNFS.mkdir(sessionFolder, { NSURLIsExcludedFromBackupKey: true });
        }

        // Save transcript content
        await RNFS.writeFile(`${sessionFolder}/transcript.txt`, masterTranscript, 'utf8');

        // Save metadata (including transcriptId for later use)
        const metadata = {
          transcriptId,
          sessionName,
          createdAt: new Date().toISOString(),
          standard,
          chapter,
          subject,
        };
        await RNFS.writeFile(`${sessionFolder}/metadata.json`, JSON.stringify(metadata, null, 2), 'utf8');

        console.log('Saved transcript and metadata locally');
      } catch (fileErr) {
        console.error('Warning: Could not save local files:', fileErr);
        // Continue anyway - server data is what matters
      }

      // Navigate to the Transcript Viewer screen with the session name, transcript, and transcriptId
      navigation.replace('TranscriptViewer', {
        sessionName,
        transcript: masterTranscript,
        transcriptId,
      });
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', `Failed to save the session: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.innerContainer}>
        <View style={styles.titleSection}>
          <SpecialText style={styles.title}>Name this lecture</SpecialText>
        </View>
        <View style={styles.infobuttonContainer}>
          <InfoButton
            title={guidelines.title}
            rules={guidelines.rules}
            tips={guidelines.tips}
            size={24}
            color="#007AFF"
          />
        </View>

        {/* Nomenclature Pattern Display */}
        <View style={styles.patternCard}>
          <SpecialText style={styles.patternLabel}>Suggested Format:</SpecialText>
          <SpecialText style={styles.pattern}>{nomenclature.pattern}</SpecialText>
          <SpecialText style={styles.patternExample}>Example: {nomenclature.example}</SpecialText>
        </View>

        {/* Guidelines Display */}
        <View style={styles.guidelinesCard}>
          <SpecialText style={styles.guidelinesTitle}>Quick Guidelines:</SpecialText>
          {nomenclature.guidelines.map((guideline, index) => (
            <SpecialText key={index} style={styles.guidelineItem}>
              {guideline}
            </SpecialText>
          ))}
        </View>

        {/* Examples */}
        <View style={styles.examplesCard}>
          <SpecialText style={styles.examplesTitle}>Examples of Good Names:</SpecialText>
          {nomenclature.examples.map((example, index) => (
            <SpecialText key={index} style={styles.exampleItem}>
              <Text>✓</Text> {example}
            </SpecialText>
          ))}
        </View>

        <SpecialText style={styles.inputLabel}>Enter Lecture Name:</SpecialText>
        <View style={styles.inputWithMic}>
          <TextInput
            style={[styles.input, styles.inputWithMicText]}
            placeholder={nomenclature.example}
            placeholderTextColor="#bbb"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
            maxLength={100}
          />
          {voiceEnabled && (
            <TouchableOpacity
              style={[styles.micButton, sttName.isListening && styles.micButtonListening]}
              onPress={() => sttName.isListening ? sttName.stopListening() : sttName.startListening()}
              disabled={isLoading}
            >
              <Text style={styles.micButtonText}>{sttName.isListening ? '🔴' : '🎤'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {voiceEnabled && sttName.transcript && !sttName.error && (
          <View style={styles.voiceTranscriptBubble}>
            <SpecialText style={styles.voiceTranscriptText}>Heard: {sttName.transcript}</SpecialText>
          </View>
        )}

        {voiceEnabled && sttName.error && (
          <View style={styles.voiceErrorBubble}>
            <SpecialText style={styles.voiceErrorText}>{sttName.error}</SpecialText>
          </View>
        )}

        {name.length > 0 && (
          <SpecialText style={styles.charCount}>{name.length}/100 characters</SpecialText>
        )}

        {/* Subject Field */}
        <SpecialText style={styles.inputLabel}>Subject:</SpecialText>
        <View style={styles.inputWithMic}>
          <TextInput
            style={[styles.input, styles.inputWithMicText]}
            placeholder="e.g., Mathematics, Science, English"
            placeholderTextColor="#bbb"
            value={subject}
            onChangeText={setSubject}
            editable={!isLoading}
            maxLength={50}
          />
          {voiceEnabled && (
            <TouchableOpacity
              style={[styles.micButton, sttSubject.isListening && styles.micButtonListening]}
              onPress={() => sttSubject.isListening ? sttSubject.stopListening() : sttSubject.startListening()}
              disabled={isLoading}
            >
              <Text style={styles.micButtonText}>{sttSubject.isListening ? '🔴' : '🎤'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {voiceEnabled && sttSubject.transcript && !sttSubject.error && (
          <View style={styles.voiceTranscriptBubble}>
            <SpecialText style={styles.voiceTranscriptText}>Heard: {sttSubject.transcript}</SpecialText>
          </View>
        )}

        {voiceEnabled && sttSubject.error && (
          <View style={styles.voiceErrorBubble}>
            <SpecialText style={styles.voiceErrorText}>{sttSubject.error}</SpecialText>
          </View>
        )}

        {/* Chapter/Topic Field */}
        <SpecialText style={styles.inputLabel}>Chapter/Topic:</SpecialText>
        <View style={styles.inputWithMic}>
          <TextInput
            style={[styles.input, styles.inputWithMicText]}
            placeholder="e.g., Chapter 5, Data Types, Algebra Basics"
            placeholderTextColor="#bbb"
            value={chapter}
            onChangeText={setChapter}
            editable={!isLoading}
            maxLength={100}
          />
          {voiceEnabled && (
            <TouchableOpacity
              style={[styles.micButton, sttChapter.isListening && styles.micButtonListening]}
              onPress={() => sttChapter.isListening ? sttChapter.stopListening() : sttChapter.startListening()}
              disabled={isLoading}
            >
              <Text style={styles.micButtonText}>{sttChapter.isListening ? '🔴' : '🎤'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {voiceEnabled && sttChapter.transcript && !sttChapter.error && (
          <View style={styles.voiceTranscriptBubble}>
            <SpecialText style={styles.voiceTranscriptText}>Heard: {sttChapter.transcript}</SpecialText>
          </View>
        )}

        {voiceEnabled && sttChapter.error && (
          <View style={styles.voiceErrorBubble}>
            <SpecialText style={styles.voiceErrorText}>{sttChapter.error}</SpecialText>
          </View>
        )}

        {/* Standard/Grade Field */}
        <SpecialText style={styles.inputLabel}>Standard/Grade:</SpecialText>
        <TextInput
          readOnly
          style={styles.input}
          placeholder="e.g., 10 (for Grade 10/Class 10)"
          placeholderTextColor="#bbb"
          value={standard}
          onChangeText={setStandard}
          editable={!isLoading}
          maxLength={2}
          keyboardType="numeric"
        />
        <SpecialText style={styles.helpText}>Valid values: 6, 7, 8, 9, 10, 11, 12</SpecialText>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <SpecialText style={styles.loadingText}>Creating transcript...</SpecialText>
          </View>
        )}

        <PrimaryButton
          title="Save"
          onPress={handleSave}
          disabled={isLoading || name.trim().length === 0}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  innerContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  titleSection: {
    marginBottom: 12,
    alignItems: 'center',
  },
  infobuttonContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },

  // Pattern Card
  patternCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  patternLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pattern: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  patternExample: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },

  // Guidelines Card
  guidelinesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  guidelineItem: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginBottom: 8,
  },

  // Examples Card
  examplesCard: {
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#27ae60',
    marginBottom: 12,
  },
  exampleItem: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
    marginBottom: 8,
  },

  // Input Section
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
    padding: 14,
    marginBottom: 4,
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginBottom: 16,
  },
  helpText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 12,
  },
  inputWithMic: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  inputWithMicText: {
    flex: 1,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  micButtonListening: {
    backgroundColor: '#ffebee',
    borderColor: '#ff4444',
  },
  micButtonText: {
    fontSize: 18,
  },
  voiceTranscriptBubble: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  voiceTranscriptText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  voiceErrorBubble: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff4444',
  },
  voiceErrorText: {
    fontSize: 12,
    color: '#ff4444',
    fontWeight: '500',
  },
});

