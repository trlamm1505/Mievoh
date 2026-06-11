import { useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { toast } from '../Toast/Toast';
import { socket } from '../../config/socket/socket';

export interface SocketNotificationPayload {
  title: string;
  message: string;
  link?: string | null;
}

export const useAppSocket = (email: string) => {
  useEffect(() => {
    if (!email) return;

    // Kết nối tới Socket server
    if (!socket.connected) {
      socket.connect();
    }

    // Khi kết nối thành công, xin gia nhập vào phòng riêng của user
    const handleConnect = () => {
      console.log('Socket connected. Joining room for user:', email);
      socket.emit('join_room', email);
    };

    const handleConnectError = (err: any) => {
      console.error('Socket connection error on Mobile:', err);
    };

    const handleDisconnect = (reason: string) => {
      console.log('Socket disconnected from server on Mobile. Reason:', reason);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);

    // Nếu socket đã kết nối sẵn từ trước, trực tiếp emit join_room
    if (socket.connected) {
      handleConnect();
    }

    // 1. THÔNG BÁO RIÊNG CHO TỪNG CÁ NHÂN (notification)
    const handlePersonalNotification = (payload: SocketNotificationPayload) => {
      console.log('Nhận thông báo cá nhân:', payload);
      toast.success(`${payload.title}\n${payload.message}`);
      DeviceEventEmitter.emit('sync-notifications', payload);
    };

    socket.on('notification', handlePersonalNotification);

    // 2. THÔNG BÁO CHO TOÀN BỘ HỆ THỐNG (broadcast_notification)
    const handleBroadcastNotification = (payload: SocketNotificationPayload) => {
      console.log('Nhận thông báo hệ thống:', payload);
      toast.show(`📢 ${payload.title}\n${payload.message}`, 'info', 5000);
      DeviceEventEmitter.emit('sync-notifications', payload);
    };

    socket.on('broadcast_notification', handleBroadcastNotification);

    // 3. THÔNG BÁO ĐÃ ĐỌC (mark_as_read)
    const handleNotificationRead = (payload: { notificationId?: string }) => {
      console.log('Nhận thông báo đã đọc từ socket:', payload);
      DeviceEventEmitter.emit('sync-notifications');
    };

    socket.on('mark_as_read', handleNotificationRead);

    // 4. THÔNG BÁO ĐÃ ĐỌC TẤT CẢ (mark_all_as_read)
    const handleNotificationReadAll = () => {
      console.log('Nhận thông báo đã đọc tất cả từ socket');
      DeviceEventEmitter.emit('sync-notifications');
    };

    socket.on('mark_all_as_read', handleNotificationReadAll);

    // Clean up kết nối và sự kiện khi unmount hoặc đổi user
    return () => {
      console.log('Leaving room and disconnecting socket for user:', email);
      socket.emit('leave_room', email);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('notification', handlePersonalNotification);
      socket.off('broadcast_notification', handleBroadcastNotification);
      socket.off('mark_as_read', handleNotificationRead);
      socket.off('mark_all_as_read', handleNotificationReadAll);
      socket.disconnect();
    };
  }, [email]);
};

// Component bao bọc ẩn danh để đặt vào cây React của toàn ứng dụng (nếu cần dùng dạng Component)
export default function SocketNotificationListener({ email }: { email: string }) {
  useAppSocket(email);
  return null;
}

/**
 * Gửi sự kiện lên BE để đánh dấu 1 thông báo là đã đọc
 * @param notificationId ID của thông báo
 * @param email Email của user
 */
export const emitMarkAsRead = (notificationId: string, email: string) => {
  if (socket.connected) {
    socket.emit('mark_as_read', { notificationId, email });
    console.log(`[Socket Emit] mark_as_read -> ID: ${notificationId}, User: ${email}`);
  } else {
    console.warn('[Socket] Không thể emit mark_as_read: Socket chưa kết nối');
  }
};

/**
 * Gửi sự kiện lên BE để đánh dấu tất cả thông báo là đã đọc
 * @param email Email của user
 */
export const emitMarkAllAsRead = (email: string) => {
  if (socket.connected) {
    socket.emit('mark_all_as_read', { email });
    console.log(`[Socket Emit] mark_all_as_read -> User: ${email}`);
  } else {
    console.warn('[Socket] Không thể emit mark_all_as_read: Socket chưa kết nối');
  }
};
