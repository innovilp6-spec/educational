import React, { useRef, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { useCameraPermission, Camera, useCameraDevice } from 'react-native-vision-camera';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@react-native-vector-icons/fontawesome';
import RNFS from 'react-native-fs';
import InfoButton from '../components/InfoButton';
import { NAMING_NOMENCLATURE, DETAILED_GUIDELINES, validateName } from '../utils/namingNomenclature';
import SpecialText from '../components/SpecialText';

const BookCameraScreen = ({ navigation }) => {
    const [capturedImages, setCapturedImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [canCapture, setCanCapture] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState(null);
    const [showTitleModal, setShowTitleModal] = useState(false);
    const [bookTitle, setBookTitle] = useState('');
    const cameraRef = useRef(null);

    const deviceBack = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();

    useFocusEffect(
        useCallback(() => {
            console.log('[BookCamera] useFocusEffect - hasPermission:', hasPermission);
            setPermissionStatus(hasPermission);

            if (hasPermission === false) {
                console.log('[BookCamera] Permission denied, requesting...');
                requestPermission();
            }
        }, [hasPermission, requestPermission])
    );

    const handleRequestPermission = async () => {
        console.log('[BookCamera] handleRequestPermission called');
        try {
            const result = await requestPermission();
            console.log('[BookCamera] Permission request result:', result);
            setPermissionStatus(result);
        } catch (error) {
            console.error('[BookCamera] Permission request error:', error);
        }
    };

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <FontAwesome name="camera" size={60} color="#999" />
                    <SpecialText style={styles.errorText}>Camera permission not granted</SpecialText>
                    <TouchableOpacity style={styles.button} onPress={handleRequestPermission}>
                        <SpecialText style={styles.buttonText}>Grant Permission</SpecialText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (hasPermission === undefined) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#fff" />
                    <SpecialText style={styles.errorText}>Loading camera...</SpecialText>
                </View>
            </View>
        );
    }

    if (deviceBack === null || deviceBack === undefined) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <FontAwesome name="camera" size={60} color="#999" />
                    <SpecialText style={styles.errorText}>Camera device not available</SpecialText>
                </View>
            </View>
        );
    }

    const captureBookPage = async () => {
        if (!canCapture || cameraRef.current === null) {
            console.log('[BookCamera] Cannot capture: canCapture=', canCapture, 'cameraRef=', cameraRef.current !== null);
            return;
        }

        setCanCapture(false);

        try {
            console.log('[BookCamera] Capturing photo...');
            const photo = await cameraRef.current.takePhoto({
                flash: 'off',
                qualityPrioritization: 'speed',
                quality: 0.8,
            });

            const imageUri = `file://${photo.path}`;
            console.log('[BookCamera] Photo captured:', imageUri);
            setCapturedImages(prev => {
                const newImages = [...prev, imageUri];
                console.log('[BookCamera] Total captured:', newImages.length);
                return newImages;
            });
            setCanCapture(true);
        } catch (error) {
            console.error('[BookCamera] Error capturing photo:', error);
            Alert.alert('Error', 'Failed to capture image. Please try again.');
            setCanCapture(true);
        }
    };

    const processBook = async () => {
        if (capturedImages.length === 0) {
            Alert.alert('No Images', 'Please capture at least one page first.');
            return;
        }

        // Show title input modal
        setShowTitleModal(true);
    };

    const handleTitleConfirm = async () => {
        if (!bookTitle.trim()) {
            Alert.alert('Title Required', 'Please enter a title for your book.');
            return;
        }

        // Validate title
        const validation = validateName('book', bookTitle);
        if (!validation.valid) {
            Alert.alert('Invalid Title', validation.error);
            return;
        }

        setShowTitleModal(false);
        console.log('[BookCamera] Processing', capturedImages.length, 'images with title:', bookTitle);
        setIsProcessing(true);

        try {
            // Convert all images to base64
            console.log('[BookCamera] Converting images to base64...');
            const base64Images = await Promise.all(
                capturedImages.map(async (uri, index) => {
                    console.log('[BookCamera] Converting image', index + 1, ':', uri);
                    const path = uri.replace('file://', '');
                    const imageData = await RNFS.readFile(path, 'base64');
                    console.log('[BookCamera] Image', index + 1, 'converted, size:', imageData.length, 'bytes');
                    return {
                        data: imageData,
                        uri: uri,
                    };
                })
            );

            console.log('[BookCamera] All images converted, navigating to BookProcessing');
            // Navigate to BookProcessingScreen
            navigation.replace('BookProcessing', {
                images: base64Images,
                title: bookTitle,
                category: 'other',
                tags: [],
            });
        } catch (error) {
            console.error('Error processing images:', error);
            Alert.alert('Error', 'Failed to process images. Please try again.');
            setIsProcessing(false);
        }
    };

    const handleTitleCancel = () => {
        setShowTitleModal(false);
        setBookTitle('');
        setIsProcessing(false);
    };

    const clearCaptures = () => {
        Alert.alert(
            'Clear Images',
            'Are you sure you want to clear all captured images?',
            [
                { text: 'Cancel', onPress: () => { } },
                {
                    text: 'Clear',
                    onPress: () => {
                        setCapturedImages([]);
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Camera View */}
            <View style={styles.cameraContainer}>
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={deviceBack}
                    isActive={true}
                    photo={true}
                    resizeMode="cover"
                    onError={(error) => {
                        console.error('[BookCamera] Camera error:', error);
                    }}
                />
                <View style={styles.overlay}>
                    <SpecialText style={styles.overlayText}>Capture Book Pages</SpecialText>
                    <SpecialText style={styles.pageCountText}>
                        Pages: {capturedImages.length}
                    </SpecialText>
                </View>
            </View>

            {/* Controls Area */}
            <View style={styles.controlsContainer}>
                {/* Top row - Page count and clear */}
                <View style={styles.infoRow}>
                    <View style={styles.pageIndicator}>
                        <FontAwesome name="images" size={16} color="#fff" />
                        <SpecialText style={styles.pageIndicatorText}>
                            {capturedImages.length} page{capturedImages.length !== 1 ? 's' : ''}
                        </SpecialText>
                    </View>
                    {capturedImages.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={clearCaptures}
                        >
                            <FontAwesome name="trash" size={16} color="#FF6B6B" />
                            <SpecialText style={styles.clearButtonText}>Clear</SpecialText>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bottom row - Capture and Process buttons */}
                <View style={styles.buttonsRow}>
                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            !canCapture && styles.disabledButton,
                        ]}
                        onPress={captureBookPage}
                        disabled={!canCapture}
                    >
                        <FontAwesome
                            name="camera"
                            size={24}
                            color={canCapture ? '#fff' : 'rgba(255,255,255,0.5)'}
                        />
                        <SpecialText
                            style={[
                                styles.buttonText,
                                !canCapture && styles.disabledButtonText,
                            ]}
                        >
                            Capture
                        </SpecialText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.processButton,
                            (capturedImages.length === 0 || isProcessing) && styles.disabledButton,
                        ]}
                        onPress={processBook}
                        disabled={capturedImages.length === 0 || isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <ActivityIndicator color="#fff" size="small" />
                                <SpecialText style={styles.buttonText}>Processing...</SpecialText>
                            </>
                        ) : (
                            <>
                                <FontAwesome
                                    name="play"
                                    size={24}
                                    color={
                                        capturedImages.length > 0
                                            ? '#000'
                                            : 'rgba(255,255,255,0.5)'
                                    }
                                />
                                <SpecialText
                                    style={[
                                        styles.buttonText,
                                        capturedImages.length > 0 && { color: '#000' },
                                        capturedImages.length === 0 && styles.disabledButtonText,
                                    ]}
                                >
                                    Process
                                </SpecialText>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Help text */}
                <SpecialText style={styles.helpText}>
                    {capturedImages.length === 0
                        ? 'Tap Capture to take photos'
                        : 'Tap Process to extract text'}
                </SpecialText>
            </View>

            {/* Title Input Modal */}
            <Modal
                visible={showTitleModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleTitleCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <SpecialText style={styles.modalTitle}>Book Title</SpecialText>
                            <InfoButton
                                title={DETAILED_GUIDELINES.book.title}
                                rules={DETAILED_GUIDELINES.book.rules}
                                tips={DETAILED_GUIDELINES.book.tips}
                                size={20}
                                color="#007AFF"
                            />
                        </View>

                        <ScrollView style={styles.modalScrollView}>
                            {/* Nomenclature Pattern */}
                            <View style={styles.patternCard}>
                                <SpecialText style={styles.patternLabel}>Suggested Format:</SpecialText>
                                <SpecialText style={styles.pattern}>{NAMING_NOMENCLATURE.book.pattern}</SpecialText>
                                <SpecialText style={styles.patternExample}>Example: {NAMING_NOMENCLATURE.book.example}</SpecialText>
                            </View>

                            {/* Quick Guidelines */}
                            <View style={styles.guidelinesCard}>
                                <SpecialText style={styles.guidelinesTitle}>Quick Guidelines:</SpecialText>
                                {NAMING_NOMENCLATURE.book.guidelines.slice(0, 3).map((guideline, index) => (
                                    <SpecialText key={index} style={styles.guidelineItem}>
                                        {guideline}
                                    </SpecialText>
                                ))}
                            </View>

                            <View style={styles.modalBody}>
                                <SpecialText style={styles.modalLabel}>
                                    What would you like to name this captured book?
                                </SpecialText>
                                <TextInput
                                    style={styles.titleInput}
                                    placeholder={NAMING_NOMENCLATURE.book.example}
                                    placeholderTextColor="#999"
                                    value={bookTitle}
                                    onChangeText={setBookTitle}
                                    autoFocus={true}
                                    maxLength={100}
                                />
                                <SpecialText style={styles.charCount}>
                                    {bookTitle.length}/100 characters
                                </SpecialText>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleTitleCancel}
                            >
                                <SpecialText style={styles.cancelButtonText}>Cancel</SpecialText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    !bookTitle.trim() && styles.disabledConfirmButton,
                                ]}
                                onPress={handleTitleConfirm}
                                disabled={!bookTitle.trim()}
                            >
                                <SpecialText
                                    style={[
                                        styles.confirmButtonText,
                                        !bookTitle.trim() && styles.disabledConfirmButtonText,
                                    ]}
                                >
                                    Continue
                                </SpecialText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    overlay: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlayText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    pageCountText: {
        color: '#4CAF50',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    controlsContainer: {
        height: '22%',
        paddingHorizontal: 15,
        paddingVertical: 10,
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pageIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    pageIndicatorText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,107,107,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    clearButtonText: {
        color: '#FF6B6B',
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '600',
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginVertical: 10,
    },
    captureButton: {
        flex: 1,
        marginRight: 10,
        backgroundColor: '#333',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: '#555',
    },
    processButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: '#fff',
    },
    disabledButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    disabledButtonText: {
        color: 'rgba(255,255,255,0.5)',
    },
    helpText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        color: '#666',
        fontSize: 16,
        marginTop: 20,
        textAlign: 'center',
    },
    button: {
        marginTop: 20,
        backgroundColor: '#333',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
        maxHeight: '85%',
    },
    modalHeader: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    modalScrollView: {
        maxHeight: 300,
    },

    // Nomenclature Cards in Modal
    patternCard: {
        backgroundColor: '#e3f2fd',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 12,
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
        fontSize: 15,
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
        marginHorizontal: 20,
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

    modalBody: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    modalLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    titleInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
        marginBottom: 8,
        backgroundColor: '#f9f9f9',
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginBottom: 16,
    },
    modalFooter: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    disabledConfirmButton: {
        backgroundColor: '#ddd',
    },
    disabledConfirmButtonText: {
        color: '#999',
    },
});

export default BookCameraScreen;
