import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Animated,
    Modal,
} from 'react-native';
import { ThemedText } from '../ui/ThemedText';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success';
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    type = 'info',
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'Cancel'
}) => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);


    const getColorForType = () => {
        switch (type) {
            case 'error':
                return '#ff6b6b';
            case 'success':
                return '#51cf66';
            default:
                return '#4C4B7E';
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onCancel || onConfirm}
        >
            <Animated.View
                className="flex-1 justify-center items-center bg-black/50 px-6"
                style={{ opacity: fadeAnim }}
            >
                <Animated.View
                    className="bg-[#FBF7EF] rounded-3xl p-6 w-full max-w-sm shadow-lg"
                    style={{
                        transform: [{ scale: scaleAnim }],
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >

                    {/* Title */}
                    <ThemedText
                        className="text-xl font-bold text-center mb-3"
                        style={{ color: getColorForType(), fontFamily: 'YoungSerif-Regular' }}
                    >
                        {title}
                    </ThemedText>

                    {/* Message */}
                    <ThemedText className="text-base text-gray-600 text-center mb-6 leading-6">
                        {message}
                    </ThemedText>

                    {/* Buttons */}
                    <View className="flex-row gap-3 ">
                        {onCancel && (
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl border-2"
                                style={{ borderColor: '#e0e0e0' }}
                                onPress={onCancel}
                            >
                                <ThemedText className="text-gray-600 text-center font-semibold">
                                    {cancelText}
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-xl"
                            style={{ backgroundColor: getColorForType() }}
                            onPress={onConfirm}
                        >
                            <ThemedText className="text-white text-center font-semibold">
                                {confirmText}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

// Custom Toaster Component
interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'info' | 'error' | 'success';
    duration?: number;
    onHide: () => void;
}

export const CustomToast: React.FC<ToastProps> = ({
    visible,
    message,
    type = 'info',
    duration = 1500, // Reduced from 3000 to 1500ms (1.5 seconds)
    onHide
}) => {
    const [translateY] = useState(new Animated.Value(-100));
    const [opacity] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    };

    const hideToastImmediately = () => {
        translateY.stopAnimation();
        opacity.stopAnimation();
        
        Animated.timing(translateY, {
            toValue: -100,
            duration: 200, 
            useNativeDriver: true,
        }).start(() => {
            onHide();
        });
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'error':
                return '#ff6b6b';
            case 'success':
                return '#51cf66';
            default:
                return '#d4e8fa';
        }
    };

    if (!visible) return null;

    return (
        <Animated.View
            className="absolute top-16 left-4 right-4 z-50"
            style={{
                transform: [{ translateY }],
                opacity,
            }}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={hideToastImmediately} // Changed to use immediate hide
                className="flex-row items-center rounded-2xl p-4 mx-4"
                style={{
                    backgroundColor: getBackgroundColor(),
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 8,
                }}
            >
                <ThemedText className="text-black font-medium flex-1 text-base">
                    {message}
                </ThemedText>
                <ThemedText className="text-black text-sm ml-2">
                    ×
                </ThemedText>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Hook for managing toasts
export const useToast = () => {
    const [toast, setToast] = useState<{
        visible: boolean;
        message: string;
        type: 'info' | 'error' | 'success';
    }>({
        visible: false,
        message: '',
        type: 'info',
    });

    const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        setToast({ visible: true, message, type });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    return {
        toast,
        showToast,
        hideToast,
    };
};

// Hook for managing alerts
export const useAlert = () => {
    const [alert, setAlert] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'info' | 'error' | 'success';
        onConfirm?: () => void;
        onCancel?: () => void;
        confirmText?: string;
        cancelText?: string;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
    });

    const showAlert = (
        title: string,
        message: string,
        options: {
            type?: 'info' | 'error' | 'success';
            onConfirm?: () => void;
            onCancel?: () => void;
            confirmText?: string;
            cancelText?: string;
        } = {}
    ) => {
        setAlert({
            visible: true,
            title,
            message,
            type: options.type || 'info',
            onConfirm: options.onConfirm,
            onCancel: options.onCancel,
            confirmText: options.confirmText,
            cancelText: options.cancelText,
        });
    };

    const hideAlert = () => {
        setAlert(prev => ({ ...prev, visible: false }));
    };

    return {
        alert,
        showAlert,
        hideAlert,
    };
};