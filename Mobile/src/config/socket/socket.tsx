import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constant/constant';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get socket URL from API_BASE_URL
const getSocketUrl = (): string => {
  if (API_BASE_URL) {
    try {
      const url = new URL(API_BASE_URL);
      return url.origin;
    } catch (error) {
      console.log('Invalid API_BASE_URL format. Fallback to default socket URL.', error);
    }
  }
  return 'http://localhost:3069';
};

const SOCKET_URL = getSocketUrl();

console.log('Initializing Mobile Socket.io client at:', SOCKET_URL);

// Initialize socket client
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

// Helper function to connect with authentication token
export const connectSocket = async (token?: string) => {
  if (token) {
    socket.auth = { token };
  } else {
    try {
      const savedToken = await AsyncStorage.getItem('accessToken');
      if (savedToken) {
        const cleanToken = savedToken.trim().replace(/^["']|["']$/g, '');
        socket.auth = { token: cleanToken };
      }
    } catch (e) {
      console.error('Error reading token from AsyncStorage', e);
    }
  }
  
  if (!socket.connected) {
    socket.connect();
  }
};

// Helper function to disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
