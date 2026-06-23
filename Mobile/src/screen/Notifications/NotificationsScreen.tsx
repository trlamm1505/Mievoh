import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  DeviceEventEmitter,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contextAPI/Auth/AuthContext';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';
import { useAppNavigation } from '../../navigation/navigation';
import { getMyNotificationsApi, markAsReadApi, markAllAsReadApi, Notification } from '../../axios/notifications';
import { emitMarkAsRead, emitMarkAllAsRead } from '../../components/Notifications/Notifications';
import Button from '../../components/Button/Button';

export default function NotificationsScreen() {
  const { isLoggedIn, user } = useAuth();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const navigation = useAppNavigation();
  const isDark = theme === 'dark';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (!isLoggedIn || !user?.email) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const res = await getMyNotificationsApi({ page: 1, pageSize: 50 });
      if (res && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications page:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLoggedIn, user?.email]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications(false);
  }, [fetchNotifications]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('sync-notifications', () => {
      fetchNotifications(false);
    });
    return () => {
      subscription.remove();
    };
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(false);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      // Optimistic update
      setNotifications(prev => prev.map(item => item.notificationId === id ? { ...item, isRead: true } : item));
      await markAsReadApi(id);
      
      // Notify header/app after database update completes
      DeviceEventEmitter.emit('sync-notifications');
      
      if (user?.email) {
        emitMarkAsRead(id, user.email);
      }
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  const handleNotiPress = async (n: Notification) => {
    // 1. Mark as read if not already read
    if (!n.isRead) {
      try {
        setNotifications(prev => prev.map(item => item.notificationId === n.notificationId ? { ...item, isRead: true } : item));
        await markAsReadApi(n.notificationId);
        DeviceEventEmitter.emit('sync-notifications');
        if (user?.email) {
          emitMarkAsRead(n.notificationId, user.email);
        }
      } catch (e) {
        console.error("Failed to mark as read:", e);
      }
    }

    // 2. Navigate
    const titleLower = n.title?.toLowerCase() || '';
    if (titleLower.includes('thanh toán thành công') || titleLower.includes('payment success') || n.link?.includes('tickets')) {
      navigation.goToMovieHistory();
    } else if (titleLower.includes('gợi ý phim') || titleLower.includes('gợi ý') || titleLower.includes('recommend') || n.link === '/') {
      navigation.goToHome();
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await markAllAsReadApi();
      
      // Notify header/app after database update completes
      DeviceEventEmitter.emit('sync-notifications');
      
      if (user?.email) {
        emitMarkAllAsRead(user.email);
      }
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isLoggedIn) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1F2937'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.textWhite]}>
            {language === 'vi' ? 'Thông báo' : 'Notifications'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={64} color="#A1A1AA" />
          <Text style={[styles.messageText, isDark && styles.textGray]}>
            {language === 'vi' ? 'Vui lòng đăng nhập để xem thông báo' : 'Please log in to view notifications'}
          </Text>
          <TouchableOpacity onPress={() => navigation.goToLogin()} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>
              {language === 'vi' ? 'Đăng nhập ngay' : 'Login now'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1F2937'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textWhite]}>
          {language === 'vi' ? 'Thông báo' : 'Notifications'}
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.readAllButton}>
            <Text style={styles.readAllText}>
              {language === 'vi' ? 'Đọc tất cả' : 'Read all'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Main content list */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7B61FF" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#7B61FF"
              colors={['#7B61FF']}
            />
          }
          contentContainerStyle={notifications.length === 0 ? { flex: 1 } : { paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}
        >
          {notifications.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="notifications-off-outline" size={72} color="#A1A1AA" />
              <Text style={[styles.emptyText, isDark && styles.textGray]}>
                {language === 'vi' ? 'Bạn không có thông báo nào' : 'You have no notifications'}
              </Text>
            </View>
          ) : (
            <>
              {displayedNotifications.map((n) => (
                <TouchableOpacity
                  key={n.notificationId}
                  activeOpacity={0.7}
                  onPress={() => handleNotiPress(n)}
                  style={[
                    styles.notiCard,
                    isDark && styles.notiCardDark,
                    !n.isRead && (isDark ? styles.unreadCardDark : styles.unreadCard)
                  ]}
                >
                  {/* Unread Indicator dot */}
                  <View style={[
                    styles.dot, 
                    !n.isRead && styles.unreadDot
                  ]} />
                  
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.notiTitle,
                      isDark && styles.textWhite,
                      !n.isRead && styles.fontBold
                    ]}>
                      {n.title}
                    </Text>
                    
                    <Text style={[
                      styles.notiMessage,
                      isDark && styles.textGray
                    ]}>
                      {n.message}
                    </Text>
                    
                    <Text style={styles.notiTime}>
                      {new Date(n.createdAt).toLocaleDateString(
                        language === 'vi' ? 'vi-VN' : 'en-US'
                      )} {new Date(n.createdAt).toLocaleTimeString(
                        language === 'vi' ? 'vi-VN' : 'en-US',
                        { hour: '2-digit', minute: '2-digit' }
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {!showAll && notifications.length > 5 && (
                <View style={styles.buttonContainer}>
                  <Button 
                    variant="primary" 
                    size="md"
                    onPress={() => setShowAll(true)}
                    className="w-3/4 self-center mt-4 mb-2"
                  >
                    {language === 'vi' ? 'Xem tất cả' : 'See all'}
                  </Button>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: '#0F0C20',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerDark: {
    backgroundColor: '#1E1B4B',
    borderColor: '#312E81',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  readAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  readAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7B61FF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#7B61FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notiCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  notiCardDark: {
    backgroundColor: '#161330',
    borderColor: '#1E1B4B',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C084FC',
  },
  unreadCardDark: {
    backgroundColor: '#1E1B4B',
    borderColor: '#8B5CF6',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    marginTop: 6,
    marginRight: 10,
  },
  unreadDot: {
    backgroundColor: '#7B61FF',
  },
  notiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  fontBold: {
    fontWeight: '800',
  },
  notiMessage: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
    lineHeight: 18,
  },
  notiTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 8,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textGray: {
    color: '#9CA3AF',
  },
});
