import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

type Listener = (toast: ToastOptions | null) => void;
const listeners = new Set<Listener>();

let activeToast: ToastOptions | null = null;
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

// Re-export the main toast trigger functions matching the web-like API
export const toast = {
    show: (message: string, type: ToastType = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        activeToast = { id, message, type, duration };
        listeners.forEach(l => l(activeToast));
        
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.dismiss();
        }, duration);
    },
    success: (message: string, duration = 3000) => {
        toast.show(message, 'success', duration);
    },
    error: (message: string, duration = 3000) => {
        toast.show(message, 'error', duration);
    },
    dismiss: () => {
        activeToast = null;
        listeners.forEach(l => l(null));
        if (toastTimeout) clearTimeout(toastTimeout);
    }
};

// Export the Custom-styled ToastContainer compatible with React Native
export const ToastContainer: React.FC = () => {
    const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [translateYAnim] = useState(new Animated.Value(-50));

    useEffect(() => {
        const handleToast = (newToast: ToastOptions | null) => {
            if (newToast) {
                setCurrentToast(newToast);
                // Animate entering
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateYAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start();
            } else {
                // Animate exiting
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateYAnim, {
                        toValue: -30,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setCurrentToast(null);
                });
            }
        };

        listeners.add(handleToast);
        return () => {
            listeners.delete(handleToast);
        };
    }, []);

    if (!currentToast) return null;

    const isSuccess = currentToast.type === 'success';
    const isError = currentToast.type === 'error';

    let bgColor = '#FAF8FF';
    let borderColor = '#E9D5FF';
    let textColor = '#5B21B6';
    let iconName: any = 'information-circle-outline';
    let iconColor = '#7B61FF';

    if (isSuccess) {
        bgColor = '#8E7EFE';
        borderColor = 'rgba(142, 126, 254, 0.3)';
        textColor = '#FFFFFF';
        iconName = 'checkmark-circle-outline';
        iconColor = '#FFFFFF';
    } else if (isError) {
        bgColor = '#E13D53';
        borderColor = 'rgba(225, 61, 83, 0.3)';
        textColor = '#FFFFFF';
        iconName = 'alert-circle-outline';
        iconColor = '#FFFFFF';
    }

    return (
        <View style={styles.overlay} pointerEvents="box-none">
            <Animated.View
                style={[
                    styles.toastCard,
                    {
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                        opacity: fadeAnim,
                        transform: [{ translateY: translateYAnim }],
                    },
                ]}
            >
                <Ionicons name={iconName} size={20} color={iconColor} style={styles.icon} />
                <Text style={[styles.messageText, { color: textColor }]}>
                    {currentToast.message}
                </Text>
                <TouchableOpacity onPress={() => toast.dismiss()} style={styles.closeBtn}>
                    <Ionicons name="close-outline" size={18} color={isSuccess || isError ? '#FFFFFF' : '#9CA3AF'} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        paddingHorizontal: 20,
    },
    toastCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#7B61FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        maxWidth: '100%',
        width: Dimensions.get('window').width - 40,
    },
    icon: {
        marginRight: 10,
    },
    messageText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    closeBtn: {
        marginLeft: 10,
        padding: 2,
    },
});
