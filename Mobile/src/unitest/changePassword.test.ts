import api from '../config/axios/axiosConfig';
import { changePasswordApi, ChangePasswordPayload } from '../axios/auth';

// Mock the axiosConfig instance
jest.mock('../config/axios/axiosConfig', () => ({
  post: jest.fn(),
}));

describe('Change Password API Service Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('changePasswordApi', () => {
    it('should successfully call change password endpoint with payload', async () => {
      const payload: ChangePasswordPayload = {
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };
      const mockResponse = { message: 'Password changed successfully' };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await changePasswordApi(payload);

      expect(api.post).toHaveBeenCalledWith('/auth/change-password', payload);
      expect(result).toEqual(mockResponse);
    });
  });
});
