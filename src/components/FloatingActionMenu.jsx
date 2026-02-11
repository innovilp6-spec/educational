/**
 * Floating Action Menu Component
 * Circular FAB that expands to show multiple action buttons
 * Can be reused across different screens
 */

import React, { useState, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Text,
} from 'react-native';

export default function FloatingActionMenu({ actions = [] }) {
    const allowedActions = actions.filter(Boolean); // Filter out any falsy actions
    const [isOpen, setIsOpen] = useState(false);
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnims = useRef(
        allowedActions.map(() => new Animated.Value(0))
    ).current;

    const handleToggle = () => {
        const toValue = isOpen ? 0 : 1;

        // Rotate main button
        Animated.timing(rotateAnim, {
            toValue,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Animate sub-buttons
        if (!isOpen) {
            // Opening - stagger animations
            allowedActions.forEach((_, index) => {
                Animated.timing(scaleAnims[index], {
                    toValue: 1,
                    duration: 200,
                    delay: index * 50,
                    useNativeDriver: true,
                }).start();
            });
        } else {
            // Closing - simultaneous animations
            scaleAnims.forEach((anim) => {
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }).start();
            });
        }

        setIsOpen(!isOpen);
    };

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const mainButtonRotation = {
        transform: [{ rotate: rotateInterpolate }],
    };

    const getButtonPosition = (index) => {
        const radius = 80;
        // Vertical alignment: stack buttons above the main FAB
        const spacing = radius;

        return {
            x: 0,
            y: -(spacing * (index + 1)),
        };
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Sub-buttons */}
            {allowedActions.map((action, index) => {
                if(!action) return null; // Skip if action is falsy (e.g., due to conditional rendering)
                const position = getButtonPosition(index);
                const scale = scaleAnims[index];

                return (
                    <Animated.View
                        key={`fab-action-${index}`}
                        style={[
                            styles.subButtonWrapper,
                            {
                                transform: [
                                    {
                                        translateX: scale.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, position.x],
                                        })
                                    },
                                    {
                                        translateY: scale.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, position.y],
                                        })
                                    },
                                    { scale },
                                ],
                            },
                        ]}
                        pointerEvents={isOpen ? 'auto' : 'none'}
                    >
                        <TouchableOpacity
                            style={styles.subButton}
                            onPress={() => {
                                action.onPress();
                                handleToggle();
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.subButtonIcon}>{action.icon}</Text>
                        </TouchableOpacity>
                        <Text style={styles.subButtonLabel}>{action.label}</Text>
                    </Animated.View>
                );
            })}

            {/* Main FAB Button */}
            <TouchableOpacity
                style={styles.mainButton}
                onPress={handleToggle}
                activeOpacity={0.7}
            >
                <Animated.View style={mainButtonRotation}>
                    <Text style={styles.mainButtonIcon}>+</Text>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainButton: {
        width: 40,
        height: 40,
        borderRadius: 30,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
    },
    mainButtonIcon: {
        fontSize: 32,
        color: '#ffffff',
        fontWeight: 'bold',
        lineHeight: 36,
    },
    subButtonWrapper: {
        position: 'absolute',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    subButtonIcon: {
        fontSize: 24,
    },
    subButtonLabel: {
        fontSize: 10,
        color: '#000000',
        fontWeight: '800',
        marginTop: 4,
        textAlign: 'center',
        maxWidth: 60,
    },
});
