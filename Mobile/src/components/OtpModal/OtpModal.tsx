import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import Button from '../Button/Button';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  otpLoading: boolean;
  otpError: string | null;
  otpResendLoading: boolean;
  onSubmit: () => void;
  onResend: () => void;
}

export default function OtpModal({
  isOpen,
  onClose,
  email,
  otpCode,
  setOtpCode,
  otpLoading,
  otpError,
  otpResendLoading,
  onSubmit,
  onResend,
}: OtpModalProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Convert current otpCode (which is a string) to an array of 6 elements
  const otpArray = otpCode.split('').concat(Array(6).fill('')).slice(0, 6);

  useEffect(() => {
    if (!isOpen) return;

    // Reset timer to 60 when modal opens
    setSecondsLeft(60);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Auto focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, val: string) => {
    // Only allow numeric input
    const cleanedVal = val.replace(/[^0-9]/g, '');
    if (!cleanedVal) {
      const newOtpArray = [...otpArray];
      newOtpArray[index] = '';
      setOtpCode(newOtpArray.join(''));
      return;
    }

    const newOtpArray = [...otpArray];
    if (cleanedVal.length > 1) {
      // Handle pasted or fast typed multiple digits
      const pastedDigits = cleanedVal.slice(0, 6 - index).split('');
      for (let i = 0; i < pastedDigits.length; i++) {
        newOtpArray[index + i] = pastedDigits[i];
      }
      setOtpCode(newOtpArray.join(''));
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtpArray[index] = cleanedVal;
      setOtpCode(newOtpArray.join(''));
      // Move to next input box
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newOtpArray = [...otpArray];
      if (otpArray[index] === '') {
        // If current is empty, delete previous and move back
        if (index > 0) {
          newOtpArray[index - 1] = '';
          setOtpCode(newOtpArray.join(''));
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Just delete current
        newOtpArray[index] = '';
        setOtpCode(newOtpArray.join(''));
      }
    }
  };

  const handleResendClick = () => {
    if (secondsLeft > 0 || otpResendLoading) return;
    onResend();
    setSecondsLeft(60);
  };

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
                  borderColor: isDark ? '#2E2856' : '#F3E8FF',
                },
              ]}
            >
              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeButton,
                  { backgroundColor: isDark ? '#2E2856' : '#F3E8FF' },
                ]}
              >
                <Ionicons name="close" size={20} color="#7B61FF" />
              </TouchableOpacity>

              <View style={styles.contentContainer}>
                {/* Shield Icon */}
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: isDark ? '#2E2856' : '#FAF8FF',
                      borderColor: isDark ? '#3D3570' : '#E9D5FF',
                    },
                  ]}
                >
                  <Ionicons name="shield-checkmark-outline" size={32} color="#7B61FF" />
                </View>

                {/* Title */}
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? '#FFFFFF' : '#1F2937' },
                  ]}
                >
                  {t('otp_modal_title')}
                </Text>

                {/* Subtitle */}
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: isDark ? '#9CA3AF' : '#6B7280' },
                  ]}
                >
                  {t('otp_modal_subtitle')}{' '}
                  <Text style={styles.emailText}>{email}</Text>
                </Text>

                {/* 6 Digit Inputs */}
                <View style={styles.otpInputContainer}>
                  {Array(6)
                    .fill(null)
                    .map((_, idx) => (
                      <TextInput
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        style={[
                          styles.otpInputBox,
                          {
                            color: isDark ? '#FFFFFF' : '#1F2937',
                            borderColor:
                              focusedIndex === idx
                                ? '#7B61FF'
                                : isDark
                                ? '#2E2856'
                                : '#E9D5FF',
                            backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                          },
                        ]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={otpArray[idx]}
                        onChangeText={(val) => handleInputChange(idx, val)}
                        onKeyPress={(e) => handleKeyPress(idx, e)}
                        onFocus={() => {
                          setFocusedIndex(idx);
                          if (otpError) {
                            setOtpCode('');
                            setTimeout(() => {
                              inputRefs.current[0]?.focus();
                            }, 50);
                          }
                        }}
                        onBlur={() => setFocusedIndex(null)}
                        selectTextOnFocus
                      />
                    ))}
                </View>

                {/* Error Banner */}
                {otpError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{otpError}</Text>
                  </View>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                  <Button
                    onPress={onSubmit}
                    disabled={otpLoading || otpCode.length !== 6}
                    variant="primary"
                    className="w-full py-3.5 rounded-2xl"
                  >
                    {otpLoading ? t('otp_verifying') : t('otp_verify_btn').toUpperCase()}
                  </Button>

                  <View style={styles.resendRow}>
                    <Text
                      style={[
                        styles.resendLabel,
                        { color: isDark ? '#9CA3AF' : '#6B7280' },
                      ]}
                    >
                      Haven't received the code?
                    </Text>
                    <TouchableOpacity
                      onPress={handleResendClick}
                      disabled={otpResendLoading || secondsLeft > 0}
                    >
                      <Text
                        style={[
                          styles.resendButtonText,
                          {
                            opacity: otpResendLoading || secondsLeft > 0 ? 0.5 : 1,
                          },
                        ]}
                      >
                        {otpResendLoading
                          ? t('otp_resending')
                          : secondsLeft > 0
                          ? `${t('otp_resend_btn')} (${secondsLeft}s)`
                          : t('otp_resend_btn')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#7B61FF',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  otpInputBox: {
    width: 44,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionContainer: {
    width: '100%',
    marginTop: 8,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  resendLabel: {
    fontSize: 12,
  },
  resendButtonText: {
    fontSize: 12,
    color: '#7B61FF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
