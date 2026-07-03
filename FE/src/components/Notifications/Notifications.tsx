import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { socket } from '../../config/socket/socket';

export interface SocketNotificationPayload {
  title: string;
  message: string;
  link?: string | null;
}

export const useAppSocket = (email: string) => {
  useEffect(() => {
    if (!email) return;

    // -----------------------------------------------------
    // ĐĂNG KÝ VÀO PHÒNG CÁ NHÂN (ROOM_{email})
    // -----------------------------------------------------
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
      console.error('Socket connection error on Web:', err);
    };

    const handleDisconnect = (reason: string) => {
      console.log('Socket disconnected from server on Web. Reason:', reason);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);

    // Nếu socket đã kết nối sẵn từ trước, trực tiếp emit join_room
    if (socket.connected) {
      handleConnect();
    }

    // -----------------------------------------------------
    // 1. THÔNG BÁO RIÊNG CHO TỪNG CÁ NHÂN (notification)
    // -----------------------------------------------------
    const handlePersonalNotification = (payload: SocketNotificationPayload) => {
      console.log('Nhận thông báo cá nhân:', payload);
      
      // Hiển thị toast thông báo đẹp mắt
      toast.success(
        (t) => (
          <div onClick={() => toast.dismiss(t.id)} className="cursor-pointer">
            <p className="font-bold text-sm text-white">{payload.title}</p>
            <p className="text-xs text-violet-100 mt-0.5">{payload.message}</p>
            {payload.link && (
              <a
                href={payload.link}
                className="text-xs font-semibold text-white underline block mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
              >
                Xem chi tiết →
              </a>
            )}
          </div>
        ),
        {
          duration: 6000,
          position: 'top-right',
        }
      );

      // Phát sự kiện đồng bộ thông báo trong ứng dụng (để Header cập nhật lại danh sách)
      window.dispatchEvent(new CustomEvent('sync-notifications', { detail: payload }));
    };

    socket.on('notification', handlePersonalNotification);

    // -----------------------------------------------------
    // 2. THÔNG BÁO CHO TOÀN BỘ HỆ THỐNG (broadcast_notification)
    // -----------------------------------------------------
    const handleBroadcastNotification = (payload: SocketNotificationPayload) => {
      console.log('Nhận thông báo hệ thống:', payload);
      
      // Hiển thị toast cho thông báo toàn hệ thống
      toast(
        (t) => (
          <div onClick={() => toast.dismiss(t.id)} className="cursor-pointer">
            <p className="font-bold text-sm text-violet-950 dark:text-zinc-100 flex items-center gap-1.5">
              📢 {payload.title}
            </p>
            <p className="text-xs text-violet-900 dark:text-zinc-300 mt-0.5">{payload.message}</p>
            {payload.link && (
              <a
                href={payload.link}
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline block mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
              >
                Xem chi tiết →
              </a>
            )}
          </div>
        ),
        {
          duration: 8000,
          position: 'top-right',
          icon: '📢',
        }
      );

      // Phát sự kiện đồng bộ thông báo trong ứng dụng (để Header cập nhật lại danh sách)
      window.dispatchEvent(new CustomEvent('sync-notifications', { detail: payload }));
    };

    socket.on('broadcast_notification', handleBroadcastNotification);

    // 3. THÔNG BÁO ĐÃ ĐỌC (mark_as_read)
    const handleNotificationRead = (payload: { notificationId?: string }) => {
      console.log('Nhận thông báo đã đọc từ socket:', payload);
      window.dispatchEvent(new CustomEvent('sync-notifications'));
    };

    socket.on('mark_as_read', handleNotificationRead);

    // 4. THÔNG BÁO ĐÃ ĐỌC TẤT CẢ (mark_all_as_read)
    const handleNotificationReadAll = () => {
      console.log('Nhận thông báo đã đọc tất cả từ socket');
      window.dispatchEvent(new CustomEvent('sync-notifications'));
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

// -----------------------------------------------------
// CÁC EMITTER GỬI LÊN BACKEND (ĐỂ ĐÁNH DẤU ĐÃ ĐỌC)
// -----------------------------------------------------

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

