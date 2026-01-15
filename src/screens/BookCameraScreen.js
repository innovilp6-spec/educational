import React, { useRef, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useCameraPermission, Camera, useCameraDevice } from 'react-native-vision-camera';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@react-native-vector-icons/fontawesome';
import RNFS from 'react-native-fs';

const BookCameraScreen = ({ navigation }) => {
    const [capturedImages, setCapturedImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [canCapture, setCanCapture] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState(null);
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
                    <Text style={styles.errorText}>Camera permission not granted</Text>
                    <TouchableOpacity style={styles.button} onPress={handleRequestPermission}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
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
                    <Text style={styles.errorText}>Loading camera...</Text>
                </View>
            </View>
        );
    }

    if (deviceBack === null || deviceBack === undefined) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <FontAwesome name="camera" size={60} color="#999" />
                    <Text style={styles.errorText}>Camera device not available</Text>
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

        console.log('[BookCamera] Processing', capturedImages.length, 'images');
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
                title: 'Captured Book',
                category: 'Uncategorized',
                tags: [],
            });
        } catch (error) {
            console.error('Error processing images:', error);
            Alert.alert('Error', 'Failed to process images. Please try again.');
            setIsProcessing(false);
        }
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
                    <Text style={styles.overlayText}>Capture Book Pages</Text>
                    <Text style={styles.pageCountText}>
                        Pages: {capturedImages.length}
                    </Text>
                </View>
            </View>

            {/* Controls Area */}
            <View style={styles.controlsContainer}>
                {/* Top row - Page count and clear */}
                <View style={styles.infoRow}>
                    <View style={styles.pageIndicator}>
                        <FontAwesome name="images" size={16} color="#fff" />
                        <Text style={styles.pageIndicatorText}>
                            {capturedImages.length} page{capturedImages.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    {capturedImages.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={clearCaptures}
                        >
                            <FontAwesome name="trash" size={16} color="#FF6B6B" />
                            <Text style={styles.clearButtonText}>Clear</Text>
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
                        <Text
                            style={[
                                styles.buttonText,
                                !canCapture && styles.disabledButtonText,
                            ]}
                        >
                            Capture
                        </Text>
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
                                <Text style={styles.buttonText}>Processing...</Text>
                            </>
                        ) : (
                            <>
                                <FontAwesome
                                    name="play"
                                    size={24}
                                    color={
                                        capturedImages.length > 0
                                            ? '#fff'
                                            : 'rgba(255,255,255,0.5)'
                                    }
                                />
                                <Text
                                    style={[
                                        styles.buttonText,
                                        capturedImages.length === 0 && styles.disabledButtonText,
                                    ]}
                                >
                                    Process
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Help text */}
                <Text style={styles.helpText}>
                    {capturedImages.length === 0
                        ? 'Tap Capture to take photos'
                        : 'Tap Process to extract text'}
                </Text>
            </View>
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
});

export default BookCameraScreen;
