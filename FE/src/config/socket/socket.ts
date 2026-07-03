import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constant/constant.tsx';

// Get socket URL from API_BASE_URL
const getSocketUrl = (): string => {
  if (API_BASE_URL) {
    try {
      const url = new URL(API_BASE_URL);
      return url.origin;
    } catch (error) {
      console.error('Invalid VITE_API_BASE_URL format. Fallback to default socket URL.', error);
    }
  }
  return 'http://localhost:3069';
};

const SOCKET_URL = getSocketUrl();

console.log('Initializing Socket.io client at:', SOCKET_URL);

// Initialize socket client
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

// Helper function to connect with authentication token
export const connectSocket = (token?: string) => {
  if (token) {
    socket.auth = { token };
  } else {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      const cleanToken = savedToken.trim().replace(/^["']|["']$/g, '');
      socket.auth = { token: cleanToken };
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
