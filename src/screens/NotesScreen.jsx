import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import PrimaryButton from '../components/PrimaryButton';
import InfoButton from '../components/InfoButton';
import { NAMING_NOMENCLATURE, DETAILED_GUIDELINES, validateName } from '../utils/namingNomenclature';

export default function NotesScreen({ navigation }) {
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newNoteData, setNewNoteData] = useState({
        title: '',
        name: '',
        content: '',
        standard: '10',
        chapter: '',
        topic: '',
        tags: '',
    });

    const { getUserNotes, createNote, deleteNote } = useTranscriptAPI();

    // Load notes on mount
    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            setIsLoading(true);
            console.log('Loading user notes...');
            const userNotes = await getUserNotes();
            console.log('Notes loaded:', userNotes);
            setNotes(userNotes);
        } catch (error) {
            console.error('Error loading notes:', error);
            Alert.alert('Error', 'Failed to load notes. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNote = async () => {
        if (!newNoteData.title || !newNoteData.content) {
            Alert.alert('Error', 'Title and content are required');
            return;
        }

        // Validate title
        const validation = validateName('note', newNoteData.title);
        if (!validation.valid) {
            Alert.alert('Invalid Title', validation.error);
            return;
        }

        try {
            setIsLoading(true);
            console.log('Creating new note...');

            const noteResponse = await createNote({
                title: newNoteData.title,
                name: newNoteData.name,
                content: newNoteData.content,
                standard: newNoteData.standard,
                chapter: newNoteData.chapter,
                topic: newNoteData.topic,
                tags: newNoteData.tags ? newNoteData.tags.split(',').map(t => t.trim()) : [],
            });

            console.log('Note created:', noteResponse);

            // Reset form
            setNewNoteData({
                title: '',
                name: '',
                content: '',
                standard: '10',
                chapter: '',
                topic: '',
                tags: '',
            });
            setShowCreateForm(false);

            // Reload notes
            await loadNotes();

            Alert.alert('Success', 'Note created successfully');
        } catch (error) {
            console.error('Error creating note:', error);
            Alert.alert('Error', `Failed to create note: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            console.log('Deleting note:', noteId);
                            await deleteNote(noteId);

                            // Remove from list
                            setNotes(prev => prev.filter(n => n._id !== noteId));
                            setSelectedNote(null);

                            Alert.alert('Success', 'Note deleted successfully');
                        } catch (error) {
                            console.error('Error deleting note:', error);
                            Alert.alert('Error', `Failed to delete note: ${error.message}`);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    // If a note is selected, show the detail view
    if (selectedNote) {
        return (
            <View style={styles.container}>
                <View style={styles.detailHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setSelectedNote(null)}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.detailTitle}>{selectedNote.name || selectedNote.title}</Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteNote(selectedNote._id)}
                    >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailContent}>
                    <View style={styles.metaDataContainer}>
                        {selectedNote.name && <Text style={styles.metaLabel}>Name: <Text style={styles.metaValue}>{selectedNote.name}</Text></Text>}
                        <Text style={styles.metaLabel}>Title: <Text style={styles.metaValue}>{selectedNote.title}</Text></Text>
                        <Text style={styles.metaLabel}>Standard: <Text style={styles.metaValue}>{selectedNote.standard}</Text></Text>
                        <Text style={styles.metaLabel}>Chapter: <Text style={styles.metaValue}>{selectedNote.chapter}</Text></Text>
                        <Text style={styles.metaLabel}>Topic: <Text style={styles.metaValue}>{selectedNote.topic}</Text></Text>
                        {selectedNote.tags && selectedNote.tags.length > 0 && (
                            <View style={styles.tagsContainer}>
                                <Text style={styles.metaLabel}>Tags:</Text>
                                <View style={styles.tagsList}>
                                    {selectedNote.tags.map((tag, idx) => (
                                        <Text key={idx} style={styles.tag}>{tag}</Text>
                                    ))}
                                </View>
                            </View>
                        )}
                        <Text style={styles.metaLabel}>Created: <Text style={styles.metaValue}>{new Date(selectedNote.createdAt).toLocaleDateString()}</Text></Text>
                    </View>

                    <View style={styles.contentSection}>
                        <Text style={styles.contentTitle}>Content</Text>
                        <Text style={styles.contentText}>{selectedNote.content}</Text>
                    </View>
                </ScrollView>

                <View style={styles.buttonContainer}>
                    <PrimaryButton 
                        title="Study with Coach" 
                        onPress={() => navigation.navigate('AgenticCoach', {
                            transcriptId: selectedNote._id,
                            sessionName: selectedNote.title,
                            contextType: 'note',
                            transcript: selectedNote.content,
                        })}
                    />
                </View>
            </View>
        );
    }

    // Show create note form
    if (showCreateForm) {
        const nomenclature = NAMING_NOMENCLATURE.note;
        const guidelines = DETAILED_GUIDELINES.note;

        return (
            <View style={styles.container}>
                <View style={styles.formHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setShowCreateForm(false)}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.formTitle}>Create New Note</Text>
                    <InfoButton
                        title={guidelines.title}
                        rules={guidelines.rules}
                        tips={guidelines.tips}
                        size={20}
                        color="#007AFF"
                    />
                </View>

                <ScrollView style={styles.formContainer}>
                    {/* Nomenclature Pattern Display */}
                    <View style={styles.patternCard}>
                        <Text style={styles.patternLabel}>Suggested Format:</Text>
                        <Text style={styles.pattern}>{nomenclature.pattern}</Text>
                        <Text style={styles.patternExample}>Example: {nomenclature.example}</Text>
                    </View>

                    {/* Quick Guidelines */}
                    <View style={styles.guidelinesCard}>
                        <Text style={styles.guidelinesTitle}>Quick Guidelines:</Text>
                        {nomenclature.guidelines.slice(0, 3).map((guideline, index) => (
                            <Text key={index} style={styles.guidelineItem}>
                                {guideline}
                            </Text>
                        ))}
                    </View>

                    <Text style={styles.label}>Title * (Follow naming convention)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={nomenclature.example}
                        placeholderTextColor="#bbb"
                        value={newNoteData.title}
                        onChangeText={(text) => setNewNoteData({ ...newNoteData, title: text })}
                        editable={!isLoading}
                        maxLength={100}
                    />

                    <Text style={styles.label}>Note Name (optional label)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Quick Review, Study Guide, etc."
                        value={newNoteData.name}
                        onChangeText={(text) => setNewNoteData({ ...newNoteData, name: text })}
                        editable={!isLoading}
                    />

                    <Text style={styles.label}>Content *</Text>
                    <TextInput
                        style={[styles.input, styles.multilineInput]}
                        placeholder="Note content"
                        value={newNoteData.content}
                        onChangeText={(text) => setNewNoteData({ ...newNoteData, content: text })}
                        multiline={true}
                        numberOfLines={8}
                        editable={!isLoading}
                    />

                    <Text style={styles.label}>Standard</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Standard (e.g., 10)"
                        value={newNoteData.standard}
                        onChangeText={(text) => setNewNoteData({ ...newNoteData, standard: text })}
                        editable={!isLoading}
                    />

                    <Text style={styles.label}>Chapter</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Chapter"
                        value={newNoteData.chapter}
                        onChangeText={(text) => setNewNoteData({ ...newNoteData, chapter: text })}
                        editable={!isLoading}
                    />

                    <Text style={styles.label}>Topic</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Topic"
                        value={newNoteData.topic}
                        onChangeText={(text) => setNewNoteData({ ...newNoteData, topic: text })}
                        editable={!isLoading}
                    />

                    <Text style={styles.label}>Tags (comma-separated)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="tag1, tag2, tag3"
                        value={newNoteData.tags}
                        onChangeText={(text) => setNewNoteData({ ...newNoteData, tags: text })}
                        editable={!isLoading}
                    />

                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>Creating note...</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                        onPress={handleCreateNote}
                        disabled={isLoading}
                    >
                        <Text style={styles.createButtonText}>Create Note</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // Show notes list
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Notes</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowCreateForm(true)}
                >
                    <Text style={styles.addButtonText}>+ New</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading notes...</Text>
                </View>
            ) : notes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No notes yet</Text>
                    <Text style={styles.emptySubtext}>Create your first note to get started</Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => setShowCreateForm(true)}
                    >
                        <Text style={styles.emptyButtonText}>Create Note</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={notes}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.noteItem}
                            onPress={() => setSelectedNote(item)}
                        >
                            <View style={styles.noteItemContent}>
                                <Text style={styles.noteItemTitle}>{item.title}</Text>
                                <Text style={styles.noteItemMeta}>
                                    {item.standard} · {item.chapter} · {item.topic}
                                </Text>
                                <Text style={styles.noteItemPreview} numberOfLines={2}>
                                    {item.content}
                                </Text>
                                <Text style={styles.noteItemDate}>
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContainer}
                />
            )}
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
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
    },
    addButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    listContainer: {
        padding: 12,
    },
    noteItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    noteItemContent: {
        flex: 1,
    },
    noteItemTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    noteItemMeta: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    noteItemPreview: {
        fontSize: 13,
        color: '#555',
        lineHeight: 18,
        marginBottom: 8,
    },
    noteItemDate: {
        fontSize: 11,
        color: '#999',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        paddingVertical: 8,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    deleteButton: {
        backgroundColor: '#ff3b30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    detailContent: {
        flex: 1,
    },
    metaDataContainer: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    metaLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    metaValue: {
        fontWeight: '400',
        color: '#333',
    },
    tagsContainer: {
        marginTop: 8,
    },
    tagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
    },
    tag: {
        backgroundColor: '#e3f2fd',
        color: '#007AFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: '500',
        marginRight: 6,
        marginBottom: 4,
    },
    contentSection: {
        backgroundColor: '#fff',
        padding: 16,
    },
    contentTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    contentText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#555',
    },
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    formContainer: {
        flex: 1,
        padding: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#333',
    },
    multilineInput: {
        minHeight: 120,
        textAlignVertical: 'top',
    },

    // Nomenclature Cards
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

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    createButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 24,
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 6,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
});
