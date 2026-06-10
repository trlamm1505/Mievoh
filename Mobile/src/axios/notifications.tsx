import api from '../config/axios/axiosConfig';

export interface Notification {
  notificationId: string;
  username: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  broadcastId: string | null;
}

export interface MyNotificationsResponse {
  data: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Lấy danh sách thông báo của người dùng (Có phân trang)
 * GET /api/notifications
 */
export const getMyNotificationsApi = async (params?: {
  page?: number;
  pageSize?: number;
}): Promise<MyNotificationsResponse> => {
  const response = await api.get<MyNotificationsResponse>('/notifications', {
    params: {
      ...params,
      _t: Date.now()
    }
  });
  return response.data;
};

/**
 * Đánh dấu đã đọc TẤT CẢ thông báo của người dùng
 * PUT /api/notifications/read-all
 */
export const markAllAsReadApi = async (): Promise<{ count: number }> => {
  const response = await api.put<{ count: number }>('/notifications/read-all');
  return response.data;
};

/**
 * Đánh dấu một thông báo cụ thể là đã đọc
 * PUT /api/notifications/:id/read
 */
export const markAsReadApi = async (id: string): Promise<Notification> => {
  const response = await api.put<Notification>(`/notifications/${id}/read`);
  return response.data;
};
