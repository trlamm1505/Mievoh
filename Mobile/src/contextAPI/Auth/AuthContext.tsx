import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserResponse, AuthResponse } from '../../axios/auth';
import api from '../../config/axios/axiosConfig';
import { getProfileApi, updateProfileApi } from '../../axios/profile';

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserResponse | null;
  login: (authData: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (avatarUri: string) => Promise<void>;
  updateUser: (updatedFields: Partial<UserResponse>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const formatDobFromBackend = (dobStr: string | null): string => {
  if (!dobStr) return "";
  try {
    const date = new Date(dobStr);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};

const formatDobForBackend = (dobString: string): string | undefined => {
  if (!dobString) return undefined;
  const parts = dobString.split("/");
  if (parts.length === 3) {
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dobString;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setUser(null);
  };

  useEffect(() => {
    // Load login state and user from storage
    Promise.all([
      AsyncStorage.getItem('isLoggedIn'),
      AsyncStorage.getItem('user'),
    ]).then(async ([isLoggedInVal, userVal]) => {
      if (isLoggedInVal === 'true') {
        setIsLoggedIn(true);
      }
      if (userVal) {
        let parsedUser = JSON.parse(userVal);
        try {
          const localAvatar = await AsyncStorage.getItem(`avatar_${parsedUser.email}`);
          if (localAvatar) {
            parsedUser.avatar = localAvatar;
          }
        } catch (e) {
          console.error('Error loading local avatar', e);
        }
        setUser(parsedUser);

        // Fetch fresh profile from backend
        if (isLoggedInVal === 'true') {
          try {
            const freshProfile = await getProfileApi();
            const profileData = freshProfile?.data || freshProfile;
            if (profileData && profileData.email) {
              const syncedUser: UserResponse = {
                fullName: profileData.fullName,
                email: profileData.email,
                avatar: profileData.avatar || parsedUser.avatar,
                userType: profileData.userType,
                phoneNumber: profileData.phoneNumber,
                gender: profileData.gender,
                dob: profileData.dateOfBirth ? formatDobFromBackend(profileData.dateOfBirth) : (profileData.dob || parsedUser.dob),
                address: profileData.address,
                cccd: profileData.cccd,
              };
              setUser(syncedUser);
              await AsyncStorage.setItem('user', JSON.stringify(syncedUser));
            }
          } catch (err) {
            console.log('[AUTH] Failed to sync fresh profile from backend:', err);
          }
        }
      }
      setLoading(false);
    });

    // Interceptor to handle automatic logout when token expires (401 Unauthorized)
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          console.log('[AUTH] Token expired or unauthorized. Logging out...');
          await logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (authData: AuthResponse) => {
    if (authData?.token?.accessToken) {
      await AsyncStorage.setItem('accessToken', authData.token.accessToken);
    }
    if (authData?.token?.refreshToken) {
      await AsyncStorage.setItem('refreshToken', authData.token.refreshToken);
    }
    
    let userData = authData.user;
    if (userData) {
      try {
        const localAvatar = await AsyncStorage.getItem(`avatar_${userData.email}`);
        if (localAvatar) {
          userData = { ...userData, avatar: localAvatar };
        }
      } catch (e) {
        console.error('Error getting local avatar during login', e);
      }
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    }
    
    await AsyncStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
    setUser(userData);
  };

  const updateAvatar = async (avatarUri: string) => {
    if (user) {
      const updatedUser = { ...user, avatar: avatarUri };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await AsyncStorage.setItem(`avatar_${user.email}`, avatarUri);
    }
  };

  const updateUser = async (updatedFields: Partial<UserResponse>) => {
    if (user) {
      try {
        const apiData = {
          fullName: updatedFields.fullName || undefined,
          phoneNumber: updatedFields.phoneNumber || undefined,
          gender: updatedFields.gender || undefined,
          dateOfBirth: updatedFields.dob ? formatDobForBackend(updatedFields.dob) : undefined,
          address: updatedFields.address || undefined,
          cccd: updatedFields.cccd || undefined,
          avatar: updatedFields.avatar || undefined,
        };
        const res = await updateProfileApi(apiData);

        const syncedUser: UserResponse = {
          ...user,
          fullName: res.data?.fullName ?? updatedFields.fullName ?? null,
          phoneNumber: res.data?.phoneNumber ?? updatedFields.phoneNumber ?? null,
          gender: res.data?.gender ?? updatedFields.gender ?? null,
          dob: res.data?.dateOfBirth ? formatDobFromBackend(res.data.dateOfBirth) : (updatedFields.dob ?? null),
          address: res.data?.address ?? updatedFields.address ?? null,
          cccd: res.data?.cccd ?? updatedFields.cccd ?? null,
          avatar: res.data?.avatar ?? updatedFields.avatar ?? null,
        };

        setUser(syncedUser);
        await AsyncStorage.setItem('user', JSON.stringify(syncedUser));
      } catch (error) {
        console.error('Failed to update profile via API:', error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, updateAvatar, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
