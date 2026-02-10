import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import RNFS from 'react-native-fs';
import PrimaryButton from '../components/PrimaryButton';
import InfoButton from '../components/InfoButton';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import { NAMING_NOMENCLATURE, DETAILED_GUIDELINES, validateName } from '../utils/namingNomenclature';

export default function NameSessionScreen({ navigation, route }) {
  const { transcript } = route.params;
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createTranscript } = useTranscriptAPI();
  const nomenclature = NAMING_NOMENCLATURE.lecture;
  const guidelines = DETAILED_GUIDELINES.lecture;

  const handleSave = async () => {
    // Validate name
    const validation = validateName('lecture', name);
    if (!validation.valid) {
      Alert.alert('Invalid Name', validation.error);
      return;
    }

    const sessionName = name || `Lecture_${new Date().toDateString()}`;

    try {
      setIsLoading(true);

      console.log('Creating transcript on server...');

      // Create transcript on server to get transcriptId
      const response = await createTranscript(
        transcript,
        '10',              // standard (valid enum: 6, 7, 8, 9, 10, 11, 12)
        'Chapter 1',       // chapter
        sessionName,       // topic
        'General',         // subject
        sessionName        // sessionName (required field)
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
        await RNFS.writeFile(`${sessionFolder}/transcript.txt`, transcript, 'utf8');

        // Save metadata (including transcriptId for later use)
        const metadata = {
          transcriptId,
          sessionName,
          createdAt: new Date().toISOString(),
          standard: '10',
          chapter: 'Chapter 1',
          subject: 'General',
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
        transcript,
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
          <Text style={styles.title}>Name this lecture</Text>
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
          <Text style={styles.patternLabel}>Suggested Format:</Text>
          <Text style={styles.pattern}>{nomenclature.pattern}</Text>
          <Text style={styles.patternExample}>Example: {nomenclature.example}</Text>
        </View>

        {/* Guidelines Display */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>Quick Guidelines:</Text>
          {nomenclature.guidelines.map((guideline, index) => (
            <Text key={index} style={styles.guidelineItem}>
              {guideline}
            </Text>
          ))}
        </View>

        {/* Examples */}
        <View style={styles.examplesCard}>
          <Text style={styles.examplesTitle}>Examples of Good Names:</Text>
          {nomenclature.examples.map((example, index) => (
            <Text key={index} style={styles.exampleItem}>
              ✓ {example}
            </Text>
          ))}
        </View>

        <Text style={styles.inputLabel}>Enter Lecture Name:</Text>
        <TextInput
          style={styles.input}
          placeholder={nomenclature.example}
          placeholderTextColor="#bbb"
          value={name}
          onChangeText={setName}
          editable={!isLoading}
          maxLength={100}
        />

        {name.length > 0 && (
          <Text style={styles.charCount}>{name.length}/100 characters</Text>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Creating transcript...</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    flex: 1,
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
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
    padding: 14,
    marginBottom: 8,
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
});

