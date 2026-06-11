import React, { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { 
  Image, 
  TouchableOpacity, 
  View, 
  Text, 
  Modal, 
  Platform, 
  StyleSheet,
  ScrollView,
  DeviceEventEmitter,
  AppState,
  AppStateStatus
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contextAPI/Auth/AuthContext';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';
import { useAppSocket, emitMarkAsRead, emitMarkAllAsRead } from '../Notifications/Notifications';
import { getMyNotificationsApi, Notification } from '../../axios/notifications';
import { useAppNavigation } from '../../navigation/navigation';
import { useFocusEffect } from 'expo-router';

export default function Header() {
  const { isLoggedIn, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigation = useAppNavigation();
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isDark = theme === 'dark';

  // Lắng nghe socket
  useAppSocket(isLoggedIn && user ? user.email : '');

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn || !user?.email) return;
    try {
      const res = await getMyNotificationsApi({ page: 1, pageSize: 20 });
      if (res) {
        if (Array.isArray(res.data)) {
          setNotifications(res.data);
        }
        if (typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      }
    } catch (e) {
      console.error("Failed to fetch mobile notifications:", e);
    }
  }, [isLoggedIn, user?.email]);

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, user?.email, fetchNotifications]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('sync-notifications', () => {
      fetchNotifications();
    });
    return () => {
      subscription.remove();
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchNotifications();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  return (
    <SafeAreaView edges={['top']} className="bg-white dark:bg-zinc-950">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950 border-b border-gray-50 dark:border-zinc-800">
        {/* Left Side: Logo and Text or User Profile */}
        {isLoggedIn && user ? (
          <View className="flex-row items-center">
            <Image
              source={
                user.avatar
                  ? { uri: user.avatar }
                  : require('../../../assets/images/mievoh/avatar.jpg')
              }
              className="w-10 h-10 rounded-full"
              resizeMode="cover"
            />
            <View className="ml-3">
              <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                {language === 'vi' ? 'Xin chào,' : 'Hello,'}
              </Text>
              <Text className="text-[15px] font-bold text-gray-900 dark:text-white">{user.fullName || user.email}</Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center">
            <View className="border border-gray-100 dark:border-zinc-800 rounded-full p-0.5 shadow-sm">
              <Image
                source={require('../../../assets/images/mievoh/mievoh_logo.png')}
                className="w-10 h-10 rounded-full"
                resizeMode="cover"
              />
            </View>
            <View style={{ width: 135, height: 40, overflow: 'hidden', position: 'relative', marginLeft: -4 }}>
              <Image
                source={require('../../../assets/images/mievoh/mievoh_text.png')}
                style={{
                  position: 'absolute',
                  width: 150,
                  height: 150,
                  left: -20,
                  top: -55
                }}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* Right Side: Notification and Settings Icons */}
        <View className="flex-row items-center gap-3">
          {/* Notification Button */}
          <TouchableOpacity 
            onPress={() => {
              if (isLoggedIn) {
                navigation.goToNotifications();
              } else {
                navigation.goToLogin();
              }
            }}
            className="w-11 h-11 items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-full relative"
          >
            <Ionicons name="notifications-outline" size={22} color={isDark ? '#E5E7EB' : '#1f2937'} />
            {/* Unread count badge */}
            {unreadCount > 0 && (
              <View style={[
                styles.badgeContainer,
                isDark && styles.badgeContainerDark
              ]}>
                <Text style={[
                  styles.badgeText,
                  isDark && styles.badgeTextDark
                ]}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity 
            onPress={() => setIsSettingsVisible(true)}
            className="w-11 h-11 items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-full"
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={22} color={isDark ? '#E5E7EB' : '#1f2937'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Dropdown Popover */}
      <Modal
        visible={isSettingsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setIsSettingsVisible(false)}
        >
          <View style={[
            styles.dropdownContainer,
            isDark && styles.dropdownContainerDark
          ]}>
            {/* Theme Choice Item with Two Icons */}
            <View style={styles.dropdownItemRow}>
              <View className="flex-row items-center flex-1">
                <Ionicons name="color-palette-outline" size={18} color="#7B61FF" />
                <Text style={[
                  styles.dropdownLabel,
                  isDark && styles.dropdownTextDark
                ]}>
                  {language === 'vi' ? 'Giao diện' : 'Theme'}
                </Text>
              </View>
              
              <View style={[
                styles.themeOptionsContainer,
                isDark && styles.themeOptionsContainerDark
              ]}>
                {/* Sun (Light Mode) */}
                <TouchableOpacity 
                  style={[
                    styles.themeButton,
                    !isDark && styles.themeButtonActive
                  ]}
                  onPress={() => {
                    if (isDark) toggleTheme();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="sunny" 
                    size={14} 
                    color={!isDark ? "#FFFFFF" : "#7B61FF"} 
                  />
                </TouchableOpacity>

                {/* Moon (Dark Mode) */}
                <TouchableOpacity 
                  style={[
                    styles.themeButton,
                    isDark && styles.themeButtonActive
                  ]}
                  onPress={() => {
                    if (!isDark) toggleTheme();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="moon" 
                    size={14} 
                    color={isDark ? "#FFFFFF" : "#7B61FF"} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.divider, isDark && styles.dividerDark]} />

            {/* Language Choice Item with Two Options */}
            <View style={styles.dropdownItemRow}>
              <View className="flex-row items-center flex-1">
                <Ionicons name="globe-outline" size={18} color="#7B61FF" />
                <Text style={[
                  styles.dropdownLabel,
                  isDark && styles.dropdownTextDark
                ]}>
                  {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
                </Text>
              </View>
              
              <View style={[
                styles.themeOptionsContainer,
                isDark && styles.themeOptionsContainerDark
              ]}>
                {/* VI (Tiếng Việt) */}
                <TouchableOpacity 
                  style={[
                    styles.themeButton,
                    language === 'vi' && styles.themeButtonActive
                  ]}
                  onPress={() => {
                    if (language !== 'vi') setLanguage('vi');
                  }}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 'bold', 
                      color: language === 'vi' ? "#FFFFFF" : "#7B61FF" 
                    }}
                  >
                    VI
                  </Text>
                </TouchableOpacity>

                {/* EN (English) */}
                <TouchableOpacity 
                  style={[
                    styles.themeButton,
                    language === 'en' && styles.themeButtonActive
                  ]}
                  onPress={() => {
                    if (language !== 'en') setLanguage('en');
                  }}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 'bold', 
                      color: language === 'en' ? "#FFFFFF" : "#7B61FF" 
                    }}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EDE9FE', // violet-100
    borderColor: '#C084FC', // purple-400
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeContainerDark: {
    backgroundColor: '#2E1065', // dark purple-950
    borderColor: '#A855F7', // purple-500
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED', // violet-600
    textAlign: 'center',
    lineHeight: 11,
  },
  badgeTextDark: {
    color: '#D8B4FE', // purple-300
  },

  dropdownContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 104 : 60,
    right: 16,
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#EFEBF4',
  },
  dropdownContainerDark: {
    backgroundColor: '#1E1B4B',
    borderColor: '#312E81',
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
  },
  dropdownTextDark: {
    color: '#E5E7EB',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  dividerDark: {
    backgroundColor: '#312E81',
  },
  themeOptionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  themeOptionsContainerDark: {
    backgroundColor: '#0F0C20',
    borderColor: '#312E81',
  },
  themeButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeButtonActive: {
    backgroundColor: '#7B61FF',
  },
});
