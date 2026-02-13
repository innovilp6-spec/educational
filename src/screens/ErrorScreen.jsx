import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import SpecialText from '../components/SpecialText';
import PrimaryButton from '../components/PrimaryButton';

export default function ErrorScreen({ navigation, route }) {
    const { audioPath } = route.params || {};

    return (
        <View style={styles.container}>
            <SpecialText style={styles.title}>Something went wrong</SpecialText>

            <PrimaryButton
                title="Retry Transcription"
                onPress={() =>
                    navigation.replace('Transcribing', { audioPath })
                }
            />

            <PrimaryButton
                title="Save Audio Only"
                onPress={() =>
                    navigation.replace('NameSession', { audioPath, transcript: null })
                }
            />

            <PrimaryButton title="Go Home" onPress={() => navigation.popToTop()} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24 },
    title: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
});
