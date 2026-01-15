/**
 * Image processing utilities for captured book feature
 * Handles base64 conversion, compression, and validation
 */

import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

/**
 * Convert image URI to base64
 * Works with both iOS and Android
 */
export const convertImageToBase64 = async (imageUri) => {
    try {
        // Handle different URI formats
        let filePath = imageUri;

        // If it's a file:// URI on Android, convert to path
        if (Platform.OS === 'android' && imageUri.startsWith('file://')) {
            filePath = imageUri.replace('file://', '');
        }

        // Read file and convert to base64
        const base64Data = await RNFS.readFile(filePath, 'base64');
        return base64Data;
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
    }
};

/**
 * Compress base64 image by reducing quality
 * Returns smaller base64 string
 */
export const compressBase64Image = (base64String, maxSize = 50000) => {
    // For now, just return as-is. In production, you might want to:
    // 1. Decode base64 to get size
    // 2. If larger than maxSize, reduce quality
    // 3. This would require react-native-image-resizer or similar

    const sizeInKB = (base64String.length * 0.75) / 1024;
    console.log(`Image size: ${sizeInKB.toFixed(2)} KB`);

    if (sizeInKB > maxSize / 1024) {
        console.warn(
            `Image size (${sizeInKB.toFixed(2)} KB) exceeds recommended limit`
        );
    }

    return base64String;
};

/**
 * Process multiple images for captured book feature
 * Converts all images to base64 and returns array
 */
export const processImagesForBook = async (imageUris) => {
    try {
        const base64Images = await Promise.all(
            imageUris.map(async (uri) => {
                const base64Data = await convertImageToBase64(uri);
                const compressed = compressBase64Image(base64Data);
                return {
                    data: compressed,
                    originalUri: uri,
                };
            })
        );

        return base64Images;
    } catch (error) {
        console.error('Error processing images:', error);
        throw error;
    }
};

/**
 * Validate image before processing
 * Checks if file exists and is readable
 */
export const validateImage = async (imageUri) => {
    try {
        let filePath = imageUri;

        if (Platform.OS === 'android' && imageUri.startsWith('file://')) {
            filePath = imageUri.replace('file://', '');
        }

        const exists = await RNFS.exists(filePath);
        if (!exists) {
            throw new Error('Image file does not exist');
        }

        const stat = await RNFS.stat(filePath);
        if (stat.size === 0) {
            throw new Error('Image file is empty');
        }

        // Check if file size is reasonable (less than 10MB)
        if (stat.size > 10 * 1024 * 1024) {
            throw new Error('Image file is too large');
        }

        return true;
    } catch (error) {
        console.error('Image validation failed:', error);
        return false;
    }
};

/**
 * Create thumbnail from base64 image string
 * Returns data URL for Image component
 */
export const createBase64DataUrl = (base64String, mimeType = 'image/jpeg') => {
    return `data:${mimeType};base64,${base64String}`;
};

/**
 * Extract image metadata (approximate)
 * Note: Detailed metadata extraction would require additional libraries
 */
export const getImageMetadata = async (imageUri) => {
    try {
        let filePath = imageUri;

        if (Platform.OS === 'android' && imageUri.startsWith('file://')) {
            filePath = imageUri.replace('file://', '');
        }

        const stat = await RNFS.stat(filePath);

        return {
            filePath: imageUri,
            sizeInBytes: stat.size,
            sizeInKB: (stat.size / 1024).toFixed(2),
            modificationTime: stat.mtime,
            isFile: stat.isFile(),
        };
    } catch (error) {
        console.error('Error getting image metadata:', error);
        return null;
    }
};
