import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation } from '../../../navigation/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBookingHistoryApi, BookingHistoryItem } from '../../../axios/profile';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';
import { useAuth } from '../../../contextAPI/Auth/AuthContext';
import { BookingRepository } from '../../../SQLite/repositories/BookingRepository';

export default function MovieHistory() {
  const navigation = useAppNavigation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  const { user } = useAuth();

  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [history, setHistory] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Sync with server (will only write if there are changes)
    BookingRepository.syncBookingsWithServer(user.username)
      .then(() => {
        const updated = BookingRepository.getBookings(user.username);
        setHistory(updated);
      })
      .catch((err) => {
        console.error('Error syncing booking history, loading cached SQLite version:', err);
        const cached = BookingRepository.getBookings(user.username);
        setHistory(cached);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.username]);

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  // Helper to render status badge
  const renderStatusBadge = (status: 'Paid' | 'Pending' | 'Cancelled') => {
    let bg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5';
    let borderColor = '#10B981';
    let textColor = '#10B981';
    let label = t('paid_status');

    if (status === 'Pending') {
      bg = isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7';
      borderColor = '#F59E0B';
      textColor = '#F59E0B';
      label = language === 'vi' ? 'Chờ thanh toán' : 'Pending';
    } else if (status === 'Cancelled') {
      bg = isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2';
      borderColor = '#EF4444';
      textColor = '#EF4444';
      label = language === 'vi' ? 'Đã hủy' : 'Cancelled';
    }

    return (
      <View 
        style={{ backgroundColor: bg, borderColor, borderWidth: 1 }}
        className="px-2.5 py-0.5 rounded-full"
      >
        <Text style={{ color: textColor }} className="text-[10px] font-bold">{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView 
      edges={['top']} 
      style={{ backgroundColor: isDark ? '#0F0C20' : '#F9FAFB' }}
      className="flex-1"
    >
      {/* Header bar */}
      <View 
        style={{ 
          backgroundColor: isDark ? '#0F0C20' : '#FFFFFF', 
          borderBottomColor: isDark ? '#2E2856' : '#F3F4F6',
          borderBottomWidth: 1
        }}
        className="flex-row items-center justify-between px-4 py-4"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <Ionicons name="arrow-back" size={24} color={isDark ? "#F3F4F6" : "#1f2937"} />
        </TouchableOpacity>
        <Text 
          style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
          className="text-lg font-bold"
        >
          {t('ticket_history_title')}
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#7B61FF" />
          </View>
        ) : history.length === 0 ? (
          <View 
            style={{ 
              backgroundColor: isDark ? '#1D183B' : '#FFFFFF', 
              borderColor: isDark ? '#2E2856' : '#F3F4F6',
              borderWidth: 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
            className="items-center justify-center py-20 rounded-3xl"
          >
            <Ionicons name="ticket-outline" size={64} color="#7B61FF" className="opacity-40 mb-4" />
            <Text 
              style={{ color: isDark ? '#F3F4F6' : '#4B5563' }}
              className="text-base font-bold mb-1"
            >
              {language === 'vi' ? 'Không có lịch sử xem phim' : 'No watch history'}
            </Text>
            <Text className="text-xs text-gray-400 text-center px-6">
              {language === 'vi' 
                ? 'Bạn chưa đặt vé xem phim nào. Đặt vé ngay hôm nay để tích lũy điểm thưởng!'
                : 'You have not booked any tickets yet. Book tickets today to earn reward points!'}
            </Text>
          </View>
        ) : (
          history.map((record) => {
            const showDateTime = new Date(record.Showtime.showDateTime);
            const formattedTime = showDateTime.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
            const formattedDate = showDateTime.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const seats = record.BookingDetails.map(d => d.Seat?.name || '').filter(Boolean);
            
            const movieTitle = language === 'vi' 
              ? (record.Showtime.Movie.title_vi || record.Showtime.Movie.title_en)
              : (record.Showtime.Movie.title_en || record.Showtime.Movie.title_vi);

            const comboList = record.BookingFoods.map(f => `${f.quantity}x ${f.Food?.name || ''}`).filter(Boolean).join(', ');
            const combos = comboList || (language === 'vi' ? 'Không' : 'None');
            
            const status: 'Paid' | 'Pending' | 'Cancelled' = 
              (record.paymentStatus === 'Success' || record.paymentStatus === 'Failed') ? 'Paid' :
              record.paymentStatus === 'Pending' ? 'Pending' : 'Cancelled';

            return (
              <View 
                key={record.bookingId} 
                style={{
                  backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
                  borderColor: isDark ? '#2E2856' : '#F3F4F6',
                  borderWidth: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                className="rounded-3xl mb-4 overflow-hidden"
              >
                {/* Top part: Movie details */}
                <View className="flex-row p-4">
                  <Image 
                    source={{ uri: record.Showtime.Movie.imageUrl }} 
                    className="w-16 h-24 rounded-2xl mr-4 bg-gray-100" 
                    resizeMode="cover"
                  />
                  <View className="flex-1 justify-between py-1">
                    <View>
                      <View className="flex-row justify-between items-start mb-1">
                        <Text 
                          style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                          className="text-base font-extrabold flex-1 mr-2" 
                          numberOfLines={1}
                        >
                          {movieTitle}
                        </Text>
                        {renderStatusBadge(status)}
                      </View>
                      <Text 
                        style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                        className="text-xs font-semibold mb-1" 
                        numberOfLines={1}
                      >
                        {record.Showtime.Cinema.CinemaComplex.name}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={13} color="#7B61FF" className="mr-1" />
                      <Text 
                        style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                        className="text-xs font-bold mr-3"
                      >
                        {formattedTime}
                      </Text>
                      <Ionicons name="calendar-outline" size={13} color="#7B61FF" className="mr-1" />
                      <Text 
                        style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                        className="text-xs font-bold"
                      >
                        {formattedDate}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Dashed divider */}
                <View className="flex-row items-center px-4">
                  <View 
                    style={{ 
                      backgroundColor: isDark ? '#0F0C20' : '#F9FAFB',
                      borderColor: isDark ? '#2E2856' : '#F3F4F6',
                      borderWidth: 1
                    }} 
                    className="w-4 h-4 rounded-full -ml-6" 
                  />
                  <View 
                    style={{ borderTopColor: isDark ? '#2E2856' : '#E5E7EB' }}
                    className="flex-1 border-t border-dashed mx-1" 
                  />
                  <View 
                    style={{ 
                      backgroundColor: isDark ? '#0F0C20' : '#F9FAFB',
                      borderColor: isDark ? '#2E2856' : '#F3F4F6',
                      borderWidth: 1
                    }} 
                    className="w-4 h-4 rounded-full -mr-6" 
                  />
                </View>

                {/* Bottom part: Ticket details */}
                <View 
                  style={{ backgroundColor: isDark ? '#241F48' : 'rgba(249, 250, 251, 0.3)' }}
                  className="p-4 gap-2"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-gray-400">{language === 'vi' ? 'Mã đặt vé' : 'Ticket code'}</Text>
                    <TouchableOpacity 
                      onPress={() => setSelectedTicket(record.ticketCode)}
                      style={{ backgroundColor: isDark ? '#2E2856' : '#F3E8FF' }}
                      className="p-1.5 rounded-xl active:opacity-70"
                    >
                      <Ionicons name="qr-code-outline" size={22} color="#7B61FF" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-400">{language === 'vi' ? 'Ghế đã chọn' : 'Selected seats'}</Text>
                    <Text 
                      style={{ color: isDark ? '#F3F4F6' : '#374151' }}
                      className="text-xs font-bold"
                    >
                      {seats.join(', ')}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-400">{language === 'vi' ? 'Combo đi kèm' : 'Attached combos'}</Text>
                    <Text 
                      style={{ color: isDark ? '#F3F4F6' : '#374151' }}
                      className="text-xs font-semibold"
                    >
                      {combos}
                    </Text>
                  </View>

                  <View 
                    style={{ borderTopColor: isDark ? '#2E2856' : '#F3F4F6' }}
                    className="flex-row justify-between border-t pt-2 mt-1"
                  >
                    <Text 
                      style={{ color: isDark ? '#F3F4F6' : '#374151' }}
                      className="text-xs font-bold"
                    >
                      {language === 'vi' ? 'Tổng thanh toán' : 'Total Price'}
                    </Text>
                    <Text className="text-sm font-extrabold text-[#7B61FF]">{formatCurrency(record.totalPrice)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Barcode Modal Overlay */}
      <Modal
        visible={!!selectedTicket}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedTicket(null)}>
          <View 
            className="flex-1 justify-center items-center px-6"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          >
            <TouchableWithoutFeedback>
              <View 
                style={{
                  backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
                  borderColor: isDark ? '#2E2856' : 'rgba(243, 244, 246, 0.6)',
                  borderWidth: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.15,
                  shadowRadius: 15,
                  elevation: 10,
                }}
                className="rounded-[28px] p-6 w-full max-w-[340px] items-center"
              >
                {/* Barcode dynamic pattern (taller, bolder) */}
                <View className="flex-row items-center justify-center h-28 mb-5 mt-2">
                  {[2, 1, 3, 1, 2, 2, 1, 4, 1, 2, 1, 3, 2, 1, 1, 3, 2, 2, 1, 4, 1, 2, 1, 3, 2, 1, 1, 3, 2, 2, 1, 4, 1].map((w, i) => (
                    <View
                      key={i}
                      style={{
                        width: w * 2.8,
                        height: 90,
                        backgroundColor: i % 2 === 0 ? (isDark ? '#F3F4F6' : '#000000') : 'transparent',
                        marginRight: i % 2 === 0 ? 1.5 : 2.5,
                      }}
                    />
                  ))}
                </View>

                {/* Ticket code */}
                <Text className="text-sm font-extrabold text-[#7B61FF] text-center uppercase tracking-wider mt-2">
                  {selectedTicket || ''}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
