import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, TextInput, Alert } from 'react-native';
import SpecialText from '../components/SpecialText';
import useVoiceModality from '../hooks/useVoiceModality';
import { VoiceContext } from '../context/VoiceContext';

export default function TranscriptScreen({ route, navigation }) {
  const { transcript } = route.params;
  const { settings } = React.useContext(VoiceContext);
  const voiceEnabled = settings?.voiceEnabled ?? true;
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // Voice command handlers
  const voiceCommandHandlers = {
    search: async () => {
      console.log('[TRANSCRIPT-VOICE] Search opened');
      setShowSearch(!showSearch);
      voice.speakMessage('Search mode toggled');
    },
    goHome: async () => {
      console.log('[TRANSCRIPT-VOICE] Go home');
      voice.speakMessage('Going home');
      setTimeout(() => navigation.navigate('Home'), 500);
    },
    goBack: async () => {
      console.log('[TRANSCRIPT-VOICE] Go back');
      voice.speakMessage('Going back');
      setTimeout(() => navigation.goBack(), 500);
    },
  };

  const voice = useVoiceModality('TranscriptScreen', voiceCommandHandlers, {
    enableAutoTTS: true,
  });

  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim()) {
      const regex = new RegExp(text, 'gi');
      const matches = transcript.match(regex) || [];
      setSearchResults(matches);
    }
  };

  return (
    <View style={styles.container}>
      {/* Mic Button */}
      <View style={styles.header}>
        <SpecialText style={styles.heading}>Lecture Transcript</SpecialText>
        {voiceEnabled && (
          <TouchableOpacity
            style={[
              styles.micButton,
              voice.isListening && styles.micButtonListening,
            ]}
            onPress={() => {
              if (voice.isListening) {
                voice.stopListening();
              } else {
                voice.startListening();
              }
            }}
            disabled={voice.isListening}
            activeOpacity={voice.isListening ? 1 : 0.7}
          >
            <Text style={styles.micButtonIcon}>
              {voice.isListening ? '🔴' : '🎤'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Voice Transcript Bubble */}
      {voiceEnabled && voice.currentTranscript && !voice.error && (
        <View style={styles.voiceTranscriptBubble}>
          <Text style={styles.voiceTranscriptLabel}>Heard:</Text>
          <SpecialText style={styles.voiceTranscriptText}>{voice.currentTranscript}</SpecialText>
        </View>
      )}

      {/* Voice Error Bubble */}
      {voiceEnabled && voice.error && (
        <View style={styles.voiceErrorBubble}>
          <SpecialText style={styles.voiceErrorText}>{voice.error}</SpecialText>
          <TouchableOpacity onPress={voice.clearError} style={styles.voiceErrorDismiss}>
            <Text style={styles.voiceErrorDismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Section */}
      {showSearch && (
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search transcript..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchText && (
            <SpecialText style={styles.searchResults}>
              Found {searchResults.length} matches for "{searchText}"
            </SpecialText>
          )}
        </View>
      )}

      {/* Transcript */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <SpecialText style={styles.text}>{transcript}</SpecialText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  contentContainer: {
    padding: 20,
  },
  text: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonListening: {
    backgroundColor: '#ffcdd2',
    borderColor: '#ef5350',
    borderWidth: 2,
  },
  micButtonIcon: {
    fontSize: 20,
  },
  voiceTranscriptBubble: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  voiceTranscriptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  voiceTranscriptText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  voiceErrorBubble: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef5350',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceErrorText: {
    fontSize: 13,
    color: '#c62828',
    flex: 1,
  },
  voiceErrorDismiss: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voiceErrorDismissText: {
    fontSize: 18,
    color: '#c62828',
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  searchResults: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});
