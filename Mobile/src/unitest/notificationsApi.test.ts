import api from '../config/axios/axiosConfig';
import {
  getMyNotificationsApi,
  markAllAsReadApi,
  markAsReadApi,
  Notification,
  MyNotificationsResponse,
} from '../axios/notifications';

// Mock the axiosConfig instance
jest.mock('../config/axios/axiosConfig', () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

describe('Notifications API Service Tests', () => {
  const mockNotification: Notification = {
    notificationId: 'notif1',
    email: 'user@mievoh.com',
    title: 'New Movie Released',
    message: 'Check out the new releases today!',
    link: '/movies/m1',
    isRead: false,
    createdAt: '2026-06-25T12:00:00Z',
    broadcastId: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyNotificationsApi', () => {
    it('should successfully fetch user notifications', async () => {
      const mockResponse: MyNotificationsResponse = {
        data: [mockNotification],
        total: 1,
        unreadCount: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await getMyNotificationsApi({ page: 1, pageSize: 10 });

      expect(api.get).toHaveBeenCalledWith('/notifications', expect.objectContaining({
        params: expect.objectContaining({
          page: 1,
          pageSize: 10,
          _t: expect.any(Number),
        }),
      }));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAllAsReadApi', () => {
    it('should successfully mark all notifications as read', async () => {
      const mockResponse = { count: 5 };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await markAllAsReadApi();

      expect(api.put).toHaveBeenCalledWith('/notifications/read-all');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAsReadApi', () => {
    it('should successfully mark a specific notification as read', async () => {
      const mockResponse: Notification = {
        ...mockNotification,
        isRead: true,
      };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await markAsReadApi('notif1');

      expect(api.put).toHaveBeenCalledWith('/notifications/notif1/read');
      expect(result).toEqual(mockResponse);
    });
  });
});
